import pytest
from unittest.mock import AsyncMock, patch
from backend.core.telegram_bot import TelegramBot
from backend.models.signal import VenomSignal, ConfluenceMetrics
from backend.models.enums import SignalDirection, SignalMode, VenomZone, DivergenceType
import uuid

@pytest.mark.asyncio
async def test_telegram_signal_formatting():
    bot = TelegramBot()
    bot.token = "fake"
    bot.chat_id = "fake"
    
    confluence = ConfluenceMetrics(
        divergence_type=DivergenceType.REGULAR_BULLISH,
        divergence_score=30,
        orderbook_ratio=2.1,
        orderbook_score=25,
        funding_rate=-0.012,
        funding_score=15,
        liquidation_boost=10
    )
    
    sig = VenomSignal(
        id=str(uuid.uuid4()),
        direction=SignalDirection.LONG,
        mode=SignalMode.PREDATOR,
        zone=VenomZone.ALPHA,
        total_score=80,
        confluence=confluence,
        entry_low=64000,
        entry_high=64100,
        stop_loss=63800,
        tp1=64500,
        tp2=65000
    )
    
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        await bot.send_signal(sig)
        assert mock_post.called
        
        args, kwargs = mock_post.call_args
        payload = kwargs['json']
        
        assert "VENOM STRIKE — LONG" in payload['text']
        assert "<b>Confidence: 80/100</b>" in payload['text']
        assert "<b>ALPHA POCKET</b> 🟢" in payload['text']
