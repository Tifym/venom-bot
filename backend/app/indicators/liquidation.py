import logging
from datetime import datetime, timedelta, timezone
from app.database import get_connection

logger = logging.getLogger(__name__)

TF_MIN_MAP = {'1D': 1440, '4H': 240, '3H': 180, '2H': 120, '1H': 60, '24m': 24, '12m': 12, '6m': 6, '3m': 3, '1m': 1}

def calculate_gamma_state(pair, timeframe, candle):
    try:
        minutes = TF_MIN_MAP.get(timeframe, 1)
        end_time = candle['time'] + timedelta(minutes=1)
        start_time = end_time - timedelta(minutes=minutes)
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT side, SUM(usd_value) as total_usd FROM liquidations WHERE pair = %s AND time >= %s AND time <= %s GROUP BY side", (pair, start_time, end_time))
            rows = cur.fetchall()
        conn.close()
        longs_m, shorts_m = 0, 0
        for side, total_usd in rows:
            if side == 'SELL': longs_m = total_usd
            elif side == 'BUY': shorts_m = total_usd
        if shorts_m > longs_m: return 'BULLISH'
        elif longs_m > shorts_m: return 'BEARISH'
        return 'NEUTRAL'
    except Exception as e:
        logger.error(f"Error calculating GAMMA: {e}")
        return 'NEUTRAL'
