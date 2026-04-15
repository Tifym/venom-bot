import time
import asyncio
from typing import Callable, Optional

class LiquidationMonitor:
    def __init__(self, callback: Optional[Callable] = None):
        self.liquidations = []
        self.threshold_usd = 5_000_000
        self.window_seconds = 60
        self.callback = callback

    def add_liquidation(self, side: str, price: float, qty: float):
        now = time.time()
        # side 'SELL' on Binance forceOrder usually indicates losing long
        self.liquidations.append({
            'side': side.upper(),
            'amount_usd': price * qty,
            'timestamp': now
        })
        self._cleanup()
        self._evaluate()

    def _cleanup(self):
        now = time.time()
        self.liquidations = [l for l in self.liquidations if now - l['timestamp'] <= self.window_seconds]

    def _evaluate(self):
        long_liq = sum(l['amount_usd'] for l in self.liquidations if l['side'] == "SELL")
        short_liq = sum(l['amount_usd'] for l in self.liquidations if l['side'] == "BUY")
        
        if long_liq > self.threshold_usd:
            self._trigger_cascade("LONG", long_liq)
            self.liquidations = [l for l in self.liquidations if l['side'] != "SELL"]
        elif short_liq > self.threshold_usd:
            self._trigger_cascade("SHORT", short_liq)
            self.liquidations = [l for l in self.liquidations if l['side'] != "BUY"]

    def _trigger_cascade(self, side_rekt: str, amount: float):
        if self.callback:
            asyncio.create_task(self.callback(side_rekt, amount))

    def get_boost(self, direction: str) -> int:
        long_liq = sum(l['amount_usd'] for l in self.liquidations if l['side'] == "SELL")
        short_liq = sum(l['amount_usd'] for l in self.liquidations if l['side'] == "BUY")

        # Opposes liquidation direction -> long gets boost from shorts dying, short gets boost from longs dying
        if direction == "LONG" and short_liq > self.threshold_usd:
            return 10
        if direction == "SHORT" and long_liq > self.threshold_usd:
            return 10
        return 0
