import asyncio, json, logging, websockets
from datetime import datetime, timezone
from app.config import PAIRS
from app.database import get_connection

logger = logging.getLogger(__name__)

class WSSpotManager:
    def __init__(self, aggregation_engine):
        self.url = "wss://stream.binance.com:9443/ws"
        self.agg_engine = aggregation_engine
        self.running = False

    async def start(self):
        self.running = True
        while self.running:
            try:
                async with websockets.connect(self.url) as ws:
                    await ws.send(json.dumps({"method":"SUBSCRIBE", "params":[f"{p.lower()}@kline_1m" for p in PAIRS], "id":1}))
                    async for msg in ws:
                        d = json.loads(msg)
                        if 'k' in d: await self.handle_kline(d)
            except: await asyncio.sleep(5)

    async def handle_kline(self, d):
        k = d['k']
        if k['x']:
            c = {'time': datetime.fromtimestamp(k['t']/1000, tz=timezone.utc), 'pair': k['s'], 'timeframe': '1m', 'open': float(k['o']), 'high': float(k['h']), 'low': float(k['l']), 'close': float(k['c']), 'volume': float(k['v']), 'quote_volume': float(k['q']), 'trade_count': int(k['n'])}
            self.save_kline(c)
            await self.agg_engine.process_1m_candle(c)

    def save_kline(self, c):
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO klines (time, pair, timeframe, open, high, low, close, volume, quote_volume, trade_count) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (time, pair, timeframe) DO UPDATE SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low, close=EXCLUDED.close, volume=EXCLUDED.volume, quote_volume=EXCLUDED.quote_volume, trade_count=EXCLUDED.trade_count", (c['time'], c['pair'], c['timeframe'], c['open'], c['high'], c['low'], c['close'], c['volume'], c['quote_volume'], c['trade_count']))
        conn.commit(); conn.close()
