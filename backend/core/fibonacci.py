import math
from typing import List, Tuple, Dict, Optional
from ..models.market_data import Candle
from ..models.enums import VenomZone

class FibonacciPocket:
    DEFAULT_FIB_LEVELS = {
        "alpha": (0.618, 0.650),
        "beta": (0.500, 0.618),
        "gamma": (0.382, 0.500),
        "delta": (0.786, 0.850),
        "omega": (0.850, 0.886)
    }

    def __init__(self, deviation: float = 0.008):
        self.deviation = deviation
        self.swings: List[Tuple[float, float, str]] = []
        self.pockets: Dict[str, Tuple[float, float]] = {}

    def calculate_zig_zag(self, candles: List[Candle]) -> List[Tuple[float, float, str]]:
        if not candles:
            return []
            
        swings = []
        last_swing_type = None
        last_extreme_price = candles[0].close
        
        for i in range(1, len(candles)):
            c = candles[i]
            
            # Upward deviation
            if c.high > last_extreme_price * (1 + self.deviation):
                if last_swing_type != 'HIGH':
                    swings.append((last_extreme_price, candles[i-1].timestamp.timestamp(), 'LOW'))
                last_swing_type = 'HIGH'
                last_extreme_price = c.high
                
            # Downward deviation
            elif c.low < last_extreme_price * (1 - self.deviation):
                if last_swing_type != 'LOW':
                    swings.append((last_extreme_price, candles[i-1].timestamp.timestamp(), 'HIGH'))
                last_swing_type = 'LOW'
                last_extreme_price = c.low
                
        self.swings = swings[-3:] # Keep recent 3 swings
        return self.swings

    def calculate_pockets(self, swings: List[Tuple[float, float, str]], custom_levels: Optional[Dict[str, List[float]]] = None) -> Dict[str, Tuple[float, float]]:
        pockets = {}
        if len(swings) < 2:
            return pockets

        last_swing = swings[-1]
        prev_swing = swings[-2]

        swing_range = abs(last_swing[0] - prev_swing[0])
        is_uptrend = last_swing[2] == 'HIGH'
        
        active_levels = self.DEFAULT_FIB_LEVELS.copy()
        if custom_levels:
            for k, v in custom_levels.items():
                if len(v) == 2:
                    active_levels[k] = (v[0], v[1])

        for zone, limits in active_levels.items():
            lower_fib, upper_fib = limits
            if is_uptrend:
                p_high = last_swing[0] - (swing_range * lower_fib)
                p_low = last_swing[0] - (swing_range * upper_fib)
            else:
                p_low = last_swing[0] + (swing_range * lower_fib)
                p_high = last_swing[0] + (swing_range * upper_fib)
            
            pockets[zone] = (min(p_low, p_high), max(p_low, p_high))
            
        self.pockets = pockets
        return pockets

    def check_zone_touch(self, current_price: float) -> Optional[str]:
        for zone, (low, high) in self.pockets.items():
            if low <= current_price <= high:
                return zone
        return None
