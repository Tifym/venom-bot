import logging
import pandas as pd
import talib
from app.database import get_connection
from app.config import THRESHOLDS

logger = logging.getLogger(__name__)

def calculate_implicit_state(pair, timeframe, candle):
    try:
        df = get_recent_klines(pair, timeframe, limit=300)
        if len(df) < 50: return 'NEUTRAL'
        fast, slow, signal = THRESHOLDS.get('macd_fast', 12), THRESHOLDS.get('macd_slow', 26), THRESHOLDS.get('macd_signal', 9)
        _, _, hist = talib.MACD(df['close'], fastperiod=fast, slowperiod=slow, signalperiod=signal)
        df['hist'] = hist
        df = df.dropna(subset=['hist']).reset_index(drop=True)
        peaks, troughs = [], []
        for i in range(2, len(df)):
            if df.loc[i-1, 'hist'] > 0:
                if df.loc[i, 'hist'] < df.loc[i-1, 'hist'] and df.loc[i-1, 'hist'] > df.loc[i-2, 'hist']:
                    peaks.append({'index': i-1, 'hist': df.loc[i-1, 'hist'], 'price': df.loc[i-1, 'high']})
            if df.loc[i-1, 'hist'] < 0:
                if df.loc[i, 'hist'] > df.loc[i-1, 'hist'] and df.loc[i-1, 'hist'] < df.loc[i-2, 'hist']:
                    troughs.append({'index': i-1, 'hist': df.loc[i-1, 'hist'], 'price': df.loc[i-1, 'low']})
        if len(peaks) >= 2:
            curr_peak, prev_peak = peaks[-1], peaks[-2]
            if curr_peak['hist'] < prev_peak['hist'] and curr_peak['price'] > prev_peak['price']: return 'BEARISH'
        if len(troughs) >= 2:
            curr_trough, prev_trough = troughs[-1], troughs[-2]
            if curr_trough['hist'] > prev_trough['hist'] and curr_trough['price'] < prev_trough['price']: return 'BULLISH'
        return 'NEUTRAL'
    except Exception as e:
        logger.error(f"Error calculating Implicit Divergence: {e}")
        return 'NEUTRAL'

def get_recent_klines(pair, timeframe, limit=300):
    try:
        conn = get_connection()
        query = "SELECT time, high, low, close FROM klines WHERE pair = %s AND timeframe = %s ORDER BY time DESC LIMIT %s"
        df = pd.read_sql(query, conn, params=(pair, timeframe, limit))
        conn.close()
        df = df.sort_values('time').reset_index(drop=True)
        return df
    except Exception as e:
        logger.error(f"Error fetching klines: {e}")
        return pd.DataFrame()
