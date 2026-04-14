import asyncio
import json
import structlog
import websockets
from typing import Callable, Dict, Any, Optional

logger = structlog.get_logger()

class WebSocketManager:
    def __init__(self, url: str, name: str, fallback_url: Optional[str] = None):
        self.url = url
        self.name = name
        self.fallback_url = fallback_url
        self.ws = None
        self.callbacks: list[Callable] = []
        self.is_connected = False
        
        self.reconnect_delay = 1
        self.max_reconnect_delay = 30
        self.failure_count = 0
        self.max_failures = 5

    def add_callback(self, cb: Callable):
        self.callbacks.append(cb)

    async def connect(self):
        while True:
            try:
                if self.failure_count >= self.max_failures:
                    logger.error(f"{self.name}_circuit_breaker_open", failures=self.failure_count)
                    await asyncio.sleep(30) # Circuit breaker cooldown
                    self.failure_count = 0
                    
                logger.info(f"connecting_to_{self.name}", url=self.url)
                
                async with websockets.connect(self.url, ping_interval=30, ping_timeout=10) as ws:
                    self.ws = ws
                    self.is_connected = True
                    self.reconnect_delay = 1 # Reset backoff
                    self.failure_count = 0
                    logger.info(f"{self.name}_connected")
                    
                    await self._listen()
                    
            except Exception as e:
                self.is_connected = False
                self.failure_count += 1
                logger.error(f"{self.name}_connection_error", error=str(e), attempt=self.failure_count)
                
                # Exponential backoff
                await asyncio.sleep(self.reconnect_delay)
                self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)

    async def _listen(self):
        try:
            async for message in self.ws:
                data = json.loads(message)
                for cb in self.callbacks:
                    asyncio.create_task(cb(data))
        except websockets.exceptions.ConnectionClosed:
            logger.warning(f"{self.name}_connection_closed")
        finally:
            self.is_connected = False

    async def disconnect(self):
        if self.ws:
            await self.ws.close()
            self.is_connected = False
