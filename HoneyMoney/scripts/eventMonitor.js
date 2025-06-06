const { ethers } = require("hardhat");
const axios = require("axios");

//node scripts/eventMonitor.js

async function monitorEvents() {
  const contract = await ethers.getContractAt("HoneyMoney", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  
  // Listen for Transfer events
  contract.on("Transfer", async (from, to, amount, event) => {
    const eventData = {
      event: "Transfer",
      from: from,
      to: to,
      amount: amount.toString(),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    };
    
    // Trigger n8n workflow
    try {
      await axios.post('http://192.168.0.178:5678/webhook/token-transfer', eventData);
    } catch (error) {
      console.error('Failed to trigger n8n workflow:', error);
    }
  });
  
  // Listen for blacklist events
  contract.on("Blacklisted", async (account, enabled, event) => {
    const eventData = {
      event: "Blacklisted",
      account: account,
      enabled: enabled,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    };
    
    await axios.post('http://192.168.0.178:5678/webhook/blacklist-update', eventData);
  });
}

monitorEvents().catch(console.error);