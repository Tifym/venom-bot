import pytest
import math
from datetime import datetime, timedelta
from backend.models.market_data import Candle
from backend.core.fibonacci import FibonacciPocket
from backend.models.enums import VenomZone

def create_candle(close: float, ts_offset_min: int) -> Candle:
    return Candle(
        open=close * 0.99,
        high=close * 1.01,
        low=close * 0.99,
        close=close,
        volume=100.0,
        timestamp=datetime.utcnow() + timedelta(minutes=ts_offset_min),
        timeframe='1m'
    )

def test_zigzag_detection():
    detector = FibonacciPocket(deviation=0.01) # 1%
    
    # Create an uptrend then downtrend
    prices = [1000, 1010, 1020, 1005, 990, 1005]
    candles = [create_candle(p, i) for i, p in enumerate(prices)]
    
    swings = detector.calculate_zig_zag(candles)
    # Should identify the High at 1020 and Low at 990
    assert len(swings) >= 1
    assert swings[-2][0] == pytest.approx(1020 * 1.01) # Highs use c.high
    assert swings[-1][0] == pytest.approx(990 * 0.99) # Lows use c.low

def test_pockets_calculation():
    detector = FibonacciPocket()
    # Mocking swings: Low to High
    swings = [(10000.0, 0, 'LOW'), (20000.0, 1, 'HIGH')]
    pockets = detector.calculate_pockets(swings)
    
    # Total move = 10,000. Alpha pocket is 61.8% to 65% retracement
    # Retracement from 20000 downwards
    
    alpha_lower = 20000.0 - (10000.0 * 0.65)
    alpha_upper = 20000.0 - (10000.0 * 0.618)
    
    assert VenomZone.ALPHA in pockets
    assert pockets[VenomZone.ALPHA][0] == pytest.approx(alpha_lower)
    assert pockets[VenomZone.ALPHA][1] == pytest.approx(alpha_upper)

def test_check_zone_touch():
    detector = FibonacciPocket()
    swings = [(10000.0, 0, 'LOW'), (20000.0, 1, 'HIGH')]
    detector.calculate_pockets(swings)
    
    # Alpha = 13500 to 13820
    assert detector.check_zone_touch(13600) == VenomZone.ALPHA
    assert detector.check_zone_touch(13820) == VenomZone.ALPHA
    assert detector.check_zone_touch(14000) != VenomZone.ALPHA
