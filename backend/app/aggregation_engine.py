import logging
from datetime import datetime, timezone, timedelta
from app.database import get_connection

logger = logging.getLogger(__name__)

class AggregationEngine:
    def __init__(self, state_updater):
        self.state_updater = state_updater
        self.tf_map = {'3m': 3, '6m': 6, '12m': 12, '24m': 24, '1H': 60, '2H': 120, '3H': 180, '4H': 240}

    async def process_1m_candle(self, candle):
        await self.state_updater.update_state(candle['pair'], '1m', candle)
        for tf, minutes in self.tf_map.items():
            if self.is_bucket_complete(candle['time'], minutes):
                agg = self.aggregate(candle['pair'], tf, minutes, candle['time'])
                if agg: await self.state_updater.update_state(candle['pair'], tf, agg)

    def is_bucket_complete(self, t, m):
        return ((t.hour * 60) + t.minute + 1) % m == 0

    def aggregate(self, pair, tf, m, t1m):
        start = t1m - timedelta(minutes=m - 1)
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT pair, MIN(time), (array_agg(open ORDER BY time ASC))[1], MAX(high), MIN(low), (array_agg(close ORDER BY time DESC))[1], SUM(volume), SUM(quote_volume), SUM(trade_count) FROM klines WHERE pair = %s AND timeframe = '1m' AND time >= %s AND time <= %s GROUP BY pair", (pair, start, t1m))
                r = cur.fetchone()
                if r:
                    c = {'time':r[1], 'pair':r[0], 'timeframe':tf, 'open':r[2], 'high':r[3], 'low':r[4], 'close':r[5], 'volume':r[6], 'quote_volume':r[7], 'trade_count':r[8]}
                    self.save(c)
                    return c
            conn.close()
        except: pass
        return None

    def save(self, c):
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO klines (time, pair, timeframe, open, high, low, close, volume, quote_volume, trade_count) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (time, pair, timeframe) DO UPDATE SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low, close=EXCLUDED.close, volume=EXCLUDED.volume, quote_volume=EXCLUDED.quote_volume, trade_count=EXCLUDED.trade_count", (c['time'], c['pair'], c['timeframe'], c['open'], c['high'], c['low'], c['close'], c['volume'], c['quote_volume'], c['trade_count']))
        conn.commit(); conn.close()
