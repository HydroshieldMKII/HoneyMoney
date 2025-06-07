const { ethers } = require("hardhat");
const axios = require("axios");

async function monitorEvents() {
  const contract = await ethers.getContractAt("HoneyMoney", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const provider = ethers.provider;
  
  console.log('HoneyMoney Event Monitor started...');
  console.log('Contract address:', contract.target);
  console.log('Network:', (await provider.getNetwork()).name);
  
  // Function to safely validate and extract event data
  function getEventBasics(event) {
    const basics = {
      blockNumber: null,
      transactionHash: null,
      logIndex: null,
      blockHash: null
    };
    
    // Try different ways to access event data
    if (event) {
      // Direct properties
      basics.blockNumber = event.blockNumber || event.block || null;
      basics.transactionHash = event.transactionHash || event.hash || null;
      basics.logIndex = event.logIndex || event.index || null;
      basics.blockHash = event.blockHash || null;
      
      // Check if it's wrapped in a log property
      if (event.log) {
        basics.blockNumber = basics.blockNumber || event.log.blockNumber;
        basics.transactionHash = basics.transactionHash || event.log.transactionHash;
        basics.logIndex = basics.logIndex || event.log.logIndex;
        basics.blockHash = basics.blockHash || event.log.blockHash;
      }
      
      //Check args property for some event structures
      if (event.args && event.event) {
        // Some ethers versions put metadata here
        basics.blockNumber = basics.blockNumber || event.blockNumber;
        basics.transactionHash = basics.transactionHash || event.transactionHash;
      }
    }
    
    return basics;
  }
  
  // Function to validate hex strings before using them
  function isValidHash(hash) {
    return hash && 
           typeof hash === 'string' && 
           hash !== 'null' && 
           hash !== '0x' && 
           hash.length >= 42 && // Minimum length for addresses/hashes
           /^0x[a-fA-F0-9]+$/.test(hash);
  }
  
  // Function to build event data with robust error handling
  async function buildEventData(eventName, args, event) {
    try {
      const eventBasics = getEventBasics(event);
      
      // Start with basic event data
      const baseData = {
        event: eventName,
        contractAddress: contract.target,
        blockNumber: eventBasics.blockNumber,
        transactionHash: eventBasics.transactionHash,
        logIndex: eventBasics.logIndex,
        blockHash: eventBasics.blockHash,
        timestamp: Math.floor(Date.now() / 1000),
        timestampISO: new Date().toISOString(),
        ...args
      };

      console.log(`🔍 Event basics extracted:`, {
        blockNumber: eventBasics.blockNumber,
        txHash: eventBasics.transactionHash ? `${eventBasics.transactionHash.substring(0, 10)}...` : 'null',
        logIndex: eventBasics.logIndex
      });

      // Try to get block data if we have a valid block number
      if (eventBasics.blockNumber && eventBasics.blockNumber > 0) {
        try {
          const block = await provider.getBlock(eventBasics.blockNumber);
          if (block) {
            baseData.blockHash = block.hash;
            baseData.timestamp = block.timestamp;
            baseData.timestampISO = new Date(block.timestamp * 1000).toISOString();
            baseData.miner = block.miner;
            console.log(`✅ Block data fetched for block ${eventBasics.blockNumber}`);
          }
        } catch (blockError) {
          console.log(`⚠️  Could not fetch block ${eventBasics.blockNumber}:`, blockError.message);
        }
      } else {
        console.log('⚠️  No valid block number available');
      }

      // Try to get transaction data if we have a valid transaction hash
      if (isValidHash(eventBasics.transactionHash)) {
        try {
          const transaction = await provider.getTransaction(eventBasics.transactionHash);
          if (transaction) {
            baseData.transactionFrom = transaction.from;
            baseData.transactionTo = transaction.to;
            baseData.gasPrice = transaction.gasPrice?.toString() || "0";
            baseData.gasPriceGwei = transaction.gasPrice ? ethers.formatUnits(transaction.gasPrice, 'gwei') : "0";
            baseData.transactionValue = transaction.value ? ethers.formatEther(transaction.value) : "0";
            console.log(`✅ Transaction data fetched`);
          }
        } catch (txError) {
          console.log(`⚠️  Could not fetch transaction data:`, txError.message);
          baseData.transactionFrom = "unknown";
          baseData.gasPrice = "0";
          baseData.gasPriceGwei = "0";
        }

        // Try to get transaction receipt
        try {
          const receipt = await provider.getTransactionReceipt(eventBasics.transactionHash);
          if (receipt) {
            baseData.gasUsed = receipt.gasUsed.toString();
            baseData.transactionFee = baseData.gasPrice !== "0" ? 
              ethers.formatEther(receipt.gasUsed * BigInt(baseData.gasPrice)) : "0";
            console.log(`✅ Transaction receipt fetched`);
          }
        } catch (receiptError) {
          console.log(`⚠️  Could not fetch transaction receipt:`, receiptError.message);
          baseData.gasUsed = "0";
          baseData.transactionFee = "0";
        }
      } else {
        console.log('⚠️  No valid transaction hash available:', eventBasics.transactionHash);
        baseData.transactionFrom = "unknown";
        baseData.gasPrice = "0";
        baseData.gasPriceGwei = "0";
        baseData.gasUsed = "0";
        baseData.transactionFee = "0";
      }

      // Try to get contract state
      try {
        const totalSupply = await contract.totalSupply();
        const isPaused = await contract.isPaused();
        baseData.contractPaused = isPaused;
        baseData.totalSupply = ethers.formatEther(totalSupply);
        console.log(`✅ Contract state fetched`);
      } catch (contractError) {
        console.log(`⚠️  Could not fetch contract state:`, contractError.message);
        baseData.contractPaused = false;
        baseData.totalSupply = "0";
      }

      return baseData;

    } catch (error) {
      console.error('❌ Error building event data:', error.message);
      return {
        event: eventName,
        error: error.message,
        timestamp: Math.floor(Date.now() / 1000),
        timestampISO: new Date().toISOString(),
        blockNumber: eventBasics?.blockNumber || 0,
        transactionHash: eventBasics?.transactionHash || "unknown",
        ...args
      };
    }
  }

  // Monitor Transfer Events - Handle Transfers, Mints, and Burns
  contract.on("Transfer", async (from, to, amount, event) => {
    console.log('\nTransfer event received');
    console.log('Raw event structure keys:', Object.keys(event || {}));
    
    try {
      const isMint = from === ethers.ZeroAddress;
      const isBurn = to === ethers.ZeroAddress;
      const amountFormatted = ethers.formatEther(amount);
      const isLargeAmount = parseFloat(amountFormatted) > 1000;
      
      // Get recipient balance after mint/transfer (with error handling)
      let recipientBalance = "0";
      if (!isBurn) {
        try {
          const balance = await contract.balanceOf(to);
          recipientBalance = ethers.formatEther(balance);
        } catch (e) {
          console.log('⚠️  Could not fetch recipient balance:', e.message);
        }
      }
      
      const eventData = await buildEventData(isMint ? "Mint" : isBurn ? "Burn" : "Transfer", {
        tokenFrom: from,
        tokenTo: to,
        amount: amountFormatted,
        amountRaw: amount.toString(),
        isMint: isMint,
        isBurn: isBurn,
        isLargeAmount: isLargeAmount,
        recipientBalance: recipientBalance,
        severity: isLargeAmount ? "HIGH" : isMint || isBurn ? "MEDIUM" : "LOW",
      }, event);
      
      // Different logging for different event types
      if (isMint) {
        console.log('🪙 MINT detected:', {
          to: eventData.tokenTo.substring(0, 8) + '...',
          amount: eventData.amount + ' BEE',
          newBalance: recipientBalance + ' BEE',
          block: eventData.blockNumber || 'unknown'
        });
      } else if (isBurn) {
        console.log('🔥 BURN detected:', {
          from: eventData.tokenFrom.substring(0, 8) + '...',
          amount: eventData.amount + ' BEE',
          block: eventData.blockNumber || 'unknown'
        });
      } else {
        console.log('💸 TRANSFER:', {
          from: eventData.tokenFrom.substring(0, 8) + '...',
          to: eventData.tokenTo.substring(0, 8) + '...',
          amount: eventData.amount + ' BEE',
          block: eventData.blockNumber || 'unknown'
        });
      }
      
      await triggerN8nWebhook(eventData);
      
    } catch (error) {
      console.error('Error processing Transfer/Mint/Burn event:', error.message);
      console.error('Full error:', error);
      
      // Send minimal data to n8n even if there's an error
      try {
        await triggerN8nWebhook({
          event: "TransferError",
          error: error.message,
          timestamp: Math.floor(Date.now() / 1000),
          timestampISO: new Date().toISOString(),
          severity: "ERROR"
        });
      } catch (webhookError) {
        console.error('Failed to send error event to n8n:', webhookError.message);
      }
    }
  });

  // N8N webhook trigger - single attempt only
  async function triggerN8nWebhook(eventData) {
    const webhookUrl = `http://192.168.0.178:5678/webhook/honey-money`;
    
    try {
      const response = await axios.post(webhookUrl, eventData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HoneyMoney-EventMonitor/1.1'
        }
      });
      
      console.log(`N8N webhook triggered successfully (${response.status})`);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`N8N webhook failed: Connection refused (is N8N running on 192.168.0.178:5678?)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.error(`N8N webhook failed: Timeout after 5 seconds`);
      } else {
        console.error(`N8N webhook failed:`, error.message);
      }
    }
  }

  // Enhanced error logging
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.log('Attempting graceful shutdown...');
    process.exit(1);
  });

  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    console.log('\nShutting down event monitor...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down event monitor...');
    process.exit(0);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  console.log('Monitoring Transfer, Mint, and Burn events...');
  console.log('Mints: When tokens are created (from 0x0)');
  console.log('Burns: When tokens are destroyed (to 0x0)');
  console.log('Transfers: Regular token movements');
  console.log('Press Ctrl+C to stop\n');
}

// Start monitoring
monitorEvents().catch((error) => {
  console.error('Fatal error in event monitor:', error);
  process.exit(1);
});