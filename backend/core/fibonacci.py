import math
from typing import List, Tuple, Dict, Optional
from ..models.market_data import Candle
from ..models.enums import VenomZone

class FibonacciPocket:
    FIB_LEVELS = {
        VenomZone.ALPHA: (0.618, 0.650),
        VenomZone.BETA: (0.500, 0.618),
        VenomZone.GAMMA: (0.382, 0.500),
        VenomZone.DELTA: (0.786, 0.850),
        VenomZone.OMEGA: (0.850, 0.886)
    }

    def __init__(self, lookback: int = 50, deviation: float = 0.008):
        self.lookback = lookback
        self.deviation = deviation # 0.8% minimum for swing
        self.swings: List[Tuple[float, float, str]] = [] # price, timestamp, type (HIGH/LOW)
        self.current_high = -math.inf
        self.current_low = math.inf
        self.pockets = {}

    def calculate_zig_zag(self, candles: List[Candle]) -> List[Tuple[float, float, str]]:
        if not candles:
            return []
            
        swings = []
        last_swing_type = None
        last_extreme_price = candles[0].close
        
        for i in range(1, len(candles)):
            c = candles[i]
            
            # Upward move
            if c.high > last_extreme_price * (1 + self.deviation):
                if last_swing_type != 'HIGH':
                    swings.append((last_extreme_price, candles[i-1].timestamp.timestamp(), 'LOW'))
                last_swing_type = 'HIGH'
                last_extreme_price = c.high
                
            # Downward move
            elif c.low < last_extreme_price * (1 - self.deviation):
                if last_swing_type != 'LOW':
                    swings.append((last_extreme_price, candles[i-1].timestamp.timestamp(), 'HIGH'))
                last_swing_type = 'LOW'
                last_extreme_price = c.low
                
        self.swings = swings[-3:] # Keep last 3 significant swings
        return self.swings

    def calculate_pockets(self, swings: List[Tuple[float, float, str]]) -> Dict[VenomZone, Tuple[float, float]]:
        pockets = {}
        if len(swings) < 2:
            return pockets

        last_swing = swings[-1]
        prev_swing = swings[-2]

        swing_range = abs(last_swing[0] - prev_swing[0])
        is_uptrend = last_swing[2] == 'HIGH'

        for zone, (lower_fib, upper_fib) in self.FIB_LEVELS.items():
            if is_uptrend:
                # Retracement down
                p_high = last_swing[0] - (swing_range * lower_fib)
                p_low = last_swing[0] - (swing_range * upper_fib)
            else:
                # Retracement up
                p_low = last_swing[0] + (swing_range * lower_fib)
                p_high = last_swing[0] + (swing_range * upper_fib)
            
            pockets[zone] = (min(p_low, p_high), max(p_low, p_high))
            
        self.pockets = pockets
        return pockets

    def check_zone_touch(self, current_price: float) -> Optional[VenomZone]:
        for zone, (low, high) in self.pockets.items():
            if low <= current_price <= high:
                return zone
        return None
