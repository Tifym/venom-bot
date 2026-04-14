import uuid
import structlog
from typing import Dict, List, Optional
from datetime import datetime

from ..models.signal import VenomSignal, ConfluenceMetrics
from ..models.enums import SignalDirection, VenomZone, SignalMode, DivergenceType
from .fibonacci import FibonacciPocket
from .divergence import DivergenceDetector
from .orderbook import OrderBookTracker
from .funding_tracker import FundingTracker
from .liquidation_monitor import LiquidationMonitor
from ..config.presets import get_preset

logger = structlog.get_logger()

class SignalEngine:
    def __init__(self, mode: str = "HUNTER"):
        self.preset = get_preset(mode)
        self.mode = SignalMode[mode.upper()]
        
        self.fib_tracker = FibonacciPocket()
        self.div_detector = DivergenceDetector()
        self.ob_tracker = OrderBookTracker()
        self.funding_tracker = FundingTracker()
        self.liq_monitor = LiquidationMonitor()
        
        self.last_signal_time = {}
        self.recent_signals = []

    def evaluate(self, current_price: float, candles: Dict[str, List]) -> Optional[VenomSignal]:
        try:
            # 1. Check Zone Touch
            zone = self.fib_tracker.check_zone_touch(current_price)
            if not zone or zone.name.lower() not in self.preset.zones:
                return None
                
            # 2. Check Divergence (1m to start, would need to aggregate multiple TFs in real usage)
            # For brevity, assuming candles['1m'] is the primary eval series
            if '1m' not in candles or len(candles['1m']) < 50:
                return None
                
            div_type, div_score = self.div_detector.detect_divergence(candles['1m'])
            if div_type == DivergenceType.NONE and self.preset.min_tfs > 0:
                # Assuming 1TF for now as MVP.
                # In full multi-TF, we'd check 5m, 15m, 30m, 1H
                return None
            
            direction = SignalDirection.LONG if "BULLISH" in div_type.name else SignalDirection.SHORT
            
            # 3. Check Orderbook Imbalance
            ob_score, ob_dir = self.ob_tracker.get_score()
            if ob_score > 0 and ob_dir != direction.name:
                return None # Conflict

            # 4. Check Funding
            funding_score, fund_rate = self.funding_tracker.evaluate_signal_alignment(direction.name)
            if self.preset.funding_required and funding_score == 0:
                return None
                
            # 5. Check Liquidation Cascade Boost
            liq_boost = self.liq_monitor.get_boost(direction.name)
            
            total_score = div_score + ob_score + funding_score + liq_boost
            
            # Check threshold
            if total_score < self.preset.min_score:
                return None
                
            # Create Signal
            confluence = ConfluenceMetrics(
                divergence_score=div_score,
                divergence_tfs=['1m'],
                divergence_type=div_type,
                orderbook_score=ob_score,
                orderbook_ratio=self.ob_tracker.calculate_imbalance()[0],
                funding_score=funding_score,
                funding_rate=fund_rate,
                liquidation_boost=liq_boost
            )
            
            # Simplified targets calculation
            sl_pct = 0.005 # 0.5%
            tp_pct = 0.01  # 1%
            
            if direction == SignalDirection.LONG:
                sl = current_price * (1 - sl_pct)
                tp1 = current_price * (1 + tp_pct)
                tp2 = current_price * (1 + (tp_pct*2))
            else:
                sl = current_price * (1 + sl_pct)
                tp1 = current_price * (1 - tp_pct)
                tp2 = current_price * (1 - (tp_pct*2))

            sig = VenomSignal(
                id=str(uuid.uuid4()),
                direction=direction,
                mode=self.mode,
                zone=zone,
                total_score=total_score,
                confluence=confluence,
                entry_low=current_price * 0.999,
                entry_high=current_price * 1.001,
                stop_loss=sl,
                tp1=tp1,
                tp2=tp2
            )
            
            self.recent_signals.append(sig)
            return sig

        except Exception as e:
            logger.error("signal_engine_eval_error", error=str(e))
            return None
