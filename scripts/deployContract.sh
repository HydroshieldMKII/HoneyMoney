#!/bin/bash
set -e

cd /root/veille-technologique-420-1SH-SW/HoneyMoney

echo "Restarting Hardhat node..."
systemctl restart hardhat-node
sleep 3

echo "Compiling contracts..."
npx hardhat compile

echo "Disabling automine for deployement..."
npx hardhat run ./scripts/disableAutomine.js

echo "Deploying contracts..."
npx hardhat ignition deploy ./ignition/modules/honeymoney.ts --network localhost
npx hardhat run ./ignition/modules/honeymoney.ts --network localhost

echo "Enabling automine back..."
npx hardhat run ./scripts/enableAutomine.js

echo "Enabling event monitoring..."
node ./scripts/eventMonitor.js

echo "Deployment completed. Enjoy!"
