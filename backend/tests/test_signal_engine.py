import pytest
from unittest.mock import MagicMock
from backend.core.signal_engine import SignalEngine
from backend.models.enums import DivergenceType, VenomZone

def test_signal_engine_scoring():
    engine = SignalEngine(mode="PREDATOR")
    
    # Mock internal components to test aggregation math constraint (110 max)
    engine.fib_tracker.check_zone_touch = MagicMock(return_value=VenomZone.ALPHA)
    engine.div_detector.detect_divergence = MagicMock(return_value=(DivergenceType.REGULAR_BULLISH, 30))
    engine.ob_tracker.get_score = MagicMock(return_value=(25, "LONG"))
    engine.ob_tracker.calculate_imbalance = MagicMock(return_value=(2.1, 0.0))
    engine.funding_tracker.evaluate_signal_alignment = MagicMock(return_value=(15, -0.012))
    engine.liq_monitor.get_boost = MagicMock(return_value=10)
    
    mock_candles = {'1m': [MagicMock() for _ in range(50)]}
    
    signal = engine.evaluate(64000.0, mock_candles)
    
    assert signal is not None
    assert signal.total_score == 30 + 25 + 15 + 10 # 80 total
    assert signal.confluence.divergence_score == 30
    assert signal.confluence.orderbook_score == 25
    assert signal.confluence.funding_score == 15
    assert signal.confluence.liquidation_boost == 10
