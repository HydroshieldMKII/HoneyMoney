#!/bin/bash
set -e

cd /root/veille-technologique-420-1SH-SW/HoneyMoney

echo "Compiling contracts..."
npx hardhat compile

echo "Deploying contracts..."
npx hardhat ignition deploy ./ignition/modules/honeymoney.ts --network localhost
npx hardhat run ./ignition/modules/honeymoney.ts --network localhost

echo "Deployment completed."
