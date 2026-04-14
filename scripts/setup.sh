#!/bin/bash

# VENOM BOT Server Setup Script
# Strictly checks for Ubuntu version and installs necessary dependencies.

set -e

echo "🐍 Starting VENOM BOT dependencies setup..."

# 1. Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [ "$ID" != "ubuntu" ]; then
        echo "Error: This script requires Ubuntu 20.04 or 22.04 LTS."
        exit 1
    fi
    # Check version 20.04 or newer
    VERSION_MAJOR=$(echo $VERSION_ID | cut -d. -f1)
    if [ "$VERSION_MAJOR" -lt 20 ]; then
        echo "Error: Ubuntu version must be >= 20.04 LTS."
        exit 1
    fi
else
    echo "Error: OS not supported. Requires Ubuntu."
    exit 1
fi

# 2. Update and Install base requirements
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get install -y curl wget git jq software-properties-common python3.11 python3.11-venv python3.11-dev

# 3. Node.js 20 Setup
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 4. Docker & Docker Compose Setup
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Environment pre-requisites installed!"

# 5. Prompts for .env setup
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Configuring environment variables..."
    read -p "Enter TELEGRAM_BOT_TOKEN: " TELEGRAM_BOT_TOKEN
    read -p "Enter TELEGRAM_CHAT_ID: " TELEGRAM_CHAT_ID

    cp backend/.env.example backend/.env
    sed -i "s/your_token_from_botfather/$TELEGRAM_BOT_TOKEN/g" backend/.env
    sed -i "s/your_chat_id/$TELEGRAM_CHAT_ID/g" backend/.env
    echo "✅ .env configured."
fi

# 6. Build and Start
echo "🚀 Building and starting container setup..."
docker-compose up -d --build

echo "🔄 Waiting for services to initialize..."
sleep 15
curl -s http://localhost:8000/health || echo "Note: Backend healthcheck failed. It might be starting up."

echo "🐍 VENOM BOT Setup Complete! Run 'docker-compose logs -f backend' to check status."
