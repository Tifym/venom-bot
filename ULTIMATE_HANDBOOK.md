# 🧪 Venom "Atomic" Terminal: The Masterclass

This handbook is designed as a series of **Pro-Trading Slides**. Master these five pillars to dominate the high-frequency scalping markets.

---

## Slide 1: The Multi-Timeframe "Confluence Matrix"

### 🧩 What is it?
Instead of simple indicators, the **Atomic Matrix** cross-references market conditions across multiple layers of time simultaneously.

### 📐 How to Set It Up:
1.  **Select Layer Strings**: In the Control Deck, select a "Matrix String" (e.g., `1m + 5m + 15m`).
2.  **The Rule**: Signals only fire if the condition (Divergence, Bollinger Touch, or Fib Pocket) is confirmed on **ALL** selected layers.
3.  **The Result**: Near-zero noise. You only enter when multiple "mountains" align.

---

## Slide 2: Reading the "Div Mountains" & Fib Pockets

### 🏔️ Divergence Mountains (Visual HUD)
*   **Green Dot**: Bullish Divergence detected on the chart timeframe.
*   **Text Label `DIV [5m]`**: Shows you exactly which layer in your matrix triggered.
*   **Mountain Peak**: When multiple labels appear at once, you have "Atomic Confluence."

### 🎯 Fibonacci Pockets 2.0
*   **Golden Pocket (0.618)**: Your primary entry zone.
*   **Omega Pocket (0.88+)**: The "Exhaustion Zone" for extreme reversals.
*   **Pro Tip**: Use a **15m Fib Matrix** for long-term targets while using a **1m Matrix** for entries.

---

## Slide 3: Mastering Raw Market Data

### 🧱 Orderbook Wall Ratio
*   **Threshold (e.g., 2.5)**: The bot calculates the weight of Bids vs. Asks.
*   **Action**: If the wall is < 2.5, the signal is rejected even if the chart looks perfect. This protects you from "fake-outs."

### 🌋 Liquidation Burst ($)
*   **Filter (e.g., $50,000)**: Detects when large players are forced to exit.
*   **Action**: Only entries with significant "Cascading Gravity" (large liquidations) are accepted in Hunter/Predator modes.

---

## Slide 4: Using Drawing Persistence

### ✍️ Tools of the Trade
*   **Layers Icon (Left Toolbar)**: Click to enter "Horizontal Line" mode.
*   **Interaction**: Click anywhere on the chart to drop a Support/Resistance level.

### 💾 Unified Persistence
*   **Cross-Device Sync**: Any line you draw on your PC dashboard is automatically synced to your Phone and Tablet via the Postgres database.
*   **Strategy**: Map out 1D resistance zones on your PC in the morning, then track entries on your phone throughout the day.

---

## Slide 5: The "Perfect Entry" Checklist

1.  **Check Confluence Matrix**: Ensure your matrix string isn't too restrictive (start with `1m + 5m`).
2.  **Verify OB Walls**: Ensure the Orderbook ratio is > 2.0.
3.  **Watch the HUD**: Look for the "Golden Pocket" lines to darken—this means price is entering a high-probability zone.
4.  **Trust the Score**: A score > 85 is an "Atomic High-Conviction" event.

---

*“Venom isn't just a bot; it's a precision instrument. Tune your matrix, trust the confluence.”*
