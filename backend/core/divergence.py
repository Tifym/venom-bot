import numpy as np
import pandas as pd
from typing import List, Tuple
from ..models.market_data import Candle
from ..models.enums import DivergenceType

def calculate_rsi(prices: List[float], period: int = 14) -> List[float]:
    if len(prices) < period + 1:
        return []
    
    deltas = np.diff(prices)
    seed = deltas[:period]
    up = seed[seed >= 0].sum() / period
    down = -seed[seed < 0].sum() / period
    
    rs = up / down if down != 0 else 0
    rsi = np.zeros_like(prices)
    rsi[:period] = 100. - 100. / (1. + rs)
    
    for i in range(period, len(prices)):
        delta = deltas[i - 1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta
            
        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period
        
        rs = up / down if down != 0 else 0
        rsi[i] = 100. - 100. / (1. + rs)
        
    return rsi.tolist()

def calculate_stochastic(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> List[float]:
    if len(closes) < period:
        return []
        
    stoch_k = np.zeros_like(closes)
    for i in range(period, len(closes)):
        h = max(highs[i-period:i])
        l = min(lows[i-period:i])
        c = closes[i]
        
        if h - l == 0:
            stoch_k[i] = 50.0
        else:
            stoch_k[i] = 100 * ((c - l) / (h - l))
            
    return stoch_k.tolist()

class DivergenceDetector:
    def __init__(self, rsi_period=14, stoch_period=14):
        self.rsi_period = rsi_period
        self.stoch_period = stoch_period

    def detect_divergence(self, candles: List[Candle]) -> Tuple[DivergenceType, int]:
        if len(candles) < max(self.rsi_period, self.stoch_period) + 5:
            return DivergenceType.NONE, 0
            
        closes = [c.close for c in candles]
        highs = [c.high for c in candles]
        lows = [c.low for c in candles]
        
        rsi = calculate_rsi(closes, self.rsi_period)
        stoch = calculate_stochastic(highs, lows, closes, self.stoch_period)

        if not rsi or not stoch:
            return DivergenceType.NONE, 0
            
        # Get last two swing points conceptually (simplified for performance)
        p1_c = closes[-10]
        p2_c = closes[-1]
        
        rsi1 = rsi[-10]
        rsi2 = rsi[-1]
        
        stoch1 = stoch[-10]
        stoch2 = stoch[-1]

        score = 0
        div_type = DivergenceType.NONE

        # Regular Bullish: Price LL + RSI HL + Stoch HL
        if p2_c < p1_c and rsi2 > rsi1 and stoch2 > stoch1:
            div_type = DivergenceType.REGULAR_BULLISH
            score = 15
        # Regular Bearish: Price HH + RSI LH + Stoch LH
        elif p2_c > p1_c and rsi2 < rsi1 and stoch2 < stoch1:
            div_type = DivergenceType.REGULAR_BEARISH
            score = 15
        # Hidden Bullish: Price HL + RSI LL + Stoch LL
        elif p2_c > p1_c and rsi2 < rsi1 and stoch2 < stoch1: # Wait, hidden bullish is higher low price, lower low osc
            div_type = DivergenceType.HIDDEN_BULLISH
            score = 12
        # Hidden Bearish: Price LH + RSI HH + Stoch HH
        elif p2_c < p1_c and rsi2 > rsi1 and stoch2 > stoch1:
            div_type = DivergenceType.HIDDEN_BEARISH
            score = 12

        return div_type, score
