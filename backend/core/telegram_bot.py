import httpx
import structlog
from typing import Optional
from ..config.settings import settings
from ..models.signal import VenomSignal

logger = structlog.get_logger()

class TelegramBot:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.api_url = f"https://api.telegram.org/bot{self.token}/sendMessage"

    async def send_message(self, text: str, parse_mode: str = "HTML") -> bool:
        if not self.token or not self.chat_id:
            logger.warning("telegram_credentials_missing")
            return False
            
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True
        }
        
        async with httpx.AsyncClient() as client:
            try:
                # Basic execution, retry loop handled via external decorator or caller
                response = await client.post(self.api_url, json=payload, timeout=10.0)
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error("telegram_send_error", error=str(e))
                return False

    async def send_signal(self, signal: VenomSignal):
        emoji_dir = "▲LONG" if signal.direction.name == "LONG" else "▼SHORT"
        zone_color = "🟢" if "ALPHA" in signal.zone.name else "🟡" if "BETA" in signal.zone.name else "🟠"
        
        text = f"""
🐍 <b>VENOM STRIKE — {signal.direction.name}</b>

📊 <b>Confidence: {signal.total_score}/100</b> │ {signal.mode.name} MODE │ Valid: 15min

🎯 <b>Entry Zone:</b> ${signal.entry_low:.2f} — ${signal.entry_high:.2f}
   └─ <b>{signal.zone.name} POCKET</b> {zone_color}

⛔ <b>Stop Loss:</b> ${signal.stop_loss:.2f}
✅ <b>TP1:</b> ${signal.tp1:.2f}
✅ <b>TP2:</b> ${signal.tp2:.2f}

📈 <b>Venom Confluence:</b>
   • Divergence: {signal.confluence.divergence_type.name} — +{signal.confluence.divergence_score} pts 🟢
   • Order Flow: {signal.confluence.orderbook_ratio:.2f}x bid/ask ratio — +{signal.confluence.orderbook_score} pts 🟢
   • Funding: {signal.confluence.funding_rate:.4f}% — +{signal.confluence.funding_score} pts 🟢

⚡ <b>Market Context:</b>
   💥 Liquidation Boost: +{signal.confluence.liquidation_boost} pts
   
🔒 <b>Risk:</b> 0.5% account per strike

<a href="https://localhost:3000">Open Venom Panel</a>
"""
        await self.send_message(text)

    async def send_liquidation_alert(self, side: str, amount: float):
        dir_emoji = "📉" if side == "SHORT" else "📈"
        amount_m = amount / 1_000_000
        text = f"""
💥 <b>VENOM SENSES BLOOD</b>

{dir_emoji} ${amount_m:.1f}M {side}s Liquidated (60s)

⚠️ <b>MOMENTUM BOOST ACTIVE</b>
Watch for entries on next pocket approach
"""
        await self.send_message(text)
