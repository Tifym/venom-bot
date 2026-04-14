from typing import Tuple

class FundingTracker:
    def __init__(self):
        self.current_funding_rate = 0.0
        self.next_funding_time = 0

    def update(self, rate: float, next_time: int):
        self.current_funding_rate = rate
        self.next_funding_time = next_time

    def evaluate_signal_alignment(self, direction: str) -> Tuple[int, float]:
        """
        Evaluates funding rate alignment based on prompt logic.
        Requires checking if short pays long, etc.
        """
        score = 0
        rate = self.current_funding_rate
        
        # Funding rate positive = longs pay shorts. Negative = shorts pay longs.
        
        # Extreme: |funding| >0.015% = 15 pts
        # Strong: |funding| 0.01-0.015% = 12 pts
        # Moderate: |funding| 0.005-0.01% = 8 pts
        # Neutral: < 0.005 = 0
        
        abs_rate = abs(rate) * 100 # Parse float standard to percentage (e.g., 0.00015 -> 0.015%)

        if abs_rate > 0.015:
            base_score = 15
        elif 0.01 <= abs_rate <= 0.015:
            base_score = 12
        elif 0.005 <= abs_rate < 0.01:
            base_score = 8
        else:
            base_score = 0
        
        if base_score > 0:
            if direction == "LONG" and rate < 0:
                # Shorts pay longs - very good for long signal
                score = base_score
            elif direction == "SHORT" and rate > 0:
                # Longs pay shorts - very good for short signal
                score = base_score
                
        return score, rate
