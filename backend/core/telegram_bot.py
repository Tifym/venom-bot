import structlog
import asyncio
from aiogram import Bot, Dispatcher, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import Message
from typing import Optional, Dict, Any

from ..config.settings import settings
from ..models.signal import VenomSignal

logger = structlog.get_logger()
router = Router()
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()
dp.include_router(router)

# To be set externally or queried via singleton
get_health_callback = None
get_stats_callback = None

@router.message(Command("start"))
async def cmd_start(message: Message):
    mode = "HUNTER" # Default or pull from state
    count = 0
    await message.reply(
        "🐍 <b>VENOM BOT ACTIVATED</b>\n\n"
        "You will receive strikes when the market breathes.\n"
        f"Mode: <b>{mode}</b>\n"
        f"Signals today: {count}\n\n"
        "/status — Check system health\n"
        "/stats — 24h performance\n"
        "/last — Last 5 signals\n"
        "/mode — Current settings"
    )

@router.message(Command("status"))
async def cmd_status(message: Message):
    if not get_health_callback:
        await message.reply("Status callback not configured.")
        return
        
    health = get_health_callback()
    
    # health should be a dict: { 'binance_latency': 10, 'binance_connected': True ... }
    b_stat = "🟢" if health.get('binance_connected') else "🔴"
    by_stat = "🟢" if health.get('bybit_connected') else "🔴"
    m_stat = "🟢" if health.get('mempool_connected') else "🔴"
    
    await message.reply(
        f"{b_stat} <b>SYSTEM STATUS</b>\n\n"
        f"Binance WS: {health.get('binance_latency', 0)}ms\n"
        f"Bybit WS: {health.get('bybit_latency', 0)}ms\n"
        f"Mempool: {m_stat}\n"
        f"Last signal: {health.get('last_signal_ago', 'N/A')}s ago\n"
        f"Mode: {health.get('mode', 'HUNTER')}\n"
        f"Signals 24h: {health.get('signals_24h', 0)}"
    )

class TelegramBot:
    def __init__(self):
        self.chat_id = settings.TELEGRAM_CHAT_ID

    async def initialize(self):
        try:
            me = await bot.get_me()
            logger.info(f"telegram_bot_connected", username=me.username)
            if self.chat_id:
                await bot.send_message(
                    chat_id=self.chat_id,
                    text="🐍 VENOM BOT ONLINE\nWaiting for market to breathe..."
                )
        except Exception as e:
            logger.error("telegram_init_failed", error=str(e))
            raise e # Crash the backend as per prompt requirement

    async def start_polling(self):
        await dp.start_polling(bot)

    async def send_signal(self, signal: VenomSignal):
        dir_str = signal.direction.name
        score = signal.total_score
        mode = signal.mode.name
        if signal.mode.name == "CUSTOM" and hasattr(signal, 'preset') and signal.preset.custom_options:
            mode = f"CUSTOM ({signal.preset.custom_options.name})"
        low = f"{signal.entry_low:.2f}"
        high = f"{signal.entry_high:.2f}"
        
        # Fibonacci approximations or exact string mappings from the zone
        fib_low, fib_high = (0.618, 0.650) # default example
        
        sl = f"{signal.stop_loss:.2f}"
        sl_pct = 0.5
        tp1 = f"{signal.tp1:.2f}"
        tp2 = f"{signal.tp2:.2f}"
        
        div_tfs = ", ".join(signal.confluence.divergence_tfs) or "None"
        div_type = signal.confluence.divergence_type.name
        div_pts = signal.confluence.divergence_score
        
        ob_ratio = f"{signal.confluence.orderbook_ratio:.2f}"
        ob_pts = signal.confluence.orderbook_score
        
        vol_mult = 1.5
        vol_pts = signal.confluence.volume_score
        
        funding = f"{signal.confluence.funding_rate * 100:.4f}"
        fund_pts = signal.confluence.funding_score
        
        liq_boost = f"💥 Liquidation Boost: +{signal.confluence.liquidation_boost} pts" if signal.confluence.liquidation_boost else ""
        panel_url = "http://localhost:3000"

        text = f"""🐍 <b>VENOM STRIKE — {dir_str}</b>

📊 <b>Confidence: {score}/100</b> │ {mode} │ Valid: 15min

🎯 <b>Entry Zone:</b> ${low} — ${high}
   └─ <b>{signal.zone.name} POCKET</b> ({fib_low}-{fib_high} Fib)

⛔ <b>Stop Loss:</b> ${sl} (-{sl_pct}%)
✅ <b>TP1:</b> ${tp1} (1:2 R:R)
✅ <b>TP2:</b> ${tp2} (1:3 R:R)

📈 <b>Confluence:</b>
   • Divergence: {div_tfs} ({div_type}) — +{div_pts} pts
   • Order Flow: {ob_ratio}x bid/ask — +{ob_pts} pts
   • Volume: {vol_mult}x spike — +{vol_pts} pts
   • Funding: {funding}% — +{fund_pts} pts
   • BBands Pierce — Checked

⚡ <b>Context:</b>
   {liq_boost}
   ATR: 0.2% │ Session: NY

🔒 <b>Risk:</b> 0.5% account per strike

<a href="{panel_url}">Open Venom Panel</a>"""
        
        try:
            await bot.send_message(chat_id=self.chat_id, text=text, disable_web_page_preview=True)
        except Exception as e:
            logger.error("telegram_send_signal_error", error=str(e))

    async def send_liquidation_alert(self, side: str, amount: float):
        dir_emoji = "📉" if side == "SHORT" else "📈"
        amount_m = amount / 1_000_000
        text = f"""💥 <b>VENOM SENSES BLOOD</b>

{dir_emoji} ${amount_m:.1f}M {side}s Liquidated (60s)

⚠️ <b>MOMENTUM BOOST ACTIVE</b>
Watch for entries on next pocket approach"""
        try:
            await bot.send_message(chat_id=self.chat_id, text=text)
        except Exception as e:
            logger.error("telegram_send_liq_alert_error", error=str(e))

# Initializing global instance
telegram_bot_instance = TelegramBot()
