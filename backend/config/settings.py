from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # DB
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "postgresql://venom:password@localhost:5432/venom_bot"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    JWT_SECRET: str = "secret"
    
    # WebSockets
    BINANCE_WS_URL: str = "wss://fstream.binance.com/ws/"
    BYBIT_WS_URL: str = "wss://stream.bybit.com/v5/public/"
    MEMPOOL_WS_URL: str = "wss://mempool.space/api/v1/ws"

    ENV: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
