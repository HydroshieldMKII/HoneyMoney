const { ethers, network } = require("hardhat");

async function main() {
  await network.provider.send("evm_setAutomine", [false]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
