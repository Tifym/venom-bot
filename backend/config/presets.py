from pydantic import BaseModel, Field
from typing import List

class PresetMode(BaseModel):
    min_score: int
    min_tfs: int
    zones: List[str]
    cooldown_dir: int # minutes
    cooldown_zone: int # minutes
    partial_confluence: bool = False
    funding_required: bool = False

PRESETS = {
    "SILENT": PresetMode(
        min_score=90,
        min_tfs=3,
        zones=['alpha'],
        cooldown_dir=10,
        cooldown_zone=20,
        partial_confluence=False,
        funding_required=True
    ),
    "HUNTER": PresetMode(
        min_score=75,
        min_tfs=2,
        zones=['alpha', 'beta'],
        cooldown_dir=5,
        cooldown_zone=10,
        partial_confluence=False,
        funding_required=True
    ),
    "PREDATOR": PresetMode(
        min_score=60,
        min_tfs=1,
        zones=['alpha', 'beta', 'gamma'],
        cooldown_dir=3,
        cooldown_zone=5,
        partial_confluence=True,
        funding_required=False
    ),
    "RAMPAGE": PresetMode(
        min_score=45,
        min_tfs=1,
        zones=['alpha', 'beta', 'gamma', 'delta', 'omega'],
        cooldown_dir=2,
        cooldown_zone=3,
        partial_confluence=True,
        funding_required=False
    )
}

def get_preset(mode: str) -> PresetMode:
    return PRESETS.get(mode.upper(), PRESETS["HUNTER"])
