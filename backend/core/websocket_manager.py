import asyncio
import json
import time
import structlog
import websockets
from typing import Callable, Optional, Dict
from ..database.redis_client import redis_client

logger = structlog.get_logger()

class WebSocketConnection:
    def __init__(self, name: str, url: str):
        self.name = name
        self.url = url
        self.ws = None
        self.state = "CONNECTING"
        self.last_msg_time = 0.0
        
        self.failures = 0
        self.reconnect_delay = 1
        self.max_delay = 30
        self.is_circuit_open = False
        
        self.callbacks = []

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
                if age > 5:
                    self.set_state("STALE")
                elif age <= 3:
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
                    self.failures = 0
                    self.reconnect_delay = 1
                    
                    async for message in ws:
                        self.last_msg_time = time.time()
                        if self.state != "HEALTHY":
                            self.set_state("HEALTHY")
                            
                        data = json.loads(message)
                        for cb in self.callbacks:
                            asyncio.create_task(cb(self.name, data))
                            
            except Exception as e:
                self.set_state("RECONNECTING")
                self.failures += 1
                logger.error(f"{self.name}_connection_error", error=str(e), attempt=self.failures)
                
                await asyncio.sleep(self.reconnect_delay)
                self.reconnect_delay = min(self.reconnect_delay * 2, self.max_delay)


class MultiWebSocketManager:
    def __init__(self):
        self.connections: Dict[str, WebSocketConnection] = {}
        self.global_state = "OK"

    def add_source(self, name: str, url: str):
        self.connections[name] = WebSocketConnection(name, url)

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
