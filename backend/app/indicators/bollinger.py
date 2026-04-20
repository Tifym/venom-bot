import logging
import pandas as pd
import talib
from app.database import get_connection
from app.config import THRESHOLDS

logger = logging.getLogger(__name__)

def calculate_delta_state(pair, timeframe, candle):
    try:
        df = get_recent_klines(pair, timeframe, limit=100)
        if len(df) < 20: return 'NEUTRAL'
        period, stddev = THRESHOLDS.get('bb_period', 20), THRESHOLDS.get('bb_stddev', 2)
        upper, middle, lower = talib.BBANDS(df['close'], timeperiod=period, nbdevup=stddev, nbdevdn=stddev, matype=0)
        current_close = candle['close']
        last_upper, last_lower = upper.iloc[-1], lower.iloc[-1]
        if current_close >= last_upper: return 'BEARISH'
        elif current_close <= last_lower: return 'BULLISH'
        return 'NEUTRAL'
    except Exception as e:
        logger.error(f"Error calculating BB: {e}")
        return 'NEUTRAL'

def get_recent_klines(pair, timeframe, limit=100):
    try:
        conn = get_connection()
        query = "SELECT time, close FROM klines WHERE pair = %s AND timeframe = %s ORDER BY time DESC LIMIT %s"
        df = pd.read_sql(query, conn, params=(pair, timeframe, limit))
        conn.close()
        df = df.sort_values('time').reset_index(drop=True)
        return df
    except Exception as e:
        logger.error(f"Error fetching klines: {e}")
        return pd.DataFrame()
