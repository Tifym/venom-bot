import time
from typing import Dict, List, Tuple
from ..models.market_data import OrderBookUpdate

class OrderBookTracker:
    def __init__(self, stale_threshold_ms: int = 500):
        self.bids: List[Tuple[float, float]] = []
        self.asks: List[Tuple[float, float]] = []
        self.last_update_time = 0.0
        self.stale_threshold_ms = stale_threshold_ms

    def update(self, ob_update: OrderBookUpdate):
        # Expected depth20 update
        self.bids = sorted(ob_update.bids, key=lambda x: x[0], reverse=True)[:5]
        self.asks = sorted(ob_update.asks, key=lambda x: x[0], reverse=False)[:5]
        self.last_update_time = time.time()

    def calculate_imbalance(self) -> Tuple[float, float]:
        """
        Calculates bid/ask volume ratio and spread.
        Returns: (ratio, spread_pct)
        """
        now = time.time()
        if (now - self.last_update_time) * 1000 > self.stale_threshold_ms:
            return 1.0, 0.0 # Stale
            
        if not self.bids or not self.asks:
            return 1.0, 0.0
            
        bid_vol = sum([b[1] for b in self.bids])
        ask_vol = sum([a[1] for a in self.asks])
        
        ratio = bid_vol / ask_vol if ask_vol > 0 else 1.0
        
        best_bid = self.bids[0][0]
        best_ask = self.asks[0][0]
        spread_pct = ((best_ask - best_bid) / best_ask) * 100 if best_ask > 0 else 0.0
        
        return ratio, spread_pct

    def get_score(self) -> Tuple[int, str]:
        ratio, spread = self.calculate_imbalance()
        score = 0
        direction = "NONE"
        
        # Long criteria: Ratio > 1.8
        if ratio > 1.8:
            score = 25
            direction = "LONG"
        # Short criteria: Ratio < 0.55
        elif ratio < 0.55:
            score = 25
            direction = "SHORT"
            
        return score, direction
