import logging, json
from datetime import datetime, timezone
from app.database import get_connection
from app.config import THRESHOLDS, TIMEFRAME_MULTIPLIERS

logger = logging.getLogger(__name__)

class SignalEngine:
    def __init__(self, socket_manager):
        self.sio = socket_manager
        self.weights = {'alfa': 0.25, 'beta': 0.30, 'delta': 0.20, 'gamma': 0.25}

    async def check_confluence(self, pair, primary_tf, candle):
        states = self.get_pair_states(pair)
        if not states: return
        await self.evaluate_direction(pair, primary_tf, candle, states, 'LONG')
        await self.evaluate_direction(pair, primary_tf, candle, states, 'SHORT')

    async def evaluate_direction(self, pair, tf, candle, states, direction):
        raw, total = 0, 0
        for t, s in states.items():
            mult = TIMEFRAME_MULTIPLIERS.get(t, 1.0)
            tf_s = 0
            if direction == 'LONG':
                if s['alfa_state'] == 'BULLISH': tf_s += self.weights['alfa']
                if s['beta_state'] == 'BULLISH': tf_s += self.weights['beta']
                if s['delta_state'] == 'BULLISH': tf_s += self.weights['delta']
                if s['gamma_state'] == 'BULLISH': tf_s += self.weights['gamma']
            else:
                if s['alfa_state'] == 'BEARISH': tf_s += self.weights['alfa']
                if s['beta_state'] == 'BEARISH': tf_s += self.weights['beta']
                if s['delta_state'] == 'BEARISH': tf_s += self.weights['delta']
                if s['gamma_state'] == 'BEARISH': tf_s += self.weights['gamma']
            raw += (tf_s * mult); total += mult
        norm = raw / total if total > 0 else 0
        if norm >= THRESHOLDS['signal_min_score']:
            await self.fire_signal(pair, tf, candle, direction, norm)

    async def fire_signal(self, pair, tf, candle, direction, score):
        entry = candle['close']
        atr = 0.01 * entry
        stop = entry - (atr * 1.5) if direction == 'LONG' else entry + (atr * 1.5)
        target = entry + (atr * 2.5) if direction == 'LONG' else entry - (atr * 2.5)
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO signals (pair, primary_timeframe, direction, score, entry_price, stop_loss, take_profit, status) VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending') RETURNING signal_id", (pair, tf, direction, score, entry, stop, target))
            sid = cur.fetchone()[0]
        conn.commit(); conn.close()
        if self.sio: await self.sio.emit('signal_fired', {'signal_id': sid, 'pair': pair, 'timeframe': tf, 'direction': direction, 'score': score, 'entry': entry, 'stop': stop, 'target': target, 'timestamp': datetime.now(timezone.utc).isoformat()})

    def get_pair_states(self, pair):
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT timeframe, alfa_state, beta_state, delta_state, gamma_state FROM signal_states WHERE pair = %s", (pair,))
                rows = cur.fetchall()
            conn.close()
            return {r[0]: {'alfa_state': r[1], 'beta_state': r[2], 'delta_state': r[3], 'gamma_state': r[4]} for r in rows}
        except: return None
