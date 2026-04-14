from enum import Enum

class SignalDirection(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"

class VenomZone(str, Enum):
    ALPHA = "ALPHA"
    BETA = "BETA"
    GAMMA = "GAMMA"
    DELTA = "DELTA"
    OMEGA = "OMEGA"

class SignalMode(str, Enum):
    SILENT = "SILENT"
    HUNTER = "HUNTER"
    PREDATOR = "PREDATOR"
    RAMPAGE = "RAMPAGE"
    CUSTOM = "CUSTOM"

class DivergenceType(str, Enum):
    REGULAR_BULLISH = "REGULAR_BULLISH"
    REGULAR_BEARISH = "REGULAR_BEARISH"
    HIDDEN_BULLISH = "HIDDEN_BULLISH"
    HIDDEN_BEARISH = "HIDDEN_BEARISH"
    NONE = "NONE"
