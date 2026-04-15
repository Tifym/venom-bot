from pydantic import BaseModel
from typing import List, Dict, Optional

class CustomOptions(BaseModel):
    name: str = "BLASTER_V1"
    
    # Technical Matrix (Multi-TF Support)
    tfs_divergence: List[str] = ["1m", "5m"]
    tfs_bollinger: List[str] = ["1m"]
    tfs_fib: List[str] = ["15m"]
    
    # Technical Parameters
    bbands_deviation: float = 2.0
    custom_fibs: Dict[str, List[float]] = {}
    
    # Raw Data Matrix
    ob_ratio_min: float = 2.5
    liq_burst_usd: float = 50000.0
    oi_spike_pct: float = 1.2
    mempool_fee_min: int = 5
    
    # Visuals
    tf_chart: str = "1m"

class PresetMode(BaseModel):
    min_score: int
    min_tfs: int
    zones: List[str]
    cooldown_dir: int
    daily_cap: int = 200
    atr_filter: float = 0.0
    custom_options: Optional[CustomOptions] = None

PRESETS = {
    "SILENT": PresetMode(
        min_score=90,
        min_tfs=3,
        zones=["alpha", "omega"],
        cooldown_dir=30,
        atr_filter=0.5
    ),
    "HUNTER": PresetMode(
        min_score=75,
        min_tfs=2,
        zones=["alpha", "beta", "gamma"],
        cooldown_dir=10,
        atr_filter=0.2
    ),
    "PREDATOR": PresetMode(
        min_score=60,
        min_tfs=1,
        zones=["alpha", "beta", "gamma", "delta", "omega"],
        cooldown_dir=5,
        atr_filter=0.1
    ),
    "RAMPAGE": PresetMode(
        min_score=40,
        min_tfs=1,
        zones=["alpha", "beta", "gamma", "delta", "omega"],
        cooldown_dir=0,
        daily_cap=500,
        atr_filter=0.05
    ),
    "CUSTOM": PresetMode(
        min_score=50,
        min_tfs=1,
        zones=["alpha", "beta", "gamma", "delta", "omega"],
        cooldown_dir=0,
        custom_options=CustomOptions()
    )
}

def get_preset(mode: str) -> PresetMode:
    return PRESETS.get(mode.upper(), PRESETS["HUNTER"])
