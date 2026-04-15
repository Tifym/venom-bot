import asyncio
import json
import time
import structlog
import websockets
from typing import Callable, Optional, Dict
from ..database.redis_client import redis_client

logger = structlog.get_logger()

class WebSocketConnection:
    def __init__(self, name: str, url: str, subscription_msg: Optional[dict] = None):
        self.name = name
        self.url = url
        self.subscription_msg = subscription_msg
        self.ws = None
        self.state = "CONNECTING"
        self.last_msg_time = 0.0
        
        self.failures = 0
        self.reconnect_delay = 1
        self.max_delay = 30
        self.is_circuit_open = False
        
        self.callbacks = []
        self.ping_msg = None
        self.ping_interval = 20

    def set_state(self, new_state: str):
        if self.state != new_state:
            self.state = new_state
            logger.info(f"ws_state_change", source=self.name, state=self.state)
            asyncio.create_task(self.broadcast_state())

    async def broadcast_state(self):
        if redis_client.client:
            payload = json.dumps({"source": self.name, "state": self.state})
            await redis_client.client.publish("venom_ws_status", payload)

    async def _health_check_loop(self):
        while True:
            await asyncio.sleep(5)
            if self.state in ["CONNECTED", "HEALTHY", "STALE"]:
                age = time.time() - self.last_msg_time
                if age > 30:
                    self.set_state("STALE")
                elif age <= 10:
                    self.set_state("HEALTHY")

    async def connect(self):
        asyncio.create_task(self._health_check_loop())
        while True:
            if self.failures >= 5:
                logger.error(f"{self.name}_circuit_breaker_open")
                self.is_circuit_open = True
                await asyncio.sleep(60)
                self.failures = 0
                self.is_circuit_open = False
                
            self.set_state("CONNECTING")
            try:
                async with websockets.connect(self.url, ping_interval=20, ping_timeout=10) as ws:
                    self.ws = ws
                    self.set_state("CONNECTED")
                    
                    if self.subscription_msg:
                        await ws.send(json.dumps(self.subscription_msg))
                        logger.info(f"{self.name}_subscription_sent")

                    self.failures = 0
                    self.reconnect_delay = 1
                    
                    # Optional Heartbeat Task
                    ping_task = None
                    if self.ping_msg:
                        ping_task = asyncio.create_task(self._ping_loop())

                    try:
                        async for message in ws:
                            self.last_msg_time = time.time()
                            if self.state != "HEALTHY":
                                self.set_state("HEALTHY")
                                
                            try:
                                data = json.loads(message)
                                for cb in self.callbacks:
                                    asyncio.create_task(cb(self.name, data))
                            except json.JSONDecodeError:
                                # Some servers send raw strings or heartbeats
                                pass
                    finally:
                        if ping_task:
                            ping_task.cancel()
                            
            except Exception as e:
                self.set_state("RECONNECTING")
                self.failures += 1
                logger.error(f"{self.name}_connection_error", error=str(e), attempt=self.failures)
                
                await asyncio.sleep(self.reconnect_delay)
                self.reconnect_delay = min(self.reconnect_delay * 2, self.max_delay)

    async def _ping_loop(self):
        """Keep subscription-based connections alive with app-level pings."""
        while self.ws and not self.ws.closed:
            await asyncio.sleep(self.ping_interval)
            try:
                if self.ping_msg:
                    await self.ws.send(json.dumps(self.ping_msg))
            except:
                break


class MultiWebSocketManager:
    def __init__(self):
        self.connections: Dict[str, WebSocketConnection] = {}
        self.global_state = "OK"

    def add_source(self, name: str, url: str, subscription_msg: Optional[dict] = None, ping_msg: Optional[dict] = None):
        conn = WebSocketConnection(name, url, subscription_msg)
        conn.ping_msg = ping_msg
        self.connections[name] = conn

    def add_callback(self, name: str, cb: Callable):
        if name in self.connections:
            self.connections[name].callbacks.append(cb)

    async def start_all(self):
        asyncio.create_task(self._global_health_loop())
        tasks = [conn.connect() for conn in self.connections.values()]
        await asyncio.gather(*tasks)

    async def _global_health_loop(self):
        while True:
            await asyncio.sleep(5)
            all_dead = True
            for conn in self.connections.values():
                age = time.time() - conn.last_msg_time
                if age < 30:
                    all_dead = False
                    break
                    
            new_global = "DATA_STARVED" if all_dead else "OK"
            if self.global_state != new_global:
                self.global_state = new_global
                logger.warning(f"global_state_changed", state=self.global_state)
                # Broadcast global state
                if redis_client.client:
                    payload = json.dumps({"type": "global_state", "state": self.global_state})
                    await redis_client.client.publish("venom_ws_status", payload)

    @property
    def is_healthy(self) -> bool:
        return any(c.state == "HEALTHY" for c in self.connections.values())
