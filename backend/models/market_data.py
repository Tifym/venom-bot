from pydantic import BaseModel
from typing import List, Tuple
from datetime import datetime

class OrderBookUpdate(BaseModel):
    symbol: str
    bids: List[Tuple[float, float]] # Price, Volume
    asks: List[Tuple[float, float]] # Price, Volume
    timestamp: datetime
    exchange: str

class Trade(BaseModel):
    symbol: str
    price: float
    qty: float
    is_buyer_maker: bool
    timestamp: datetime
    exchange: str

class Candle(BaseModel):
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: datetime
    timeframe: str

class LiquidationEvent(BaseModel):
    symbol: str
    side: str # "SELL" means long liquidation
    price: float
    qty: float
    timestamp: datetime
    exchange: str
