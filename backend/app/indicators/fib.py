import logging
import pandas as pd
import numpy as np
from app.database import get_connection
from app.config import ALFA_ZONES, THRESHOLDS

logger = logging.getLogger(__name__)

def calculate_alfa_state(pair, timeframe, candle):
    try:
        df = get_recent_klines(pair, timeframe, limit=300)
        if len(df) < 20: return 'NEUTRAL', 0, 0
        lb = THRESHOLDS.get('pivot_lookback', 5)
        df['pivot_h'] = df['high'].iloc[lb:-lb].where((df['high'].iloc[lb:-lb] == df['high'].rolling(2*lb+1, center=True).max()))
        df['pivot_l'] = df['low'].iloc[lb:-lb].where((df['low'].iloc[lb:-lb] == df['low'].rolling(2*lb+1, center=True).min()))
        pivots_h = df[df['pivot_h'].notnull()]
        pivots_l = df[df['pivot_l'].notnull()]
        if pivots_h.empty or pivots_l.empty: return 'NEUTRAL', 0, 0
        last_h = pivots_h.iloc[-1]
        last_l = pivots_l.iloc[-1]
        is_bullish_swing = last_l.name > last_h.name
        swing_high = last_h['high']
        swing_low = last_l['low']
        swing_range = swing_high - swing_low
        if swing_range <= 0: return 'NEUTRAL', 0, 0
        zone_config = ALFA_ZONES.get(timeframe, ALFA_ZONES['default'])
        current_price = candle['close']
        if is_bullish_swing:
            zone_high = swing_high - (zone_config['low'] * swing_range)
            zone_low = swing_high - (zone_config['high'] * swing_range)
            if zone_low <= current_price <= zone_high: return 'BULLISH', float(zone_low), float(zone_high)
        else:
            zone_low = swing_low + (zone_config['low'] * swing_range)
            zone_high = swing_low + (zone_config['high'] * swing_range)
            if zone_low <= current_price <= zone_high: return 'BEARISH', float(zone_low), float(zone_high)
        return 'NEUTRAL', float(zone_low), float(zone_high)
    except Exception as e:
        logger.error(f"Error calculating ALFA for {pair} {timeframe}: {e}")
        return 'NEUTRAL', 0, 0

def get_recent_klines(pair, timeframe, limit=300):
    try:
        conn = get_connection()
        query = "SELECT time, open, high, low, close, volume FROM klines WHERE pair = %s AND timeframe = %s ORDER BY time DESC LIMIT %s"
        df = pd.read_sql(query, conn, params=(pair, timeframe, limit))
        conn.close()
        df = df.sort_values('time').reset_index(drop=True)
        return df
    except Exception as e:
        logger.error(f"Error fetching klines: {e}")
        return pd.DataFrame()
