# 🐍 VENOM BOT — Bitcoin Scalping Signal System

> Strike when the market breathes. Precision. Speed. Lethal efficiency.

## System Requirements
- Ubuntu 22.04 LTS (or 20.04+)
- 4GB RAM minimum (8GB recommended)
- 2 CPU cores
- Stable internet (latency <100ms to Binance preferred)
- Telegram Bot Token (free via @BotFather)

## Quick Start (5 minutes)

### 1. Clone & Setup
```bash
# On your Ubuntu server
git clone https://github.com/YOUR_USERNAME/venom-bot.git
cd venom-bot

# Run automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Required variables:
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id 

# Database
REDIS_URL=redis://redis:6379/0
DATABASE_URL=postgresql://venom:password@postgres:5432/venom_bot
```

### 3. Deploy Backend
```bash
docker-compose up -d --build

# Verify health
curl http://localhost:8000/health
# Should return HTTP 200: {"status": "venom_active", "latency_ms": 12}
# NOTE: It will fail hard (503) if WebSockets are disconnected.
```

### 4. Deploy Frontend (Vercel)
```bash
cd venom-panel
npm install
vercel --prod
```
*Set environment `NEXT_PUBLIC_WS_URL=wss://your-server-ip:8000/ws`*

## Tuning Guide for Your Friend
1. Open the UI, click the `CUSTOM` preset mode.
2. Enable all zones (Alpha through Omega).
3. Lower `Min Score` to 50 and set `Min TFs` to 1.
4. Enable `Partial Confluence` and set `Direction Cooldown` to 2 min.
5. Watch for 1 hour, count signals. If there are too many false signals: raise `Min Score` by 5, or require 2 TFs. Repeat to find the sweet spot!

## Troubleshooting No Signals
- Check market volatility: Is BTC moving >0.5% in the last 4h?
- Check ATR filter: Lower to 0.1% or disable temporarily.
- Check session filter: Enable 24/7 mode.
- Check WebSocket status: Should show 🟢 in footer.
- WebSocket latency optimization: Using a server physically close to Tokyo (Binance Futures) strongly minimizes WS latency.

## Warning ⚠️
This system does NOT execute trades automatically. Do NOT risk more than 1-2% per signal.
