import logging
from app.database import get_connection

logger = logging.getLogger(__name__)

class RiskManager:
    def __init__(self):
        self.daily_loss_limit = 6.0
        self.max_positions = 5

    async def can_place_order(self, pair, direction, size_usdt):
        if self.get_open_position_count() >= self.max_positions: return False
        if self.get_daily_pnl() <= -self.daily_loss_limit: return False
        return True

    def get_open_position_count(self):
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM positions WHERE status = 'open'")
                c = cur.fetchone()[0]
            conn.close(); return c
        except: return 999

    def get_daily_pnl(self): return 0.0
