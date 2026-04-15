from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime
from ..core.state import signal_engine
from ..models.enums import SignalMode

router = APIRouter()

def _get_config_dict():
    preset = signal_engine.preset
    base = {
        "mode": signal_engine.mode.name,
        "preset": {
            "min_score": preset.min_score,
            "min_tfs": preset.min_tfs,
            "zones": preset.zones,
            "cooldown_dir": preset.cooldown_dir,
            "daily_cap": preset.daily_cap,
            "atr_filter": preset.atr_filter,
        }
    }
    if preset.custom_options:
        base["preset"]["custom_options"] = {
            "name": preset.custom_options.name,
            "bbands_lower": preset.custom_options.bbands_lower,
            "bbands_upper": preset.custom_options.bbands_upper,
            "bbands_enabled": preset.custom_options.bbands_enabled,
            "timeframes": preset.custom_options.timeframes,
            "custom_fibs": preset.custom_options.custom_fibs,
        }
    return base

@router.get("/config")
async def get_config():
    return _get_config_dict()

@router.post("/config")
async def update_config(payload: Dict[str, Any]):
    if "mode" in payload:
        try:
            signal_engine.mode = SignalMode[payload["mode"].upper()]
        except Exception:
            pass

    if "preset" in payload:
        preset_data = payload["preset"]
        p = signal_engine.preset
        if "min_score" in preset_data: p.min_score = preset_data["min_score"]
        if "zones" in preset_data: p.zones = preset_data["zones"]
        if "cooldown_dir" in preset_data: p.cooldown_dir = preset_data["cooldown_dir"]
        if "daily_cap" in preset_data: p.daily_cap = preset_data["daily_cap"]
        if "atr_filter" in preset_data: p.atr_filter = preset_data["atr_filter"]

        if "custom_options" in preset_data and p.custom_options is not None:
            c = preset_data["custom_options"]
            opts = p.custom_options
            if "name" in c: opts.name = c["name"]
            if "bbands_enabled" in c: opts.bbands_enabled = c["bbands_enabled"]
            if "bbands_lower" in c: opts.bbands_lower = float(c["bbands_lower"])
            if "bbands_upper" in c: opts.bbands_upper = float(c["bbands_upper"])
            if "timeframes" in c: opts.timeframes = c["timeframes"]
            if "custom_fibs" in c: opts.custom_fibs = c["custom_fibs"]

    return {"status": "success", "new_config": _get_config_dict()}

@router.get("/signals")
async def get_signals(limit: int = 20):
    result = []
    for s in signal_engine.recent_signals[-limit:]:
        try:
            result.append({
                "id": s.id,
                "direction": s.direction.value if hasattr(s.direction, 'value') else str(s.direction),
                "score": s.total_score,
                "zone": s.zone,  # plain string now
                "entry_low": s.entry_low,
                "entry_high": s.entry_high,
                "stop_loss": s.stop_loss,
                "tp1": s.tp1,
                "tp2": s.tp2,
                "timestamp": s.timestamp.isoformat() if hasattr(s.timestamp, 'isoformat') else str(s.timestamp),
            })
        except Exception:
            continue
    return {"signals": result}

@router.get("/stats")
async def get_stats():
    try:
        total = len(signal_engine.recent_signals)
        wins = [s for s in signal_engine.recent_signals if s.total_score >= signal_engine.preset.min_score + 10]
        win_rate = (len(wins) / total * 100) if total > 0 else 0.0

        zone_counts: Dict[str, int] = {}
        for s in signal_engine.recent_signals:
            z = s.zone  # plain string
            zone_counts[z] = zone_counts.get(z, 0) + 1
        best_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "NONE"

        ob_ratio = 0.0
        try:
            ob_ratio = signal_engine.ob_tracker.calculate_imbalance()[0]
        except Exception:
            pass

        funding_rate = 0.0
        try:
            funding_rate = signal_engine.funding_tracker.current_funding_rate
        except Exception:
            pass

        return {
            "signals_24h": total,
            "win_rate": round(win_rate, 1),
            "profit_factor": 0.0,
            "avg_r": 0.0,
            "best_zone": best_zone,
            "best_tf": "1M",
            "liq_boosts": sum(
                1 for s in signal_engine.recent_signals
                if getattr(getattr(s, 'confluence', None), 'liquidation_boost', 0) > 0
            ),
            "orderbook_ratio": ob_ratio,
            "funding_rate": funding_rate,
            "latency": 0,
        }
    except Exception as e:
        return {
            "signals_24h": 0,
            "win_rate": 0.0,
            "profit_factor": 0.0,
            "avg_r": 0.0,
            "best_zone": "NONE",
            "best_tf": "1M",
            "liq_boosts": 0,
            "orderbook_ratio": 0.0,
            "funding_rate": 0.0,
            "latency": 0,
        }
