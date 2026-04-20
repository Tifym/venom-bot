import logging
import pandas as pd
import talib
from app.database import get_connection
from app.config import THRESHOLDS

logger = logging.getLogger(__name__)

def calculate_beta_state(pair, timeframe, candle):
    try:
        df = get_recent_klines(pair, timeframe, limit=300)
        if len(df) < 50: return 'NEUTRAL', None
        rsi_period = THRESHOLDS.get('rsi_period', 14)
        df['rsi'] = talib.RSI(df['close'], timeperiod=rsi_period)
        df = df.dropna(subset=['rsi'])
        lb = 5
        df['price_h'] = df['high'].iloc[lb:-lb].where((df['high'].iloc[lb:-lb] == df['high'].rolling(2*lb+1, center=True).max()))
        df['price_l'] = df['low'].iloc[lb:-lb].where((df['low'].iloc[lb:-lb] == df['low'].rolling(2*lb+1, center=True).min()))
        df['rsi_h'] = df['rsi'].iloc[lb:-lb].where((df['rsi'].iloc[lb:-lb] == df['rsi'].rolling(2*lb+1, center=True).max()))
        df['rsi_l'] = df['rsi'].iloc[lb:-lb].where((df['rsi'].iloc[lb:-lb] == df['rsi'].rolling(2*lb+1, center=True).min()))
        p_pivots_h, p_pivots_l = df[df['price_h'].notnull()], df[df['price_l'].notnull()]
        r_pivots_h, r_pivots_l = df[df['rsi_h'].notnull()], df[df['rsi_l'].notnull()]
        if len(p_pivots_h) < 2 or len(p_pivots_l) < 2: return 'NEUTRAL', None
        curr_p_l, prev_p_l = p_pivots_l.iloc[-1], p_pivots_l.iloc[-2]
        curr_r_l, prev_r_l = df.loc[curr_p_l.name, 'rsi'], df.loc[prev_p_l.name, 'rsi']
        if curr_p_l['low'] < prev_p_l['low'] and curr_r_l > prev_r_l: return 'BULLISH', 'Regular'
        curr_p_h, prev_p_h = p_pivots_h.iloc[-1], p_pivots_h.iloc[-2]
        curr_r_h, prev_r_h = df.loc[curr_p_h.name, 'rsi'], df.loc[prev_p_h.name, 'rsi']
        if curr_p_h['high'] > prev_p_h['high'] and curr_r_h < prev_r_h: return 'BEARISH', 'Regular'
        if curr_p_l['low'] > prev_p_l['low'] and curr_r_l < prev_r_l: return 'BULLISH', 'Hidden'
        if curr_p_h['high'] < prev_p_h['high'] and curr_r_h > prev_r_h: return 'BEARISH', 'Hidden'
        return 'NEUTRAL', None
    except Exception as e:
        logger.error(f"Error calculating BETA: {e}")
        return 'NEUTRAL', None

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
