import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from backend.core.websocket_manager import WebSocketManager

@pytest.mark.asyncio
async def test_websocket_circuit_breaker():
    manager = WebSocketManager(url="ws://mock:mock", name="test_ws")
    
    # Force mock connect failure
    with patch("websockets.connect", new_callable=AsyncMock) as mock_connect:
        mock_connect.side_effect = Exception("Connection Refused")
        
        # Run connect in background
        task = asyncio.create_task(manager.connect())
        await asyncio.sleep(0.1) # Let it try once
        
        manager.failure_count = 5 # Force circuit breaker state
        
        try:
            await asyncio.wait_for(task, timeout=0.2)
        except asyncio.TimeoutError:
            pass # Expected
            
        assert manager.is_connected == False
        assert manager.failure_count == 5
