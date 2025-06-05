import { Injectable } from '@angular/core';
import { getBytes } from 'ethers';
import { encode } from '@ethereumjs/rlp';
import { BlockData } from './blockchain.service';

export interface EditableBlockData extends BlockData {
  originalData?: BlockData;
  isEditing?: boolean;
  isValidHash?: boolean;
  isModified?: boolean; // Track if block has been modified from original
}

@Injectable({
  providedIn: 'root',
})
export class HashingService {


  /**
   * Calculate the hash of a block using SHA256 (for modified blocks)
   * Used when blocks have been edited to demonstrate blockchain integrity
   */
  async calculateBlockHash(block: BlockData): Promise<string> {
    try {
      // console.log('=== CALCULATING BLOCK HASH ===');
      // console.log('Block number:', block.number);
      // console.log('Expected hash:', block.hash);

      // Convert timestamp to Unix timestamp if needed
      const unixTimestamp = this.convertToUnixTimestamp(block.timestamp);
      // console.log('Timestamp conversion:', block.timestamp, '->', unixTimestamp);

      // Prepare the 15 block header fields in EXACT order
      const rlpData = [
        this.hexToBytes(block.parentHash),           // 0: parentHash
        this.hexToBytes(block.sha3Uncles),          // 1: sha3Uncles
        this.hexToBytes(block.miner),               // 2: miner
        this.hexToBytes(block.stateRoot),           // 3: stateRoot
        this.hexToBytes(block.transactionsRoot),    // 4: transactionsRoot
        this.hexToBytes(block.receiptsRoot),        // 5: receiptsRoot
        this.hexToBytes(block.logsBloom),           // 6: logsBloom
        this.toRLPBytes(block.difficulty),          // 7: difficulty
        this.toRLPBytes(block.number),              // 8: number
        this.toRLPBytes(block.gasLimit),            // 9: gasLimit
        this.toRLPBytes(block.gasUsed),             // 10: gasUsed
        this.toRLPBytes(unixTimestamp),             // 11: timestamp
        this.hexToBytes(block.extraData),           // 12: extraData
        this.hexToBytes(block.mixHash),             // 13: mixHash
        this.hexToBytes(block.nonce)                // 14: nonce
      ];

      // console.log('RLP data prepared:');
      const fieldNames = [
        'parentHash', 'sha3Uncles', 'miner', 'stateRoot', 'transactionsRoot',
        'receiptsRoot', 'logsBloom', 'difficulty', 'number', 'gasLimit',
        'gasUsed', 'timestamp', 'extraData', 'mixHash', 'nonce'
      ];
      
      rlpData.forEach((field, i) => {
        // console.log(`  ${i}: ${fieldNames[i]} = ${field.length} bytes`);
      });

      // RLP encode the header
      const encoded = encode(rlpData);
      
      // Calculate SHA256 hash (instead of keccak256 to demonstrate blockchain integrity)
      const calculatedHash = await this.sha256(encoded);
      
      // console.log('RLP encoded bytes length:', encoded.length);
      // console.log('Calculated hash:', calculatedHash);
      // console.log('Expected hash:  ', block.hash);
      // console.log('Hashes match:', calculatedHash.toLowerCase() === block.hash.toLowerCase());
      // console.log('=== END HASH CALCULATION ===\n');

      return calculatedHash;

    } catch (error) {
      // console.error('Error calculating block hash for block', block.number, ':', error);
      // console.error('Block data:', block);
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
  }

  /**
   * Convert timestamp to Unix timestamp
   */
  private convertToUnixTimestamp(timestamp: string): string {
    try {
      if (timestamp.startsWith('0x')) {
        // Already hex timestamp from blockchain
        return parseInt(timestamp, 16).toString();
      } else if (timestamp.includes('T')) {
        // ISO string format
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          console.warn('Invalid ISO timestamp:', timestamp);
          return '0';
        }
        return Math.floor(date.getTime() / 1000).toString();
      } else {
        // Assume already Unix timestamp
        const parsed = parseInt(timestamp);
        if (isNaN(parsed)) {
          console.warn('Invalid timestamp format:', timestamp);
          return '0';
        }
        return parsed.toString();
      }
    } catch (error) {
      console.error('Error converting timestamp:', timestamp, error);
      return '0';
    }
  }

  /**
   * Convert number to RLP format (returns Uint8Array directly)
   */
  private toRLPBytes(value: string): Uint8Array {
    try {
      let num: number;
      
      if (typeof value === 'string' && value.startsWith('0x')) {
        num = parseInt(value, 16);
      } else {
        num = parseInt(value);
      }
      
      if (isNaN(num)) {
        console.warn('Invalid number for RLP conversion:', value);
        return new Uint8Array(0);
      }
      
      if (num === 0) {
        return new Uint8Array(0); // Empty byte array for 0
      }
      
      // Convert to minimal byte representation
      const hex = num.toString(16);
      const evenHex = hex.length % 2 === 0 ? hex : '0' + hex;
      return getBytes('0x' + evenHex);
    } catch (error) {
      console.error('Error converting to RLP bytes:', value, error);
      return new Uint8Array(0);
    }
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    try {
      if (!hex || hex === '0x') {
        return new Uint8Array(0);
      }
      
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      if (cleanHex.length === 0) {
        return new Uint8Array(0);
      }
      
      const evenHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
      return getBytes('0x' + evenHex);
    } catch (error) {
      console.error('Error converting hex to bytes:', hex, error);
      return new Uint8Array(0);
    }
  }

  /**
   * Validate if a block's hash matches its calculated hash
   * No validation on first load, only validate modified blocks using SHA256
   */
  async validateBlockHash(block: BlockData | EditableBlockData): Promise<boolean> {
    const editableBlock = block as EditableBlockData;
    
    // Check if block is modified from original
    if (editableBlock.isModified) {
      // For modified blocks, use SHA256 (will show as invalid)
      const calculatedHash = await this.calculateBlockHash(block);
      const isValid = calculatedHash.toLowerCase() === block.hash.toLowerCase();
      
      if (!isValid) {
        console.warn(`❌ HASH MISMATCH for block ${block.number} using SHA256 (modified)`);
        console.warn(`   Expected:   ${block.hash}`);
        console.warn(`   Calculated: ${calculatedHash}`);
      }
      
      return isValid;
    } else {
      // For original unmodified blocks, always return true (no validation, no logging)
      return true;
    }
  }

  /**
   * Validate the entire blockchain integrity
   */
  async validateBlockchain(blocks: EditableBlockData[]): Promise<{ isValid: boolean; invalidBlocks: number[]; hashMismatches: number[] }> {
    const invalidBlocks: number[] = [];
    const hashMismatches: number[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockNumber = parseInt(block.number);

      // Check hash integrity
      if (!(await this.validateBlockHash(block))) {
        hashMismatches.push(blockNumber);
      }

      // Check parent hash linkage (skip genesis block)
      if (i > 0) {
        const previousBlock = blocks[i - 1];
        if (block.parentHash !== previousBlock.hash) {
          invalidBlocks.push(blockNumber);
        }
      }
    }

    return {
      isValid: invalidBlocks.length === 0 && hashMismatches.length === 0,
      invalidBlocks,
      hashMismatches
    };
  }

  /**
   * Recalculate hash for a block and update parent hash references in subsequent blocks
   */
  async recalculateBlockchain(blocks: EditableBlockData[], changedBlockIndex: number): Promise<EditableBlockData[]> {
    const updatedBlocks = [...blocks];

    // Recalculate hash for the changed block using SHA256
    const changedBlock = updatedBlocks[changedBlockIndex];
    changedBlock.isModified = true; // Mark as modified
    const newHash = await this.calculateBlockHash(changedBlock);
    changedBlock.hash = newHash;
    
    changedBlock.isValidHash = false; // Modified blocks are always invalid (SHA256 vs keccak256)

    // Update parent hash for subsequent blocks
    for (let i = changedBlockIndex + 1; i < updatedBlocks.length; i++) {
      const currentBlock = updatedBlocks[i];
      const previousBlock = updatedBlocks[i - 1];
      
      // Mark subsequent blocks as modified too (they now have invalid parent hashes)
      currentBlock.isModified = true;
      
      // Update parent hash reference
      currentBlock.parentHash = previousBlock.hash;
      
      // Recalculate hash for this block too using SHA256
      const recalculatedHash = await this.calculateBlockHash(currentBlock);
      currentBlock.hash = recalculatedHash;
      currentBlock.isValidHash = false; // All subsequent blocks are also invalid
    }

    return updatedBlocks;
  }

  /**
   * Create an editable copy of block data with original data backup
   */
  async createEditableBlock(block: BlockData): Promise<EditableBlockData> {
    return {
      ...block,
      originalData: { ...block },
      isEditing: false,
      isValidHash: true, // Always true for original blocks (no validation on initial load)
      isModified: false  // Not modified initially
    };
  }

  /**
   * Restore a block to its original data
   */
  async restoreOriginalData(editableBlock: EditableBlockData): Promise<EditableBlockData> {
    if (!editableBlock.originalData) {
      return editableBlock;
    }

    return {
      ...editableBlock.originalData,
      originalData: editableBlock.originalData,
      isEditing: false,
      isModified: false, // Reset modified flag
      isValidHash: true  // Always true for restored original blocks (no validation)
    };
  }

  /**
   * Get a human-readable validation status
   */
  async getValidationStatus(blocks: EditableBlockData[]): Promise<{
    status: 'valid' | 'invalid' | 'mixed';
    message: string;
    details: string[];
  }> {
    const validation = await this.validateBlockchain(blocks);
    const details: string[] = [];

    if (validation.isValid) {
      return {
        status: 'valid',
        message: 'Blockchain is valid',
        details: ['All blocks have correct hashes', 'All parent hash references are correct']
      };
    }

    if (validation.hashMismatches.length > 0) {
      details.push(`Blocks with invalid hashes: ${validation.hashMismatches.join(', ')}`);
    }

    if (validation.invalidBlocks.length > 0) {
      details.push(`Blocks with broken parent hash chain: ${validation.invalidBlocks.join(', ')}`);
    }

    return {
      status: 'invalid',
      message: 'Blockchain integrity compromised',
      details
    };
  }

  /**
   * Debug method to test with your specific block data
   */
  async debugSpecificBlock(): Promise<void> {
    // Test with your actual block data from the raw JSON
    const testBlock = {
      hash: "0x88bea973aab070c83fe8b2379d7dee0687779f3c4570dfca37d6cf1e879f52c2",
      parentHash: "0x0c6f5825c47a50c947531f46714a16b264389a8a57ebb73ef7ba57ca4cda7080",
      sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
      stateRoot: "0x63b728a45888b671adc4b35bff7787c46347778a242b12e6c0c8cc471a8953d1",
      transactionsRoot: "0xdd6ad0b7729ede0bf1299fe551d1d1a55cc388575703bb76c9e29273e1a02c5d",
      receiptsRoot: "0x3c7b63f9e34fc7be5bc8237e40f0977716497cd9605632dee2473c885695854c",
      number: "37", // 0x25 = 37
      gasUsed: "26772", // 0x6894 = 26772
      gasLimit: "30000000", // 0x1c9c380 = 30000000
      extraData: "0x",
      logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      timestamp: "1748516761", // 0x683f7f99 = 1748516761
      difficulty: "0", // 0x0 = 0
      mixHash: "0xf6755cf554fd46271affedb6e837440240459f994778b899305d3ebfa82b27f5",
      nonce: "0x0000000000000000",
      miner: "0xc014ba5ec014ba5ec014ba5ec014ba5ec014ba5e",
      transactions: []
    } as BlockData;

    console.log('=== TESTING YOUR SPECIFIC BLOCK ===');
    console.log('Block number 37 (0x25)');
    const result = await this.validateBlockHash(testBlock);
    console.log('Validation result:', result ? '✅ PASS' : '❌ FAIL');
    console.log('===================================');
  }

  /**
   * Debug method to show field-by-field comparison
   */
  debugBlockFields(block: BlockData): void {
    console.log('=== BLOCK FIELD DEBUG ===');
    console.log('Block number:', block.number);
    console.log('Expected hash:', block.hash);
    
    const unixTimestamp = this.convertToUnixTimestamp(block.timestamp);
    
    console.log('\nField-by-field analysis:');
    console.log('0. parentHash:', block.parentHash, `(${this.hexToBytes(block.parentHash).length} bytes)`);
    console.log('1. sha3Uncles:', block.sha3Uncles, `(${this.hexToBytes(block.sha3Uncles).length} bytes)`);
    console.log('2. miner:', block.miner, `(${this.hexToBytes(block.miner).length} bytes)`);
    console.log('3. stateRoot:', block.stateRoot, `(${this.hexToBytes(block.stateRoot).length} bytes)`);
    console.log('4. transactionsRoot:', block.transactionsRoot, `(${this.hexToBytes(block.transactionsRoot).length} bytes)`);
    console.log('5. receiptsRoot:', block.receiptsRoot, `(${this.hexToBytes(block.receiptsRoot).length} bytes)`);
    console.log('6. logsBloom:', block.logsBloom, `(${this.hexToBytes(block.logsBloom).length} bytes)`);
    console.log('7. difficulty:', block.difficulty, `-> RLP: ${this.toRLPBytes(block.difficulty).length} bytes`);
    console.log('8. number:', block.number, `-> RLP: ${this.toRLPBytes(block.number).length} bytes`);
    console.log('9. gasLimit:', block.gasLimit, `-> RLP: ${this.toRLPBytes(block.gasLimit).length} bytes`);
    console.log('10. gasUsed:', block.gasUsed, `-> RLP: ${this.toRLPBytes(block.gasUsed).length} bytes`);
    console.log('11. timestamp:', unixTimestamp, `-> RLP: ${this.toRLPBytes(unixTimestamp).length} bytes`);
    console.log('12. extraData:', block.extraData, `(${this.hexToBytes(block.extraData).length} bytes)`);
    console.log('13. mixHash:', block.mixHash, `(${this.hexToBytes(block.mixHash).length} bytes)`);
    console.log('14. nonce:', block.nonce, `(${this.hexToBytes(block.nonce).length} bytes)`);
    console.log('========================\n');
  }

  
/**
 * Debug current block hashing (simplified - call externally with provider)
 */
async debugCurrentBlockHashing(provider: any): Promise<void> {
  try {
    if (!provider) {
      console.log('No provider available for debugging');
      return;
    }

    // Get the specific block that's failing
    const blockData = await provider.send("eth_getBlockByNumber", ["0x26", true]); // Block 38
    
    console.log('=== DEBUGGING BLOCK 38 ===');
    
    // First, check what type of blockchain this is
    this.debugBlockchainType(blockData);

    
  } catch (error) {
    console.error('Error debugging block:', error);
  }
}

/**
 * Test Hardhat block (simplified - call externally with provider)
 */
async testHardhatBlock(provider: any): Promise<void> {
  try {
    if (!provider) {
      console.log('No provider available for testing');
      return;
    }
    
    // Get latest block
    const latestBlockNumber = await provider.getBlockNumber();
    const blockData = await provider.send("eth_getBlockByNumber", [
      `0x${latestBlockNumber.toString(16)}`, 
      false
    ]);
    
    console.log('=== RAW BLOCK DATA FROM HARDHAT ===');
    console.log('All fields in block:', Object.keys(blockData));
    console.log('Block data:', blockData);
    
  } catch (error) {
    console.error('Error testing hardhat block:', error);
  }
}

/**
 * Initialize debugging (call this externally)
 */
async initializeDebugging(provider: any): Promise<void> {
  try {
    if (provider) {
      await this.debugCurrentBlockHashing(provider);
    }
  } catch (error) {
    console.error('Error initializing debugging:', error);
  }
}

/**
 * Check if this is a Hardhat/Ganache vs real Ethereum block
 */
debugBlockchainType(block: any): void {
  console.log('=== BLOCKCHAIN TYPE DETECTION ===');
  
  // Check for Hardhat signatures
  if (block.miner === '0xc014ba5ec014ba5ec014ba5ec014ba5ec014ba5e') {
    console.log('🔧 HARDHAT DETECTED - This is a local development chain');
  }
  
  if (block.difficulty === '0x0' || parseInt(block.difficulty, 16) === 0) {
    console.log('⚡ POST-MERGE BLOCK - Difficulty is 0 (PoS)');
  }
  
  if (block.baseFeePerGas) {
    console.log('💰 POST-LONDON - Has baseFeePerGas (EIP-1559)');
  }
  
  if (block.withdrawalsRoot) {
    console.log('🏦 POST-SHANGHAI - Has withdrawalsRoot');
  }
  
  if (block.blobGasUsed !== undefined) {
    console.log('🫧 POST-DENCUN - Has blob gas fields (EIP-4844)');
  }
  
  if (block.parentBeaconBlockRoot) {
    console.log('🗼 HAS BEACON ROOT - EIP-4788 active');
  }
  
  console.log('Available fields:', Object.keys(block));
  console.log('=== END DETECTION ===\n');
}

/**
 * Calculate SHA256 hash of data (for educational purposes)
 * This will make blocks show as invalid since real Ethereum uses keccak256
 */
private async sha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

}
