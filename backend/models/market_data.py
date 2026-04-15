from pydantic import BaseModel, field_validator
from typing import List, Tuple, Any, Dict, Optional
from datetime import datetime

class OrderBookUpdate(BaseModel):
    symbol: str
    bids: List[Tuple[float, float]]
    asks: List[Tuple[float, float]]
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
    side: str
    price: float
    qty: float
    timestamp: datetime
    exchange: str

class KlineData(BaseModel):
    t: int
    T: int
    s: str
    i: str
    f: int
    L: int
    o: float
    c: float
    h: float
    l: float
    v: float
    n: int
    x: bool
    q: float
    V: float
    Q: float
    B: str

class BinanceKlineEvent(BaseModel):
    e: str
    E: int
    s: str
    k: KlineData
