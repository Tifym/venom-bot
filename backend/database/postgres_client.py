import structlog
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Float, Integer, DateTime
from ..config.settings import settings

logger = structlog.get_logger()

Base = declarative_base()

class SignalRecord(Base):
    __tablename__ = 'signals'
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, nullable=False)
    direction = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    zone = Column(String, nullable=False)
    total_score = Column(Integer, nullable=False)
    entry_low = Column(Float, nullable=False)
    entry_high = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    tp1 = Column(Float, nullable=False)
    tp2 = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="PENDING")

class PostgresClient:
    def __init__(self):
        # Convert postgresql:// to postgresql+asyncpg://
        self.url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        self.engine = None
        self.async_session = None

    async def connect(self):
        try:
            self.engine = create_async_engine(self.url, echo=False)
            self.async_session = sessionmaker(
                self.engine, expire_on_commit=False, class_=AsyncSession
            )
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("postgres_connected", url=settings.DATABASE_URL)
        except Exception as e:
            logger.error("postgres_connection_failed", error=str(e))
            self.engine = None

    async def disconnect(self):
        if self.engine:
            await self.engine.dispose()

postgres_client = PostgresClient()
