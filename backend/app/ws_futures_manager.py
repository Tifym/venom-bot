import asyncio, json, logging, websockets
from datetime import datetime, timezone
from app.config import PAIRS
from app.redis_client import redis_client
from app.database import get_connection

logger = logging.getLogger(__name__)

class WSFuturesManager:
    def __init__(self):
        self.url = "wss://fstream.binance.com/ws"
        self.running = False

    async def start(self):
        self.running = True
        asyncio.create_task(self.liquidation_flusher())
        while self.running:
            try:
                async with websockets.connect(self.url) as ws:
                    p = ["!forceOrder@arr"]
                    p.extend([f"{pair.lower()}@kline_1d" for pair in PAIRS])
                    await ws.send(json.dumps({"method":"SUBSCRIBE", "params":p, "id":1}))
                    async for msg in ws:
                        d = json.loads(msg)
                        if d.get('e') == 'forceOrder': await self.handle_liquidation(d)
                        elif 'k' in d: await self.handle_1d_kline(d)
            except: await asyncio.sleep(5)

    async def handle_liquidation(self, d):
        o = d['o']
        await redis_client.push_liquidation(o['s'], o['S'], float(o['p']), float(o['q']), float(o['p']) * float(o['q']))

    async def handle_1d_kline(self, d):
        k = d['k']
        if k['x']:
            c = {'time': datetime.fromtimestamp(k['t']/1000, tz=timezone.utc), 'pair': k['s'], 'timeframe': '1D', 'open': float(k['o']), 'high': float(k['h']), 'low': float(k['l']), 'close': float(k['c']), 'volume': float(k['v']), 'quote_volume': float(k['q']), 'trade_count': int(k['n'])}
            self.save_kline(c)

    def save_kline(self, c):
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO klines (time, pair, timeframe, open, high, low, close, volume, quote_volume, trade_count) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (time, pair, timeframe) DO UPDATE SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low, close=EXCLUDED.close, volume=EXCLUDED.volume, quote_volume=EXCLUDED.quote_volume, trade_count=EXCLUDED.trade_count", (c['time'], c['pair'], c['timeframe'], c['open'], c['high'], c['low'], c['close'], c['volume'], c['quote_volume'], c['trade_count']))
        conn.commit(); conn.close()

    async def liquidation_flusher(self):
        while self.running:
            await asyncio.sleep(5)
            try:
                evs = await redis_client.get_liquidations(100)
                if not evs: continue
                now = datetime.now(timezone.utc)
                conn = get_connection()
                with conn.cursor() as cur:
                    for e in evs:
                        pair, side, price, qty, val = e.split(":")
                        cur.execute("INSERT INTO liquidations (time, pair, side, price, qty, usd_value) VALUES (%s, %s, %s, %s, %s, %s)", (now, pair, side, float(price), float(qty), float(val)))
                conn.commit(); conn.close()
            except: pass
