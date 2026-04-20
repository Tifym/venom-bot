import os

# Server Settings
HOST = "0.0.0.0"
PORT = 8000
DEBUG = True

# Mode: 'demo' or 'live'
MODE = os.getenv("MODE", "demo")

# Pairs to track
PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']

# Timeframes for each signal category
TIMEFRAMES = {
    'alfa': ['1D','4H','3H','2H','1H','24m','12m','6m','3m','1m'],
    'beta': ['1H','24m','12m','6m','3m','1m'],
    'delta': ['1H','24m','12m','6m','3m','1m'],
    'gamma': ['1H','24m','12m','6m','3m','1m']
}

# ALFA (Fibonacci) Zone Bounds
ALFA_ZONES = {
    'default': {'low': 0.618, 'high': 0.786},
    '1D': {'low': 0.618, 'high': 0.65},
    '4H': {'low': 0.618, 'high': 0.786},
    '3H': {'low': 0.618, 'high': 0.786},
    '2H': {'low': 0.618, 'high': 0.786},
    '1H': {'low': 0.618, 'high': 0.786},
    '24m': {'low': 0.618, 'high': 0.786},
    '12m': {'low': 0.618, 'high': 0.786},
    '6m': {'low': 0.618, 'high': 0.786},
    '3m': {'low': 0.618, 'high': 0.786},
    '1m': {'low': 0.618, 'high': 0.786}
}

# Thresholds and Constants
THRESHOLDS = {
    'signal_min_score': 0.70,
    'weak_score': 0.50,
    'strong_score': 0.85,
    'approval_timeout_seconds': 300,
    'max_positions': 5,
    'daily_loss_limit_pct': 6.0,
    'risk_per_trade': 0.02,
    'atr_stop_mult': 1.5,
    'atr_target_mult': 2.5,
    'min_swing_pct': 0.02,
    'pivot_lookback': 5,
    'rsi_period': 14,
    'bb_period': 20,
    'bb_stddev': 2,
    'macd_fast': 12,
    'macd_slow': 26,
    'macd_signal': 9
}

# Multipliers for timeframe priority/weighting
TIMEFRAME_MULTIPLIERS = {
    '1D': 4.0, '4H': 3.5, '3H': 3.0, '2H': 2.5,
    '1H': 2.0, '24m': 1.5, '12m': 1.3, '6m': 1.2,
    '3m': 1.1, '1m': 1.0
}

# Database & Cache URLs (from Docker environment)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:venombot123@timescaledb:5432/venombot")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Binance API Credentials
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET = os.getenv("BINANCE_SECRET", "")
BINANCE_TESTNET_KEY = os.getenv("BINANCE_TESTNET_KEY", "")
BINANCE_TESTNET_SECRET = os.getenv("BINANCE_TESTNET_SECRET", "")
