import uuid
import time
import asyncio
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timezone
import structlog
from ta.volatility import BollingerBands

from ..models.signal import VenomSignal, ConfluenceMetrics
from ..models.enums import SignalDirection, SignalMode, DivergenceType
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
        
        self.fib_tracker = FibonacciPocket(deviation=0.001) # 0.1% sensitivity for 1m
        self.div_detector = DivergenceDetector()
        self.ob_tracker = OrderBookTracker()
        self.funding_tracker = FundingTracker()
        self.liq_monitor = LiquidationMonitor()
        
        self.last_signal_time = {}
        self.recent_signals = []
        self.rejected_signals = 0
        self.last_eval_results = {
            "div": False,
            "bb": False,
            "ob": False,
            "liq": False
        }

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
            score = 10
        elif direction == "SHORT" and is_green1 and not is_green2 and body2 > body1 and c2.close < c1.open:
            score = 10
        return score

    async def _async_vol(self, candles: List) -> int:
        if len(candles) < 20: return 0
        vols = [c.volume for c in candles[-20:]]
        sma = sum(vols) / 20
        last_vol = candles[-1].volume
        return 20 if last_vol > sma * 1.5 else 0

    async def _async_bbands(self, candles: List) -> int:
        if len(candles) < 20: return 0
        if not self.preset.custom_options or not self.preset.custom_options.bbands_enabled:
            return 0
            
        c_closes = pd.Series([c.close for c in candles[-20:]])
        upper_dev = opts.bbands_upper if opts else 2.0
        bb = BollingerBands(close=c_closes, window=20, window_dev=upper_dev)
        upper = bb.bollinger_hband().iloc[-1]
        lower = bb.bollinger_lband().iloc[-1]
        c_price = c_closes.iloc[-1]
        
        # Super simple check: +15 if piercing upper/lower band
        if c_price > upper or c_price < lower:
            return 15
        return 0

    async def evaluate(self, current_price: float, candles: Dict[str, List], is_ws_healthy: bool) -> Optional[VenomSignal]:
        start_time = time.perf_counter()
        
        try:
            m1_candles = candles.get('1m', [])
            if not is_ws_healthy or not m1_candles:
                return None

            # 1. Config & Multi-TF Matrix Setup
            opts = self.preset.custom_options
            tfs_div = opts.tfs_divergence if opts else ["1m"]
            tfs_bb = opts.tfs_bollinger if opts else ["1m"]
            tfs_fib = opts.tfs_fib if opts else ["1m"]
            
            # 2. Fibonacci Matrix (Parallel Across TFs)
            # For simplicity, we track the 'active' zone as the most conservative one found
            current_zone = None
            for tf in tfs_fib:
                tf_candles = candles.get(tf, m1_candles)
                if len(tf_candles) >= 50:
                    swings = self.fib_tracker.calculate_zig_zag(tf_candles)
                    self.fib_tracker.calculate_pockets(swings, opts.custom_fibs if opts else {})
                    zone = self.fib_tracker.check_zone_touch(current_price)
                    if zone: current_zone = zone # Capture zone

            if self.preset.fib_required:
                if not current_zone or current_zone.lower() not in [z.lower() for z in self.preset.zones]:
                    logger.debug("signal_rejected_no_zone", zone=current_zone)
                    return None
            else:
                current_zone = current_zone or "OPEN_FIELD" # For visuals

            # 3. Orderbook Matrix (Atomic Check)
            ob_score, ob_dir = await self._async_ob()
            if ob_dir == "NONE" or (opts and ob_score < opts.ob_ratio_min):
                logger.debug("signal_rejected_low_ob", score=ob_score, min=opts.ob_ratio_min if opts else 0)
                self.rejected_signals += 1
                return None
            
            direction = SignalDirection.LONG if ob_dir == "LONG" else SignalDirection.SHORT

            # 4. Indicators Matrix (Multi-TF Parallel Confirmation)
            # Parallel Divergence detections
            div_tasks = [self._async_div(candles.get(tf, m1_candles)) for tf in tfs_div]
            # Parallel BB detections
            bb_tasks = [self._async_bbands(candles.get(tf, m1_candles)) for tf in tfs_bb]
            
            # Other Atomic Checks
            other_tasks = [
                self._async_fund(direction.name),
                self._async_pa(m1_candles, direction.name),
                self._async_vol(m1_candles)
            ]
            
            results = await asyncio.gather(*div_tasks, *bb_tasks, *other_tasks)
            
            # Parse Results
            div_results = results[:len(div_tasks)]
            bb_results = results[len(div_tasks):len(div_tasks)+len(bb_tasks)]
            fund_score, fund_rate = results[-3]
            pa_score = results[-2]
            vol_score = results[-1]
            
            # Confluence Logic: Average or Strictest? 
            # We use Weighted Sum: and only add if TF matches
            div_total = sum(res[1] for res in div_results) / max(len(div_results), 1)
            bb_total = sum(bb_results) / max(len(bb_results), 1)
            
            # 5. Raw Data Matrix (OI & Liquidation Surge)
            liq_boost = self.liq_monitor.get_boost(direction.name)
            if opts and liq_boost > 0 and self.liq_monitor.last_burst_usd < opts.liq_burst_usd:
                liq_boost = 0 # Reject if burst is too small

            # Store for broadcast
            self.last_eval_results = {
                "div": div_total > 5,
                "bb": bb_total > 5,
                "ob": ob_score >= (opts.ob_ratio_min if opts else 2.5),
                "liq": liq_boost > 0
            }

            if total_score < self.preset.min_score:
                logger.debug("signal_rejected_low_score", score=total_score, min=self.preset.min_score)
                self.rejected_signals += 1
                return None

            # Build Signal
            sl_pct = 0.005
            tp_pct = 0.01
            
            sig = VenomSignal(
                id=str(uuid.uuid4()),
                direction=direction,
                mode=self.mode,
                zone=current_zone,
                total_score=int(total_score),
                confluence=ConfluenceMetrics(
                    divergence_score=int(div_total),
                    divergence_tfs=tfs_div,
                    divergence_type=div_results[0][0] if div_results else DivergenceType.NONE,
                    orderbook_score=ob_score,
                    orderbook_ratio=self.ob_tracker.calculate_imbalance()[0],
                    volume_score=vol_score,
                    volume_surge=0,
                    funding_score=fund_score,
                    funding_rate=fund_rate,
                    price_action_score=pa_score,
                    liquidation_boost=liq_boost
                ),
                entry_low=current_price * 0.999,
                entry_high=current_price * 1.001,
                stop_loss=current_price * (1 - sl_pct) if direction == SignalDirection.LONG else current_price * (1 + sl_pct),
                tp1=current_price * (1 + tp_pct) if direction == SignalDirection.LONG else current_price * (1 - tp_pct),
                tp2=current_price * (1 + tp_pct*2) if direction == SignalDirection.LONG else current_price * (1 - tp_pct*2)
            )
            
            self.recent_signals.append(sig)
            return sig
            
            self.recent_signals.append(sig)
            return sig

        except Exception as e:
            logger.error("signal_engine_eval_error", error=str(e))
            self.rejected_signals += 1
            return None
