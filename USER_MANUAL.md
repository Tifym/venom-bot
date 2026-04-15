# 🐍 Venom Bot Pro: User Manual

Welcome to the definitive high-frequency scalping terminal. This manual provides the documentation needed to master the **Venom Strategy Engine**, configure your **Forge**, and interpret the **Confluence Logic**.

---

## 1. The Strategy Engine (Logic)

Venom uses a **Confluence-Based Scoring System**. A signal is only generated when multiple disparate data streams align.

### 📊 Scoring Components (Total Max: 100+)
*   **Orderbook Imbalance (20 pts)**: Monitors the Top 5 Bids vs. Asks on Bybit. A ratio > 2.5 (60% imbalance) triggers a score boost.
*   **Liquidation Velocity (15 pts)**: Tracks aggressive "cascades." A spike in liquidations on the opposite side of a trend provides high-gravity entry points.
*   **Mempool Gravity (10 pts)**: Monitors unconfirmed Bitcoin transactions. High network congestion often leads to "Squeeze" events.
*   **Price Action (15 pts)**: Evaluates current candle structures (e.g., Hammers, Dojis) on the 1m timeframe.
*   **Technical Indicators (40 pts)**:
    *   **Bollinger Bands**: Touching the bands on your selected timeframe.
    *   **Fibonacci Pockets**: Touching the "Alpha" (0.618) or "Omega" (0.88) zones.
    *   **Divergence**: Detecting Bullish/Bearish RSI/MACD divergence.

---

## 2. Setting Up "The Forge" (Custom Parameters)

In the **Control Deck**, you can create custom strategy profiles. This is where you become a "Super Scalper."

### 🛠️ Key Parameters to Master:
1.  **Timeframe Granularity**: You can set different timeframes for every indicator.
    *   *Example*: BB on **1m** for immediate entry + Divergence on **15m** for trend confirmation.
2.  **Fibonacci Pockets**:
    *   **Alpha Zone (0.618 - 0.65)**: The "Golden Pocket." Highest probability retracement level.
    *   **Omega Zone (0.88 - 1.0)**: The "Deep Value" zone. High risk, extreme reward.
3.  **ATR Filter**: Prevents entering trades during "CHOP" or low-volatility periods. Set to `0.5%` for safe entries or `0.1%` for aggressive scalping.

---

## 3. Using the Interactive Chart HUD

The chart is your command center. Use the **HUD (Heads-Up Display)** to toggle layers:

*   **Zap (Bollinger)**: Shows the volatility bands.
*   **Layers (Pockets)**: Real-time calculation of Fibonacci retracement zones based on recent swings.
*   **Dot (Divergence)**: Visual markers where trend exhaustion is detected.

### ⏱️ Changing Timeframes
The buttons at the bottom (**1M, 5M, 15M, 1H, 4H**) change the **visual chart**. Changing this does not affect your "Forge" settings unless you change them in the Control Deck.

---

## 4. Signal Execution & Alerts

When a signal is generated, it is sent to:
1.  **Live Feed**: Top right of the dashboard.
2.  **Chart**: Arrow markers and dashed TP/SL lines appear instantly.
3.  **Telegram**: Rich notifications with entry zone, take-profit levels, and stop-loss.

### 🚨 Signal Statuses:
*   **ACTIVE**: Signal is fresh and entry zone is valid.
*   **EXPIRED**: Price moved too far or too much time passed.
*   **WAITING FOR CONFLUENCE**: The market is being monitored, but the score is currently below your threshold.

---

## 5. Deployment & Remote Access

### Accessing via Cloudflare Tunnel
If you used the `cloudflared` command, your bot is accessible via your secure Cloudflare URL. 

**Pro Tip**: The dashboard is **fully mobile responsive**. Add the URL to your phone's home screen for a "Native App" experience.

---

> [!TIP]
> **Recommended Scalping Settings**: 
> - Mode: **HUNTER**
> - Min Score: **75**
> - BB Timeframe: **1m**
> - Divergence Timeframe: **5m**
> - Fib Timeframe: **5m**
