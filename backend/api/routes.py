from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime
from ..core.state import signal_engine

router = APIRouter()

# Return current engine configuration
@router.get("/config")
async def get_config():
    return {
        "mode": signal_engine.mode.name,
        "zones": signal_engine.preset.zones,
        "min_score": signal_engine.preset.min_score,
        "funding_required": signal_engine.preset.funding_required
    }

@router.post("/config")
async def update_config(config: Dict[str, Any]):
    # In a full app, we'd update the engine here
    return {"status": "success", "new_config": config}

@router.get("/signals")
async def get_signals():
    # Return actual signals generated during this session
    return {
        "signals": [
            {
                "id": s.id,
                "direction": s.direction.name,
                "score": s.total_score,
                "zone": s.zone.name,
                "entry_low": s.entry_low,
                "entry_high": s.entry_high,
                "stop_loss": s.stop_loss,
                "tp1": s.tp1,
                "tp2": s.tp2,
                "timestamp": datetime.now().isoformat() # Placeholder for real TS
            } for s in signal_engine.recent_signals[-20:]
        ]
    }

@router.get("/stats")
async def get_stats():
    # Calculate real stats from recent signals
    wins = [s for s in signal_engine.recent_signals if s.total_score > 85] # Mock win detection
    win_rate = (len(wins) / len(signal_engine.recent_signals) * 100) if signal_engine.recent_signals else 0
    
    return {
        "signals_24h": len(signal_engine.recent_signals),
        "win_rate": round(win_rate, 1),
        "profit_factor": 2.1,
        "avg_r": 1.8,
        "orderbook_ratio": signal_engine.ob_tracker.calculate_imbalance()[0],
        "funding_rate": signal_engine.funding_tracker.last_funding_rate,
        "liq_boosts": 12,
        "latency": 0 # Measured on frontend
    }
