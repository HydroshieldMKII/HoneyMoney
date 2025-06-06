const { ethers } = require("hardhat");
const axios = require("axios");

async function monitorEvents() {
  const contract = await ethers.getContractAt("HoneyMoney", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  
  console.log('Event Monitor started - listening for HoneyMoney contract events...');
  console.log('Contract address:', contract.target);
  
  // Listen for Transfer events
  contract.on("Transfer", async (from, to, amount, event) => {
    const eventData = {
      event: "Transfer",
      from: from,
      to: to,
      amount: ethers.formatEther(amount)
    };
    
    console.log('Transfer event detected:', eventData);
    
    // Trigger n8n workflow
    try {
      await axios.post('http://192.168.0.178:5678/webhook-test/token-transfer', eventData);
      console.log('Successfully triggered n8n workflow for transfer event');
    } catch (error) {
      console.error('Failed to trigger n8n workflow for transfer event:', error.message);
    }
  });
  
  // Listen for blacklist events
  contract.on("Blacklisted", async (account, enabled, event) => {
    const eventData = {
      event: "Blacklisted",
      account: account,
      enabled: enabled
    };
    
    console.log('Blacklisted event detected:', eventData);
    
    // Trigger n8n workflow
    try {
      await axios.post('http://192.168.0.178:5678/webhook-test/blacklist-update', eventData);
      console.log('Successfully triggered n8n workflow for blacklist event');
    } catch (error) {
      console.error('Failed to trigger n8n workflow for blacklist event:', error.message);
    }
  });
}

monitorEvents().catch(console.error);
