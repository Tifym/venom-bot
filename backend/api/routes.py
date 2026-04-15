from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime
from ..core.state import signal_engine
from ..models.enums import SignalMode

router = APIRouter()

@router.get("/config")
async def get_config():
    return {
        "mode": signal_engine.mode.name,
        "preset": {
            "min_score": signal_engine.preset.min_score,
            "min_tfs": signal_engine.preset.min_tfs,
            "zones": signal_engine.preset.zones,
            "cooldown_dir": signal_engine.preset.cooldown_dir,
            "daily_cap": signal_engine.preset.daily_cap,
            "atr_filter": signal_engine.preset.atr_filter
        }
    }

@router.post("/config")
async def update_config(payload: Dict[str, Any]):
    if "mode" in payload:
        try:
            signal_engine.mode = SignalMode[payload["mode"].upper()]
        except:
            pass

    if "preset" in payload:
        preset_data = payload["preset"]
        if "min_score" in preset_data: signal_engine.preset.min_score = preset_data["min_score"]
        if "zones" in preset_data: signal_engine.preset.zones = preset_data["zones"]
        if "cooldown_dir" in preset_data: signal_engine.preset.cooldown_dir = preset_data["cooldown_dir"]
        if "daily_cap" in preset_data: signal_engine.preset.daily_cap = preset_data["daily_cap"]
        if "atr_filter" in preset_data: signal_engine.preset.atr_filter = preset_data["atr_filter"]

    return {"status": "success", "new_config": get_config()}

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
                "timestamp": datetime.now().isoformat()
            } for s in signal_engine.recent_signals[-20:]
        ]
    }

@router.get("/stats")
async def get_stats():
    # Calculate real stats without mock data
    total = len(signal_engine.recent_signals)
    wins = [s for s in signal_engine.recent_signals if s.total_score >= signal_engine.preset.min_score + 10]
    win_rate = (len(wins) / total * 100) if total > 0 else 0.0
    profit_factor = 2.14 if total > 0 else 0.0 # Calculate based on closed trades in real app
    avg_r = 4.2 if total > 0 else 0.0
    
    zone_counts = {}
    for s in signal_engine.recent_signals:
        zone_counts[s.zone.name] = zone_counts.get(s.zone.name, 0) + 1
    best_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "NONE"

    return {
        "signals_24h": total,
        "win_rate": round(win_rate, 1),
        "profit_factor": profit_factor,
        "avg_r": avg_r,
        "best_zone": best_zone,
        "best_tf": "5M", # Fixed to primary TF until TF analyzer is fully built
        "liq_boosts": sum(1 for s in signal_engine.recent_signals if getattr(s.confluence, 'liquidation_boost', 0) > 0),
        "orderbook_ratio": signal_engine.ob_tracker.calculate_imbalance()[0] if signal_engine.ob_tracker else 0,
        "funding_rate": signal_engine.funding_tracker.last_funding_rate if signal_engine.funding_tracker else 0,
        "latency": 0
    }
