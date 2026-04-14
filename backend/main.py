import asyncio
import json
import structlog
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict

from .config.settings import settings
from .database.postgres_client import postgres_client
from .database.redis_client import redis_client
from .core.websocket_manager import WebSocketManager
from .core.signal_engine import SignalEngine
from .core.telegram_bot import TelegramBot
from .core.liquidation_monitor import LiquidationMonitor
from .api import routes, websocket as ws_router

logger = structlog.get_logger()

# Global instances
signal_engine = SignalEngine(mode="PREDATOR")
telegram_bot = TelegramBot()

# Liquidation monitor with Telegram alert on cascade
async def on_liquidation_cascade(side: str, amount: float) -> None:
    await telegram_bot.send_liquidation_alert(side, amount)
    logger.info("liquidation_cascade_alert_sent", side=side, amount_usd=amount)

liq_monitor = LiquidationMonitor(callback=on_liquidation_cascade)
signal_engine.liq_monitor = liq_monitor

# Candle buffer for signal evaluation (keyed by timeframe)
candle_buffer: Dict[str, list] = {"1m": [], "5m": [], "15m": []}

# WebSocket streams
# Combined stream: kline_1m + depth20 + forceOrders + markPrice
BINANCE_COMBINED = (
    "wss://fstream.binance.com/stream?streams="
    "btcusdt@kline_1m/btcusdt@depth20@100ms/btcusdt@forceOrder/btcusdt@markPrice@1s"
)

primary_ws = WebSocketManager(BINANCE_COMBINED, "binance")
whale_ws = WebSocketManager(settings.MEMPOOL_WS_URL, "mempool")

async def process_binance_message(data: Dict[str, Any]) -> None:
    """Route combined stream messages to appropriate handlers."""
    try:
        # Combined stream wraps data in {"stream": "...", "data": {...}}
        stream = data.get("stream", "")
        payload = data.get("data", data)

        if "kline" in stream:
            k = payload.get("k", {})
            # Broadcast even if not closed, for real-time price movement
            await ws_router.frontend_ws_manager.broadcast({
                "stream": stream,
                "data": payload
            })

            if k.get("x"):  # Candle closed
                candle = {
                    "open": float(k["o"]),
                    "high": float(k["h"]),
                    "low": float(k["l"]),
                    "close": float(k["c"]),
                    "volume": float(k["v"]),
                    "timestamp": k["T"],
                }
                candle_buffer["1m"].append(candle)
                # Keep last 200 candles
                if len(candle_buffer["1m"]) > 200:
                    candle_buffer["1m"] = candle_buffer["1m"][-200:]

                # Try to generate a signal on every closed candle
                current_price = float(k["c"])
                signal = signal_engine.evaluate(current_price, candle_buffer)
                if signal:
                    logger.info("signal_generated", score=signal.total_score, direction=signal.direction.name)
                    await telegram_bot.send_signal(signal)
                    # Broadcast to frontend WebSocket clients
                    await ws_router.frontend_ws_manager.broadcast({
                        "type": "signal",
                        "data": {
                            "id": signal.id,
                            "direction": signal.direction.name,
                            "score": signal.total_score,
                            "zone": signal.zone.name,
                            "entry_low": signal.entry_low,
                            "entry_high": signal.entry_high,
                            "stop_loss": signal.stop_loss,
                            "tp1": signal.tp1,
                            "tp2": signal.tp2,
                        }
                    })

        elif "depth" in stream:
            # Order book update → feed orderbook tracker
            bids = payload.get("b", [])
            asks = payload.get("a", [])
            if bids and asks:
                bid_vol = sum(float(b[1]) for b in bids[:5])
                ask_vol = sum(float(a[1]) for a in asks[:5])
                signal_engine.ob_tracker.update(bid_vol, ask_vol, float(bids[0][0]), float(asks[0][0]))
                
                # Broadcast ratio periodically or on significant change
                ratio = bid_vol / ask_vol if ask_vol > 0 else 1.0
                await ws_router.frontend_ws_manager.broadcast({
                    "type": "orderbook_ratio",
                    "ratio": ratio
                })

        elif "forceOrder" in stream:
            # Liquidation event
            o = payload.get("o", {})
            side = o.get("S", "")
            price = float(o.get("p", 0))
            qty = float(o.get("q", 0))
            if price and qty:
                liq_monitor.add_liquidation(side, price, qty)

        elif "markPrice" in stream:
            # Funding rate update
            rate = float(payload.get("r", 0))
            next_time = int(payload.get("T", 0))
            signal_engine.funding_tracker.update(rate, next_time)
            # Broadcast to UI
            await ws_router.frontend_ws_manager.broadcast({
                "stream": stream,
                "data": payload
            })

    except Exception as e:
        logger.error("binance_message_processing_error", error=str(e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("venom_bot_starting")

    await postgres_client.connect()
    await redis_client.connect()

    # Register data callback before connecting
    primary_ws.add_callback(process_binance_message)

    # Start WebSocket connections
    asyncio.create_task(primary_ws.connect())
    asyncio.create_task(whale_ws.connect())

    # Allow connections to establish
    await asyncio.sleep(3)
    logger.info("ws_connection_status", binance=primary_ws.is_connected, mempool=whale_ws.is_connected)

    yield

    logger.info("venom_bot_shutting_down")
    await postgres_client.disconnect()
    await redis_client.disconnect()
    await primary_ws.disconnect()
    await whale_ws.disconnect()

app = FastAPI(title="VENOM BOT API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")
app.include_router(ws_router.router)

@app.get("/health")
async def health_check():
    return {
        "status": "venom_active",
        "postgres": postgres_client.engine is not None,
        "redis": redis_client.client is not None,
        "binance_ws": primary_ws.is_connected,
        "mempool_ws": whale_ws.is_connected,
        "candles_buffered": len(candle_buffer.get("1m", [])),
    }
