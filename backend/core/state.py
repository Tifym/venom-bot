from .signal_engine import SignalEngine
from .telegram_bot import TelegramBot
from .news_fetcher import NewsFetcher

# Shared instances to avoid circular imports
signal_engine = SignalEngine(mode="PREDATOR")
telegram_bot = TelegramBot()
news_fetcher = NewsFetcher()
