import redis.asyncio as redis
import structlog
from typing import Optional
from ..config.settings import settings

logger = structlog.get_logger()

class RedisClient:
    def __init__(self):
        self.url = settings.REDIS_URL
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        try:
            self.client = redis.from_url(self.url, decode_responses=True)
            await self.client.ping()
            logger.info("redis_connected", url=self.url)
        except Exception as e:
            logger.error("redis_connection_failed", error=str(e))
            self.client = None

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def set(self, key: str, value: str, ex: int = None):
        if self.client:
            await self.client.set(key, value, ex=ex)

    async def get(self, key: str) -> Optional[str]:
        if self.client:
            return await self.client.get(key)
        return None

redis_client = RedisClient()
