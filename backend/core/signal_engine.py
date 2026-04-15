import uuid
import time
import asyncio
import structlog
from typing import Dict, List, Optional
from datetime import datetime, timezone

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
        self.rejected_signals = 0

    async def _async_div(self, candles: List) -> tuple:
        return await asyncio.to_thread(self.div_detector.detect_divergence, candles)

    async def _async_ob(self) -> tuple:
        return self.ob_tracker.get_score()

    async def _async_fund(self, direction: str) -> tuple:
        return self.funding_tracker.evaluate_signal_alignment(direction)

    async def _async_pa(self, candles: List, direction: str) -> int:
        if not candles or len(candles) < 2: return 0
        c1 = candles[-2]
        c2 = candles[-1]
        score = 0
        body1 = abs(c1.open - c1.close)
        body2 = abs(c2.open - c2.close)
        is_green1 = c1.close > c1.open
        is_green2 = c2.close > c2.open
        
        if direction == "LONG" and not is_green1 and is_green2 and body2 > body1 and c2.close > c1.open:
            score = 10 # Bullish engulfing
        elif direction == "SHORT" and is_green1 and not is_green2 and body2 > body1 and c2.close < c1.open:
            score = 10 # Bearish engulfing
        return score

    async def _async_vol(self, candles: List) -> int:
        if len(candles) < 20: return 0
        vols = [c.volume for c in candles[-20:]]
        sma = sum(vols) / 20
        last_vol = candles[-1].volume
        if last_vol > sma * 1.5:
            return 20
        return 0

    async def evaluate(self, current_price: float, candles: Dict[str, List], is_ws_healthy: bool) -> Optional[VenomSignal]:
        start_time = time.perf_counter()
        
        try:
            # 1. Price enters pocket zone
            zone = self.fib_tracker.check_zone_touch(current_price)
            if not zone or zone.name.lower() not in self.preset.zones:
                return None
                
            # 2. Check strict conditions
            if not is_ws_healthy:
                self.rejected_signals += 1
                logger.debug("signal_rejected", reason="no_healthy_ws")
                return None
                
            last_candle_time = candles['1m'][-1].timestamp.replace(tzinfo=timezone.utc).timestamp()
            if time.time() - last_candle_time > 10:
                self.rejected_signals += 1
                logger.debug("signal_rejected", reason="stale_candles_>10s")
                return None

            # Initial guess direction based on zone placement maybe? 
            # We'll determine direction from Divergence & Orderbook. Let's do OB first because it's fast.
            ob_score, ob_dir = await self._async_ob()
            if ob_dir == "NONE":
                self.rejected_signals += 1
                logger.debug("signal_rejected", reason="neutral_orderbook")
                return None
                
            direction = SignalDirection.LONG if ob_dir == "LONG" else SignalDirection.SHORT

            # 3. Parallel async checks
            div_res, fund_res, pa_score, vol_score = await asyncio.gather(
                self._async_div(candles.get('1m', [])),
                self._async_fund(direction.name),
                self._async_pa(candles.get('1m', []), direction.name),
                self._async_vol(candles.get('1m', []))
            )
            
            div_type, div_score = div_res
            fund_score, fund_rate = fund_res
            liq_boost = self.liq_monitor.get_boost(direction.name)

            total_score = ob_score + div_score + fund_score + pa_score + vol_score + liq_boost

            end_time = time.perf_counter()
            exec_time = (end_time - start_time) * 1000 # ms
            
            if exec_time > 500:
                self.rejected_signals += 1
                logger.debug("signal_rejected", reason="exec_time_>500ms", ms=exec_time)
                return None

            # 4. Compare to threshold
            if total_score < self.preset.min_score:
                self.rejected_signals += 1
                logger.info("signal_rejected", reason="below_threshold", score=total_score, required=self.preset.min_score)
                return None

            # 5. Passes: Generate Signal
            confluence = ConfluenceMetrics(
                divergence_score=div_score,
                divergence_tfs=["1m"],
                divergence_type=div_type,
                orderbook_score=ob_score,
                orderbook_ratio=self.ob_tracker.calculate_imbalance()[0],
                volume_score=vol_score,
                volume_surge=0, # Simplified
                funding_score=fund_score,
                funding_rate=fund_rate,
                price_action_score=pa_score,
                liquidation_boost=liq_boost
            )

            sl_pct = 0.005
            tp_pct = 0.01
            
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
                total_score=int(total_score),
                confluence=confluence,
                entry_low=current_price * 0.999,
                entry_high=current_price * 1.001,
                stop_loss=sl,
                tp1=tp1,
                tp2=tp2
            )
            
            self.recent_signals.append(sig)
            logger.info("signal_generated_score_87" if total_score == 87 else f"signal_generated_score_{int(total_score)}")
            return sig

        except Exception as e:
            logger.error("signal_engine_eval_error", error=str(e))
            self.rejected_signals += 1
            return None
