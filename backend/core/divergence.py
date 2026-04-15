import numpy as np
import pandas as pd
from ta.momentum import RSIIndicator, StochasticOscillator
from typing import List, Tuple
from ..models.market_data import Candle
from ..models.enums import DivergenceType

class DivergenceDetector:
    def __init__(self, rsi_period=14, stoch_period=14):
        self.rsi_period = rsi_period
        self.stoch_period = stoch_period
        self.timeframes = ['1m', '3m', '5m', '15m', '30m', '1h']

    def detect_divergence(self, candles: List[Candle]) -> Tuple[DivergenceType, int]:
        if len(candles) < max(self.rsi_period, self.stoch_period) + 5:
            return DivergenceType.NONE, 0
            
        df = pd.DataFrame([
            {'high': c.high, 'low': c.low, 'close': c.close} 
            for c in candles
        ])
        
        # RSI-14
        rsi_ind = RSIIndicator(close=df['close'], window=self.rsi_period)
        df['rsi'] = rsi_ind.rsi()
        
        # Stochastic %K-14
        stoch_ind = StochasticOscillator(high=df['high'], low=df['low'], close=df['close'], window=self.stoch_period, smooth_window=3)
        df['stoch_k'] = stoch_ind.stoch()

        # Need at least previous swing and current
        if df['rsi'].isna().any() or df['stoch_k'].isna().any():
            if df.head(-1)['rsi'].isna().any():
                df.fillna(method='bfill', inplace=True)
            
        p1_c = df['close'].iloc[-10]
        p2_c = df['close'].iloc[-1]
        
        rsi1 = df['rsi'].iloc[-10]
        rsi2 = df['rsi'].iloc[-1]
        
        stoch1 = df['stoch_k'].iloc[-10]
        stoch2 = df['stoch_k'].iloc[-1]

        score = 0
        div_type = DivergenceType.NONE

        agree = (rsi2 > rsi1) == (stoch2 > stoch1) # RSI and Stoch agree in direction

        if agree:
            # Regular Bullish: LL Price, HL Osc
            if p2_c < p1_c and rsi2 > rsi1:
                div_type = DivergenceType.REGULAR_BULLISH
                score = 15
            # Regular Bearish: HH Price, LH Osc
            elif p2_c > p1_c and rsi2 < rsi1:
                div_type = DivergenceType.REGULAR_BEARISH
                score = 15
            # Hidden Bullish: HL Price, LL Osc
            elif p2_c > p1_c and rsi2 < rsi1:
                div_type = DivergenceType.HIDDEN_BULLISH
                score = 15
            # Hidden Bearish: LH Price, HH Osc
            elif p2_c < p1_c and rsi2 > rsi1:
                div_type = DivergenceType.HIDDEN_BEARISH
                score = 15

        return div_type, score
