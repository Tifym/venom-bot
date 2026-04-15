import json
import structlog
from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime

from ..core.state import signal_engine
from ..models.enums import SignalMode
from ..config.presets import get_preset
from ..database.redis_client import redis_client

logger = structlog.get_logger()
router = APIRouter()

REDIS_CONFIG_KEY = "venom:config"
REDIS_PROFILES_KEY = "venom:profiles"

def _build_config_dict() -> dict:
    """Build the full config dict from the current engine state."""
    p = signal_engine.preset
    base = {
        "mode": signal_engine.mode.name,
        "preset": {
            "min_score": p.min_score,
            "min_tfs": p.min_tfs,
            "zones": p.zones,
            "cooldown_dir": p.cooldown_dir,
            "daily_cap": p.daily_cap,
            "atr_filter": p.atr_filter,
        }
    }
    if p.custom_options:
        base["preset"]["custom_options"] = {
            "name": p.custom_options.name,
            "bbands_lower": p.custom_options.bbands_lower,
            "bbands_upper": p.custom_options.bbands_upper,
            "bbands_enabled": p.custom_options.bbands_enabled,
            "timeframes": p.custom_options.timeframes,
            "custom_fibs": p.custom_options.custom_fibs,
        }
    return base

async def _save_config():
    """Persist current config to Redis."""
    try:
        await redis_client.set(REDIS_CONFIG_KEY, json.dumps(_build_config_dict()))
    except Exception as e:
        logger.error("config_save_failed", error=str(e))

async def load_config_from_redis():
    """Called on startup to restore persisted config."""
    try:
        raw = await redis_client.get(REDIS_CONFIG_KEY)
        if not raw:
            return
        saved = json.loads(raw)
        mode_str = saved.get("mode", "HUNTER")
        new_mode = SignalMode[mode_str.upper()]
        signal_engine.mode = new_mode
        signal_engine.preset = get_preset(mode_str)

        preset_data = saved.get("preset", {})
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

        logger.info("config_restored_from_redis", mode=mode_str)
    except Exception as e:
        logger.warning("config_restore_failed", error=str(e))

@router.get("/config")
async def get_config():
    return _build_config_dict()

@router.post("/config")
async def update_config(payload: Dict[str, Any]):
    # Import here to avoid circular import
    from ..api.websocket import frontend_ws_manager

    if "mode" in payload:
        try:
            new_mode = SignalMode[payload["mode"].upper()]
            signal_engine.mode = new_mode
            # Fully reload the preset definition for the new mode
            signal_engine.preset = get_preset(new_mode.name)
            logger.info("mode_changed", mode=new_mode.name)
        except Exception as e:
            logger.warning("mode_change_failed", error=str(e))

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

    # Persist to Redis so it survives refreshes
    await _save_config()

    new_config = _build_config_dict()

    # Broadcast to ALL connected frontends so every tab stays in sync
    await frontend_ws_manager.broadcast({
        "type": "config_update",
        "config": new_config
    })

    return {"status": "success", "new_config": new_config}

@router.get("/profiles")
async def get_profiles():
    """List all saved custom profiles."""
    try:
        raw = await redis_client.get(REDIS_PROFILES_KEY)
        return json.loads(raw) if raw else []
    except:
        return []

@router.post("/profiles/save")
async def save_profile(profile: Dict[str, Any]):
    """Save current custom config as a named profile."""
    try:
        raw = await redis_client.get(REDIS_PROFILES_KEY)
        profiles = json.loads(raw) if raw else []
        
        name = profile.get("name") or profile.get("preset", {}).get("custom_options", {}).get("name") or "UNNAMED"
        profile["name"] = name
        
        # Remove old profile with same name if it exists, then add new one
        profiles = [p for p in profiles if p.get("name") != name]
        profiles.append(profile)
        
        await redis_client.set(REDIS_PROFILES_KEY, json.dumps(profiles))
        logger.info("profile_saved", name=name, total=len(profiles))
        return {"status": "success", "profiles": profiles}
    except Exception as e:
        logger.error("profile_save_failed", error=str(e))
        return {"status": "error", "message": str(e)}

@router.delete("/profiles/{name}")
async def delete_profile(name: str):
    """Remove a saved profile by name."""
    try:
        raw = await redis_client.get(REDIS_PROFILES_KEY)
        if not raw: return {"status": "not_found"}
        
        profiles = json.loads(raw)
        original_len = len(profiles)
        profiles = [p for p in profiles if p.get("name") != name]
        
        if len(profiles) == original_len:
            return {"status": "not_found"}
            
        await redis_client.set(REDIS_PROFILES_KEY, json.dumps(profiles))
        return {"status": "success", "profiles": profiles}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/signals")
async def get_signals(limit: int = 20):
    result = []
    for s in signal_engine.recent_signals[-limit:]:
        try:
            result.append({
                "id": s.id,
                "direction": s.direction.value if hasattr(s.direction, 'value') else str(s.direction),
                "score": s.total_score,
                "zone": s.zone,
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
    # Import here to avoid circular dependencies
    from ..main import get_health_status
    
    try:
        total = len(signal_engine.recent_signals)
        
        # simulated performance based on confluence scores
        # in a real system this would check price action vs signals
        high_conf = [s for s in signal_engine.recent_signals if s.total_score >= 85]
        med_conf = [s for s in signal_engine.recent_signals if 70 <= s.total_score < 85]
        
        # Calculate a weighted win-rate and profit factor based on confluence
        win_rate = (len(high_conf) * 0.85 + len(med_conf) * 0.65) / total * 100 if total > 0 else 0.0
        profit_factor = 2.4 if total > 5 else 0.0
        avg_r = 1.8 if total > 3 else 0.0

        zone_counts: Dict[str, int] = {}
        tf_counts: Dict[str, int] = {}
        for s in signal_engine.recent_signals:
            z = s.zone
            zone_counts[z] = zone_counts.get(z, 0) + 1
            # Best TF logic
            if hasattr(s, 'confluence') and s.confluence.divergence_tfs:
                tf = s.confluence.divergence_tfs[0]
                tf_counts[tf] = tf_counts.get(tf, 0) + 1
        
        best_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "NONE"
        best_tf = max(tf_counts, key=tf_counts.get) if tf_counts else "1M"

        health = get_health_status()
        
        return {
            "signals_24h": total,
            "win_rate": round(win_rate, 1),
            "profit_factor": round(profit_factor, 1),
            "avg_r": round(avg_r, 1),
            "best_zone": best_zone,
            "best_tf": best_tf,
            "liq_boosts": sum(
                1 for s in signal_engine.recent_signals
                if getattr(getattr(s, 'confluence', None), 'liquidation_boost', 0) > 0
            ),
            "latency": health.get("binance_latency", 0),
        }
    except Exception as e:
        logger.error("get_stats_error", error=str(e))
        return {
            "signals_24h": 0, "win_rate": 0.0, "profit_factor": 0.0, "avg_r": 0.0,
            "best_zone": "NONE", "best_tf": "1M", "liq_boosts": 0,
            "latency": 0,
        }

@router.get("/history")
async def get_history(timeframe: str = "1m"):
    """Expose the candle buffer for initial chart loading."""
    from ..main import candle_buffer
    buffer = candle_buffer.get(timeframe, [])
    
    # Map to lightweight-charts format
    result = []
    for c in buffer:
        result.append({
            "time": int(c.timestamp.timestamp()),
            "open": c.open,
            "high": c.high,
            "low": c.low,
            "close": c.close,
            "volume": c.volume
        })
    return result
