import logging
from binance.um_futures import UMFutures
from app.config import MODE, BINANCE_API_KEY, BINANCE_SECRET, BINANCE_TESTNET_KEY, BINANCE_TESTNET_SECRET
from app.database import get_connection

logger = logging.getLogger(__name__)

class ExecutionManager:
    def __init__(self):
        self.mode = MODE
        if self.mode == 'live':
            self.client = UMFutures(key=BINANCE_API_KEY, secret=BINANCE_SECRET)
        else:
            self.client = UMFutures(key=BINANCE_TESTNET_KEY, secret=BINANCE_TESTNET_SECRET, base_url="https://testnet.binancefuture.com")
    
    async def execute_signal(self, signal):
        try:
            side = 'BUY' if signal['direction'] == 'LONG' else 'SELL'
            qty = round(100.0 / signal['entry_price'], 3)
            res = self.client.new_order(symbol=signal['pair'], side=side, type='MARKET', quantity=qty)
            price = float(res['avgPrice']) if 'avgPrice' in res else signal['entry_price']
            self.update_signal_status(signal['signal_id'], 'executed', price)
            self.create_position(signal, price, qty)
            tp_side = 'SELL' if side == 'BUY' else 'BUY'
            self.client.new_order(symbol=signal['pair'], side=tp_side, type='TAKE_PROFIT_MARKET', stopPrice=signal['take_profit'], closePosition='true')
            self.client.new_order(symbol=signal['pair'], side=tp_side, type='STOP_MARKET', stopPrice=signal['stop_loss'], closePosition='true')
            return True
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            self.update_signal_status(signal['signal_id'], 'failed')
            return False

    def update_signal_status(self, sid, status, price=None):
        conn = get_connection()
        with conn.cursor() as cur:
            if price: cur.execute("UPDATE signals SET status = %s, executed_price = %s WHERE signal_id = %s", (status, price, sid))
            else: cur.execute("UPDATE signals SET status = %s WHERE signal_id = %s", (status, sid))
        conn.commit(); conn.close()

    def create_position(self, sig, price, qty):
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO positions (signal_id, pair, direction, entry_price, stop_loss, take_profit, size_usdt, status, opened_at, mode) VALUES (%s, %s, %s, %s, %s, %s, %s, 'open', NOW(), %s)", (sig['signal_id'], sig['pair'], sig['direction'], price, sig['stop_loss'], sig['take_profit'], price * qty, self.mode))
        conn.commit(); conn.close()
