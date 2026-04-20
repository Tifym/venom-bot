import logging
from app.database import get_connection
from app.indicators.fib import calculate_alfa_state
from app.indicators.divergence import calculate_beta_state
from app.indicators.implicit_divergence import calculate_implicit_state
from app.indicators.bollinger import calculate_delta_state
from app.indicators.liquidation import calculate_gamma_state
from app.signal_engine import SignalEngine

logger = logging.getLogger(__name__)

class StateUpdater:
    def __init__(self, socket_manager):
        self.sio = socket_manager
        self.signal_engine = SignalEngine(socket_manager)

    async def update_state(self, pair, timeframe, candle):
        try:
            alfa, zl, zh = self.safe_call(calculate_alfa_state, pair, timeframe, candle, ('NEUTRAL', 0, 0))
            beta_reg, div = self.safe_call(calculate_beta_state, pair, timeframe, candle, ('NEUTRAL', None))
            beta_imp = self.safe_call(calculate_implicit_state, pair, timeframe, candle, 'NEUTRAL')
            beta = beta_reg if beta_reg != 'NEUTRAL' else beta_imp
            delta = self.safe_call(calculate_delta_state, pair, timeframe, candle, 'NEUTRAL')
            gamma = self.safe_call(calculate_gamma_state, pair, timeframe, candle, 'NEUTRAL')
            self.save_state({'pair': pair, 'timeframe': timeframe, 'alfa_state': alfa, 'alfa_zone_low': zl, 'alfa_zone_high': zh, 'beta_state': beta, 'beta_divergence_type': div, 'delta_state': delta, 'gamma_state': gamma})
            if self.sio: await self.sio.emit('state_update', {'pair': pair, 'timeframe': timeframe, 'alfa': alfa, 'beta': beta, 'delta': delta, 'gamma': gamma}, room=pair)
            await self.signal_engine.check_confluence(pair, timeframe, candle)
        except Exception as e: logger.error(f"State update failed: {e}")

    def safe_call(self, func, p, t, c, default):
        try: return func(p, t, c)
        except: return default

    def save_state(self, s):
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO signal_states (pair, timeframe, alfa_state, alfa_zone_low, alfa_zone_high, beta_state, beta_divergence_type, delta_state, gamma_state, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()) ON CONFLICT (pair, timeframe) DO UPDATE SET alfa_state=EXCLUDED.alfa_state, alfa_zone_low=EXCLUDED.alfa_zone_low, alfa_zone_high=EXCLUDED.alfa_zone_high, beta_state=EXCLUDED.beta_state, beta_divergence_type=EXCLUDED.beta_divergence_type, delta_state=EXCLUDED.delta_state, gamma_state=EXCLUDED.gamma_state, updated_at=NOW()", (s['pair'], s['timeframe'], s['alfa_state'], s['alfa_zone_low'], s['alfa_zone_high'], s['beta_state'], s['beta_divergence_type'], s['delta_state'], s['gamma_state']))
        conn.commit(); conn.close()
