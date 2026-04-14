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
        self.liquidations.append({
            'side': side,
            'amount_usd': price * qty,
            'timestamp': now
        })
        self._cleanup()
        self._evaluate()

    def _cleanup(self):
        now = time.time()
        self.liquidations = [liq for liq in self.liquidations if now - liq['timestamp'] <= self.window_seconds]

    def _evaluate(self):
        long_liq = sum(liq['amount_usd'] for liq in self.liquidations if liq['side'].upper() == "BUY") # Maker bought force sell
        short_liq = sum(liq['amount_usd'] for liq in self.liquidations if liq['side'].upper() == "SELL") # Maker sold force buy
        
        # We need to correctly align side parsing based on Binance mapping, but generally:
        # Binance 'SELL' in forceOrder means long was liquidated
        # Wait, if forceOrder side = 'SELL', it's a forced sell of a long position.
        
        if long_liq >= self.threshold_usd:
            self._trigger_cascade("LONG", long_liq)
            self.liquidations = [liq for liq in self.liquidations if liq['side'].upper() != "SELL"]
            
        elif short_liq >= self.threshold_usd:
            self._trigger_cascade("SHORT", short_liq)
            self.liquidations = [liq for liq in self.liquidations if liq['side'].upper() != "BUY"]

    def _trigger_cascade(self, side_rekt: str, amount: float):
        if self.callback:
            asyncio.create_task(self.callback(side_rekt, amount))

    def get_boost(self, direction: str) -> int:
        long_liq = sum(liq['amount_usd'] for liq in self.liquidations if liq['side'].upper() == "SELL")
        short_liq = sum(liq['amount_usd'] for liq in self.liquidations if liq['side'].upper() == "BUY")

        if long_liq >= self.threshold_usd and direction == "LONG":
            return 10
        elif short_liq >= self.threshold_usd and direction == "SHORT":
            return 10
        return 0
