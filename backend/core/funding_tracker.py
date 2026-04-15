from typing import Tuple

class FundingTracker:
    def __init__(self):
        self.current_funding_rate = 0.0
        self.next_funding_time = 0

    def update(self, rate: float, next_time: int):
        self.current_funding_rate = rate
        self.next_funding_time = next_time

    def evaluate_signal_alignment(self, direction: str) -> Tuple[int, float]:
        score = 0
        rate = self.current_funding_rate
        abs_rate = abs(rate) * 100 # converting to percentage
        
        # User defined: >0.01% = 15pts
        if abs_rate > 0.01:
            base_score = 15
        elif abs_rate > 0.005:
            base_score = 10
        else:
            base_score = 0
            
        if base_score > 0:
            if direction == "LONG" and rate < 0: # Shorts paying longs
                score = base_score
            elif direction == "SHORT" and rate > 0: # Longs paying shorts
                score = base_score
                
        return score, rate
