#!/bin/bash

# Load NVM and set up environment
export HOME=/root
export NVM_DIR="$HOME/.nvm"

# Source NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Ensure we're using the right node version
nvm use v22.16.0

# Change to project directory
cd /root/veille-technologique-420-1SH-SW/HoneyMoney

# Log startup info
echo "$(date): Starting HoneyMoney Event Monitor"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"

# Wait a moment for network
sleep 5

# Check if hardhat node is accessible
echo "Checking Hardhat node connection..."
if ! curl -s -f -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to Hardhat node at localhost:8545"
    echo "Make sure Hardhat node is running with:"
    echo "  npx hardhat node --hostname 0.0.0.0 --port 8545"
    exit 1
fi

echo "Hardhat node is accessible. Starting event monitor..."

# Start the event monitor
exec npx hardhat run scripts/eventMonitor.js --network localhost
