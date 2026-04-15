from pydantic import BaseModel, root_validator, validator
from typing import List, Tuple, Any, Dict
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

class KlineData(BaseModel):
    t: int # start time
    T: int # close time
    s: str # symbol
    i: str # interval
    f: int # first trade ID
    L: int # last trade ID
    o: float # open
    c: float # close
    h: float # high
    l: float # low
    v: float # base asset volume
    n: int # number of trades
    x: bool # is closed
    q: float # quote asset volume
    V: float # taker buy base volume
    Q: float # taker buy quote volume
    B: str # ignore

    @validator('c')
    def validate_price(cls, v, values):
        assert v > 0, "Invalid close price"
        return v
    
    @validator('o')
    def validate_open(cls, v):
        assert v > 0, "Invalid open price"
        return v

class BinanceKlineEvent(BaseModel):
    e: str  # event type
    E: int  # event time
    s: str  # symbol
    k: KlineData  # candle data
