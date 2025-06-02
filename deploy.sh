#!/bin/bash
set -e

cd /root/veille-technologique-420-1SH-SW/HoneyMoney

echo "Stopping node process..."
systemctl stop hardhat-node

echo "Compiling contracts..."
npx hardhat compile

echo "Starting Hardhat node..."
systemctl start hardhat-node
sleep 5  # Wait for the node to start

echo "Deploying contracts..."
npx hardhat ignition deploy ./ignition/modules/honeymoney.ts --network localhost
npx hardhat run ./ignition/modules/honeymoney.ts --network localhost

echo "Deployment completed."
