from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .enums import SignalDirection, VenomZone, SignalMode, DivergenceType

class ConfluenceMetrics(BaseModel):
    divergence_score: int = 0
    divergence_tfs: List[str] = []
    divergence_type: DivergenceType = DivergenceType.NONE

    orderbook_score: int = 0
    orderbook_ratio: float = 0.0

    volume_score: int = 0
    volume_surge: float = 0.0

    funding_score: int = 0
    funding_rate: float = 0.0

    price_action_score: int = 0
    liquidation_boost: int = 0

class VenomSignal(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    direction: SignalDirection
    mode: SignalMode
    zone: str  # plain string — alpha/beta/gamma/delta/omega

    total_score: int = Field(..., ge=0)  # removed le=110, scores can exceed with boosts
    confluence: ConfluenceMetrics

    entry_low: float
    entry_high: float
    stop_loss: float
    tp1: float
    tp2: float
    tp3: Optional[float] = None

    status: str = "PENDING"
    pnl_r: Optional[float] = None
