import asyncio
import json
import time
import structlog
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict

from .config.settings import settings
from .database.postgres_client import postgres_client
from .database.redis_client import redis_client
from .core.websocket_manager import MultiWebSocketManager
from .core.signal_engine import SignalEngine
from .core.telegram_bot import telegram_bot_instance
import backend.core.telegram_bot as tb_module
from .api import routes, websocket as ws_router

logger = structlog.get_logger()

# Instances
signal_engine = SignalEngine(mode="HUNTER")
ws_manager = MultiWebSocketManager()

# Timeframe buffers
candle_buffer: Dict[str, list] = {"1m": [], "5m": [], "15m": []}

async def on_liquidation_cascade(side: str, amount: float) -> None:
    await telegram_bot_instance.send_liquidation_alert(side, amount)
    logger.info("liquidation_cascade_alert_sent", side=side, amount_usd=amount)

signal_engine.liq_monitor.callback = on_liquidation_cascade

# Data Sources Definitions
BINANCE_WS = "wss://fstream.binance.com/stream?streams=btcusdt@kline_1m/btcusdt@depth20@100ms/btcusdt@forceOrder/btcusdt@markPrice@1s"
BYBIT_WS = 'wss://stream.bybit.com/v5/public/linear?args=["orderbook.1.BTCUSDT","tickers.BTCUSDT","liquidation.BTCUSDT"]'
MEMPOOL_WS = "wss://mempool.space/api/v1/ws"

ws_manager.add_source("binance", BINANCE_WS)
ws_manager.add_source("bybit", BYBIT_WS)
ws_manager.add_source("mempool", MEMPOOL_WS)

async def _process_stream(source: str, data: Dict[str, Any]):
    try:
        if source == "binance":
            stream = data.get("stream", "")
            payload = data.get("data", data)
            
            if "kline" in stream:
                k = payload.get("k", {})
                await ws_router.frontend_ws_manager.broadcast({
                    "stream": stream,
                    "data": payload
                })

                if k.get("x"):
                    from .models.market_data import Candle
                    from datetime import datetime, timezone
                    candle = Candle(
                        open=float(k["o"]),
                        high=float(k["h"]),
                        low=float(k["l"]),
                        close=float(k["c"]),
                        volume=float(k["v"]),
                        timestamp=datetime.fromtimestamp(k["T"]/1000, tz=timezone.utc),
                        timeframe="1m"
                    )
                    candle_buffer["1m"].append(candle)
                    if len(candle_buffer["1m"]) > 200:
                        candle_buffer["1m"] = candle_buffer["1m"][-200:]

                    # Evaluate signal
                    if ws_manager.global_state != "DATA_STARVED":
                        signal = await signal_engine.evaluate(
                            current_price=float(k["c"]),
                            candles=candle_buffer,
                            is_ws_healthy=ws_manager.is_healthy
                        )
                        if signal:
                            await telegram_bot_instance.send_signal(signal)
                            await ws_router.frontend_ws_manager.broadcast({
                                "type": "signal",
                                "data": signal.dict()
                            })

            elif "depth" in stream:
                bids = payload.get("b", [])
                asks = payload.get("a", [])
                if bids and asks:
                    bid_vol = sum(float(b[1]) for b in bids[:5])
                    ask_vol = sum(float(a[1]) for a in asks[:5])
                    signal_engine.ob_tracker.update(bid_vol, ask_vol, float(bids[0][0]), float(asks[0][0]))
                    ratio, _ = signal_engine.ob_tracker.calculate_imbalance()
                    await ws_router.frontend_ws_manager.broadcast({
                        "type": "orderbook_ratio",
                        "ratio": ratio
                    })

            elif "forceOrder" in stream:
                o = payload.get("o", {})
                side = o.get("S", "")
                price = float(o.get("p", 0))
                qty = float(o.get("q", 0))
                if price and qty:
                    signal_engine.liq_monitor.add_liquidation(side, price, qty)

            elif "markPrice" in stream:
                rate = float(payload.get("r", 0))
                next_time = int(payload.get("T", 0))
                signal_engine.funding_tracker.update(rate, next_time)
                await ws_router.frontend_ws_manager.broadcast({
                    "stream": stream,
                    "data": payload
                })
        
        elif source == "bybit":
            # Just keeping placeholder for bybit data tracking logic 
            pass
            
        elif source == "mempool":
            # mempool tx check logic
            pass
            
    except Exception as e:
        logger.error("stream_parse_error", source=source, error=str(e))

ws_manager.add_callback("binance", _process_stream)
ws_manager.add_callback("bybit", _process_stream)
ws_manager.add_callback("mempool", _process_stream)

def get_health_status() -> dict:
    return {
        "binance_connected": ws_manager.connections["binance"].state == "HEALTHY",
        "binance_latency": int(time.time() - ws_manager.connections["binance"].last_msg_time) * 1000 if ws_manager.connections["binance"].state == "HEALTHY" else 0,
        "bybit_connected": ws_manager.connections["bybit"].state == "HEALTHY",
        "bybit_latency": int(time.time() - ws_manager.connections["bybit"].last_msg_time) * 1000 if ws_manager.connections["bybit"].state == "HEALTHY" else 0,
        "mempool_connected": ws_manager.connections["mempool"].state == "HEALTHY",
        "last_signal_ago": "N/A", # Will implement tracking from signal_engine
        "mode": signal_engine.mode.name,
        "signals_24h": len(signal_engine.recent_signals)
    }

tb_module.get_health_callback = get_health_status

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("venom_bot_starting")

    await postgres_client.connect()
    await redis_client.connect()

    # CRITICAL: Verify telegram initialization immediately
    await telegram_bot_instance.initialize()
    
    # Start Telegram background polling non-blocking
    asyncio.create_task(telegram_bot_instance.start_polling())

    # Start multi websocket concurrently
    logger.info("starting_ws_streams")
    asyncio.create_task(ws_manager.start_all())

    # Background task to push real time systemic telemetry to UI
    async def _push_status_telemetry():
        while True:
            await asyncio.sleep(2)
            await ws_router.frontend_ws_manager.broadcast({
                "type": "status_update",
                "payload": get_health_status()
            })
    
    asyncio.create_task(_push_status_telemetry())

    yield

    logger.info("venom_bot_shutting_down")
    await postgres_client.disconnect()
    await redis_client.disconnect()

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
    health = get_health_status()
    # "heartbeat requirement: return 200 with all WS connected"
    return {
        "status": "venom_active" if ws_manager.global_state != "DATA_STARVED" else "data_starved",
        "ws_states": {
            "binance": ws_manager.connections["binance"].state,
            "bybit": ws_manager.connections["bybit"].state,
            "mempool": ws_manager.connections["mempool"].state
        },
        **health
    }
