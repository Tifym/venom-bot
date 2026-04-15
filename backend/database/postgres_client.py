import structlog
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Float, Integer, DateTime, select, desc
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

class DrawingRecord(Base):
    __tablename__ = 'drawings'
    
    id = Column(String, primary_key=True)
    type = Column(String, nullable=False) # 'horizontal', 'trend', 'fib'
    data = Column(String, nullable=False) # JSON encoded coordinates
    timeframe = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)

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

    async def save_signal(self, s):
        if not self.async_session: return
        async with self.async_session() as session:
            try:
                record = SignalRecord(
                    id=s.id,
                    timestamp=s.timestamp,
                    direction=s.direction.name if hasattr(s.direction, 'name') else str(s.direction),
                    mode=s.mode.name if hasattr(s.mode, 'name') else str(s.mode),
                    zone=s.zone,
                    total_score=s.total_score,
                    entry_low=s.entry_low,
                    entry_high=s.entry_high,
                    stop_loss=s.stop_loss,
                    tp1=s.tp1,
                    tp2=s.tp2,
                    status=getattr(s, 'status', 'PENDING')
                )
                session.add(record)
                await session.commit()
            except Exception as e:
                logger.error("signal_save_failed", error=str(e))

    async def get_recent_signals(self, limit=50):
        if not self.async_session: return []
        async with self.async_session() as session:
            try:
                stmt = select(SignalRecord).order_by(desc(SignalRecord.timestamp)).limit(limit)
                result = await session.execute(stmt)
                return result.scalars().all()
            except Exception as e:
                logger.error("signal_load_failed", error=str(e))
                return []

    async def save_drawing(self, d_id, d_type, d_data, tf):
        if not self.async_session: return
        from datetime import datetime
        async with self.async_session() as session:
            try:
                record = DrawingRecord(
                    id=d_id,
                    type=d_type,
                    data=d_data,
                    timeframe=tf,
                    created_at=datetime.utcnow()
                )
                await session.merge(record) # Merge handles update if exists
                await session.commit()
            except Exception as e:
                logger.error("drawing_save_failed", error=str(e))

    async def get_drawings(self, tf=None):
        if not self.async_session: return []
        async with self.async_session() as session:
            try:
                stmt = select(DrawingRecord)
                if tf: stmt = stmt.where(DrawingRecord.timeframe == tf)
                result = await session.execute(stmt)
                return result.scalars().all()
            except Exception as e:
                logger.error("drawings_load_failed", error=str(e))
                return []

    async def delete_drawing(self, d_id):
        if not self.async_session: return
        from sqlalchemy import delete
        async with self.async_session() as session:
            try:
                stmt = delete(DrawingRecord).where(DrawingRecord.id == d_id)
                await session.execute(stmt)
                await session.commit()
            except Exception as e:
                logger.error("drawing_delete_failed", error=str(e))

postgres_client = PostgresClient()
