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
        bb = BollingerBands(close=c_closes, window=20, window_dev=self.preset.custom_options.bbands_upper)
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
            # 1. Dynamically maintain ZigZag mapping so pockets aren't forever empty
            m1_candles = candles.get('1m', [])
            
            # Determine specific timeframes from CUSTOM options if active
            tf_fib = "1m"
            tf_div = "1m"
            tf_bb = "1m"
            
            if self.mode == SignalMode.CUSTOM and self.preset.custom_options:
                opts = self.preset.custom_options
                tf_fib = opts.tf_fib
                tf_div = opts.tf_divergence
                tf_bb = opts.tf_bollinger

            # 1. Dynamically maintain ZigZag mapping so pockets aren't forever empty
            fib_candles = candles.get(tf_fib, m1_candles)
            if len(fib_candles) >= 50:
                swings = self.fib_tracker.calculate_zig_zag(fib_candles)
                
                # Apply custom fib overrides if CUSTOM active
                custom_fibs = None
                if self.mode == SignalMode.CUSTOM and self.preset.custom_options:
                    custom_fibs = self.preset.custom_options.custom_fibs
                    
                self.fib_tracker.calculate_pockets(swings, custom_fibs)

            # 2. Check strict conditions
            if not is_ws_healthy:
                self.rejected_signals += 1
                return None
                
            if not m1_candles:
                return None
                
            last_candle_time = m1_candles[-1].timestamp.replace(tzinfo=timezone.utc).timestamp()
            if time.time() - last_candle_time > 15:
                self.rejected_signals += 1
                return None

            # 3. Price enters pocket zone
            zone = self.fib_tracker.check_zone_touch(current_price)
            if not zone or zone.lower() not in [z.lower() for z in self.preset.zones]:
                # Force silent reject, normal state
                return None

            ob_score, ob_dir = await self._async_ob()
            if ob_dir == "NONE":
                self.rejected_signals += 1
                return None
                
            direction = SignalDirection.LONG if ob_dir == "LONG" else SignalDirection.SHORT

            # 4. Parallel async checks
            div_res, fund_res, pa_score, vol_score, bb_score = await asyncio.gather(
                self._async_div(candles.get(tf_div, m1_candles)),
                self._async_fund(direction.name),
                self._async_pa(m1_candles, direction.name),
                self._async_vol(m1_candles),
                self._async_bbands(candles.get(tf_bb, m1_candles))
            )
            
            div_type, div_score = div_res
            fund_score, fund_rate = fund_res
            liq_boost = self.liq_monitor.get_boost(direction.name)

            total_score = ob_score + div_score + fund_score + pa_score + vol_score + liq_boost + bb_score

            exec_time = (time.perf_counter() - start_time) * 1000
            if exec_time > 500:
                self.rejected_signals += 1
                return None

            if total_score < self.preset.min_score:
                self.rejected_signals += 1
                return None

            sl_pct = 0.005
            tp_pct = 0.01
            
            sig = VenomSignal(
                id=str(uuid.uuid4()),
                direction=direction,
                mode=self.mode,
                zone=zone,
                total_score=int(total_score),
                confluence=ConfluenceMetrics(
                    divergence_score=div_score,
                    divergence_tfs=[tf_div],
                    divergence_type=div_type,
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

        except Exception as e:
            logger.error("signal_engine_eval_error", error=str(e))
            self.rejected_signals += 1
            return None
