from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..database.postgres_client import postgres_client

router = APIRouter()

# Dependency missing, simplified for MVP config state, we use global or db eventually
# For now just stubbing the REST api for Next.js

@router.get("/config")
async def get_config():
    # Return mock config aligning with Venom requirements
    return {
        "mode": "HUNTER",
        "zones": ["ALPHA", "BETA"],
        "min_score": 75,
        "cooldown_dir": 5
    }

@router.post("/config")
async def update_config(config: Dict[str, Any]):
    return {"status": "success", "new_config": config}

@router.get("/signals")
async def get_signals():
    # Fetch from Postgres theoretically
    if not postgres_client.engine:
         raise HTTPException(status_code=503, detail="DB disconnected")
    # Return mock response to allow UI building
    return {"signals": []}

@router.get("/stats")
async def get_stats():
    return {
        "signals_24h": 34,
        "win_rate": 67.5,
        "profit_factor": 2.1,
        "avg_r": 1.8,
        "best_zone": "ALPHA",
        "best_tf": "5m",
        "liq_boosts": 12,
        "latency": 312
    }
