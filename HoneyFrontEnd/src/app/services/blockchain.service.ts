import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ethers, formatEther, formatUnits, parseUnits, Interface, toBeHex } from 'ethers';
import { WalletService } from './wallet.service';
import { ToastService } from './toast.service';

export interface BlockData {
  number: string;
  timestamp: string;
  miner: string;
  parentHash: string;
  hash: string;
  transactions: any[];
  gasLimit: string;
  gasUsed: string;
  difficulty: string;
  nonce: string;
  extraData: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  logsBloom: string;
  sha3Uncles: string;
  mixHash: string;
}

export interface DecodedTransaction {
  functionName: string;
  from: string;
  to: string;
  decodedArgs: { [key: string]: any };
  value: string;
  gasLimit: string;
  gasPrice: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {
  private readonly tokenABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount) returns (bool)",
    "function mint(address to, uint amount)",
    "function burn(address from, uint amount)",
    "function isBlacklisted(address) view returns (bool)",
    "function blacklist(address, bool) returns (bool)",
    "function getBlacklistedAddresses() view returns (address[])",
    "function clearBlacklist()",
    "function togglePause()",
    "function isPaused() view returns (bool)",
    "function getOwner() view returns (address)",
    "function getContractAddress() view returns (address)",
    "function totalSupply() view returns (uint)",
  ];

  private blocksSubject = new BehaviorSubject<BlockData[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public blocks$: Observable<BlockData[]> = this.blocksSubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(
    private walletService: WalletService,
    private toastService: ToastService
  ) {}

  async loadBlocks(): Promise<void> {
    const provider = this.walletService.getCurrentProvider();
    if (!provider) {
      this.toastService.error('No provider available. Please connect your wallet.');
      return;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const latest = await provider.getBlockNumber();
      const blocks: BlockData[] = [];

      this.toastService.info(`Loading ${latest + 1} blocks...`);

      for (let i = 0; i <= latest; i++) {
        const block = await provider.send("eth_getBlockByNumber", [
          toBeHex(i),
          true,
        ]);
        blocks.push(this.formatBlockData(block));
      }

      console.log('Loaded blocks:', blocks.length, 'latest block number:', latest);
      this.blocksSubject.next(blocks);
      this.toastService.success(`Successfully loaded ${blocks.length} blocks`);
    } catch (error: any) {
      console.error('Error loading blocks:', error);
      const errorMessage = `Failed to load blocks: ${error.message}`;
      this.errorSubject.next(errorMessage);
      this.toastService.error(errorMessage);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private formatBlockData(block: any): BlockData {
    return {
      number: parseInt(block.number, 16).toString(),
      timestamp: new Date(parseInt(block.timestamp, 16) * 1000).toISOString(),
      miner: block.miner || 'N/A',
      parentHash: block.parentHash || '0x0',
      hash: block.hash || 'N/A',
      transactions: block.transactions || [],
      gasLimit: parseInt(block.gasLimit, 16).toString(),
      gasUsed: parseInt(block.gasUsed, 16).toString(),
      difficulty: parseInt(block.difficulty, 16).toString(),
      nonce: block.nonce || '0x0',
      extraData: block.extraData || '0x',
      stateRoot: block.stateRoot || '0x0',
      transactionsRoot: block.transactionsRoot || '0x0',
      receiptsRoot: block.receiptsRoot || '0x0',
      logsBloom: block.logsBloom || '0x0',
      sha3Uncles: block.sha3Uncles || '0x0',
      mixHash: block.mixHash || '0x0'
    };
  }

  decodeTransaction(block: BlockData): DecodedTransaction {
    let functionName = "N/A";
    let from = "N/A";
    let to = "N/A";
    let decodedArgs: { [key: string]: any } = {};
    let value = "0";
    let gasLimit = "0";
    let gasPrice = "0";

    if (block.transactions?.length) {
      const tx = block.transactions[0];
      from = tx.from || "N/A";
      to = tx.to || "N/A";
      value = tx.value ? formatEther(tx.value) : "0";
      gasLimit = tx.gas ? parseInt(tx.gas, 16).toString() : "0";
      gasPrice = tx.gasPrice ? formatUnits(tx.gasPrice, 'gwei') : "0";

      try {
        if (tx.input && tx.input !== '0x') {
          const iface = new Interface(this.tokenABI);
          const parsed = iface.parseTransaction({
            data: tx.input,
            value: tx.value,
          });
          
          if (parsed) {
            functionName = parsed.name;
            
            // Extract non-numeric arguments and format them
            decodedArgs = Object.entries(parsed.args)
              .filter(([key]) => isNaN(Number(key)))
              .reduce((acc, [key, value]) => {
                let formattedValue: string;
                
                if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("value")) {
                  try {
                    formattedValue = parseFloat(formatUnits(value as bigint, 18)).toFixed(4) + " tokens";
                  } catch {
                    formattedValue = (value as any).toString();
                  }
                } else if (typeof value === 'boolean') {
                  formattedValue = value ? 'true' : 'false';
                } else {
                  formattedValue = (value as any).toString();
                }
                
                acc[key] = formattedValue;
                return acc;
              }, {} as { [key: string]: any });
          }
        } else {
          functionName = "Contract Deployment";
        }
      } catch (error) {
        console.log('Could not decode transaction:', error);
        functionName = tx.input === '0x' ? "ETH Transfer" : "Unknown Function";
        decodedArgs = {};
      }
    }

    return { 
      functionName, 
      from, 
      to, 
      decodedArgs, 
      value: value + " ETH",
      gasLimit,
      gasPrice: gasPrice + " Gwei"
    };
  }

  // Utility method to validate blockchain integrity
  validateBlockchain(): { isValid: boolean; invalidBlocks: number[] } {
    const blocks = this.blocksSubject.value;
    const invalidBlocks: number[] = [];
    
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];
      
      if (currentBlock.parentHash !== previousBlock.hash) {
        invalidBlocks.push(parseInt(currentBlock.number));
      }
    }
    
    return {
      isValid: invalidBlocks.length === 0,
      invalidBlocks
    };
  }

  // Get specific block by number
  getBlockByNumber(blockNumber: number): BlockData | null {
    const blocks = this.blocksSubject.value;
    return blocks.find(block => parseInt(block.number) === blockNumber) || null;
  }

  // Get latest block
  getLatestBlock(): BlockData | null {
    const blocks = this.blocksSubject.value;
    if (blocks.length === 0) return null;
    
    return blocks.reduce((latest, current) => 
      parseInt(current.number) > parseInt(latest.number) ? current : latest
    );
  }

  // Get blocks count
  getBlocksCount(): number {
    return this.blocksSubject.value.length;
  }

  // Clear blocks data
  clearBlocks(): void {
    this.blocksSubject.next([]);
    this.errorSubject.next(null);
  }
}
