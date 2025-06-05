import { Injectable } from '@angular/core';
import { keccak256, toBeHex, zeroPadValue, toQuantity } from 'ethers';
import { encode } from '@ethereumjs/rlp';
import { BlockData } from './blockchain.service';

export interface EditableBlockData extends BlockData {
  originalData?: BlockData;
  isEditing?: boolean;
  isValidHash?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HashingService {

  /**
   * Calculate the hash of a block using the Ethereum block header hashing algorithm
   * This implements the actual Ethereum spec for block hash calculation
   */
  calculateBlockHash(block: BlockData): string {
    try {
      // Convert all fields to proper hex format for RLP encoding
      const blockHeader = [
        this.toHex(block.parentHash),
        this.toHex(block.sha3Uncles),
        this.toHex(block.miner),
        this.toHex(block.stateRoot),
        this.toHex(block.transactionsRoot),
        this.toHex(block.receiptsRoot),
        this.toHex(block.logsBloom),
        this.toQuantityHex(block.difficulty),
        this.toQuantityHex(block.number),
        this.toQuantityHex(block.gasLimit),
        this.toQuantityHex(block.gasUsed),
        this.toQuantityHex(block.timestamp),
        this.toHex(block.extraData),
        this.toHex(block.mixHash),
        this.toHex(block.nonce)
      ];

      console.log('Block header for hashing:', blockHeader);

      // RLP encode the block header
      const encoded = encode(blockHeader);
      
      // Calculate keccak256 hash
      const hash = keccak256(encoded);
      
      console.log('Calculated hash:', hash);
      return hash;
      
    } catch (error) {
      console.error('Error calculating block hash:', error);
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
  }

  /**
   * Validate if a block's hash matches its calculated hash
   */
  validateBlockHash(block: BlockData): boolean {
    const calculatedHash = this.calculateBlockHash(block);
    return calculatedHash.toLowerCase() === block.hash.toLowerCase();
  }

  /**
   * Validate the entire blockchain integrity
   */
  validateBlockchain(blocks: BlockData[]): { isValid: boolean; invalidBlocks: number[]; hashMismatches: number[] } {
    const invalidBlocks: number[] = [];
    const hashMismatches: number[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockNumber = parseInt(block.number);

      // Check hash integrity
      if (!this.validateBlockHash(block)) {
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
  recalculateBlockchain(blocks: EditableBlockData[], changedBlockIndex: number): EditableBlockData[] {
    const updatedBlocks = [...blocks];

    // Recalculate hash for the changed block
    const changedBlock = updatedBlocks[changedBlockIndex];
    const newHash = this.calculateBlockHash(changedBlock);
    changedBlock.hash = newHash;
    changedBlock.isValidHash = this.validateBlockHash(changedBlock);

    // Update parent hash for subsequent blocks
    for (let i = changedBlockIndex + 1; i < updatedBlocks.length; i++) {
      const currentBlock = updatedBlocks[i];
      const previousBlock = updatedBlocks[i - 1];
      
      // Update parent hash reference
      currentBlock.parentHash = previousBlock.hash;
      
      // Recalculate hash for this block too
      const recalculatedHash = this.calculateBlockHash(currentBlock);
      currentBlock.hash = recalculatedHash;
      currentBlock.isValidHash = this.validateBlockHash(currentBlock);
    }

    return updatedBlocks;
  }

  /**
   * Create an editable copy of block data with original data backup
   */
  createEditableBlock(block: BlockData): EditableBlockData {
    return {
      ...block,
      originalData: { ...block },
      isEditing: false,
      isValidHash: this.validateBlockHash(block)
    };
  }

  /**
   * Restore a block to its original data
   */
  restoreOriginalData(editableBlock: EditableBlockData): EditableBlockData {
    if (!editableBlock.originalData) {
      return editableBlock;
    }

    return {
      ...editableBlock.originalData,
      originalData: editableBlock.originalData,
      isEditing: false,
      isValidHash: this.validateBlockHash(editableBlock.originalData)
    };
  }

  /**
   * Convert timestamp from ISO string to Unix timestamp for hashing
   */
  private timestampToUnix(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    return Math.floor(date.getTime() / 1000).toString();
  }

  /**
   * Ensure proper hex format
   */
  private toHex(value: string): string {
    if (!value || value === 'N/A') {
      return '0x';
    }
    
    if (!value.startsWith('0x')) {
      return '0x' + value;
    }
    
    return value;
  }

  /**
   * Convert numeric values to proper hex quantity format
   */
  private toQuantityHex(value: string | number): string {
    try {
      if (typeof value === 'string') {
        // If it's an ISO timestamp, convert to Unix timestamp first
        if (value.includes('T') && value.includes('Z')) {
          const unixTimestamp = this.timestampToUnix(value);
          return toQuantity(parseInt(unixTimestamp));
        }
        
        // If it's already a number string
        const numValue = parseInt(value);
        return toQuantity(numValue);
      }
      
      return toQuantity(value);
    } catch (error) {
      console.warn('Error converting to quantity hex:', value, error);
      return '0x0';
    }
  }

  /**
   * Get a human-readable validation status
   */
  getValidationStatus(blocks: EditableBlockData[]): {
    status: 'valid' | 'invalid' | 'mixed';
    message: string;
    details: string[];
  } {
    const validation = this.validateBlockchain(blocks);
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
}
