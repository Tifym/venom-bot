import time

class WhaleMonitor:
    def __init__(self, threshold_usd: int = 10_000_000):
        self.threshold_usd = threshold_usd
        self.recent_txs = []
        
    def add_tx(self, txid: str, amount_usd: float, is_inflow: bool):
        if amount_usd >= self.threshold_usd:
            self.recent_txs.append({
                'txid': txid,
                'amount_usd': amount_usd,
                'is_inflow': is_inflow, # True if sending to exchange (bearish), False if withdrawing (bullish)
                'timestamp': time.time()
            })
            self._cleanup()

    def _cleanup(self):
        now = time.time()
        self.recent_txs = [tx for tx in self.recent_txs if now - tx['timestamp'] <= 3600] # Keep for 1h

    def get_whale_bias(self) -> str:
        self._cleanup()
        if not self.recent_txs:
            return "NEUTRAL"
            
        inflow = sum(tx['amount_usd'] for tx in self.recent_txs if tx['is_inflow'])
        outflow = sum(tx['amount_usd'] for tx in self.recent_txs if not tx['is_inflow'])
        
        if inflow > outflow * 1.5:
            return "BEARISH"
        elif outflow > inflow * 1.5:
            return "BULLISH"
        return "NEUTRAL"
