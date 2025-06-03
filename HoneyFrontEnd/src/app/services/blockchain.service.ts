import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ethers,
  formatEther,
  formatUnits,
  parseUnits,
  Interface,
  toBeHex,
} from 'ethers';
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

export interface LoadingProgress {
  currentBlock: number;
  totalBlocks: number;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  private readonly tokenABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function balanceOf(address account) view returns (uint)',
    'function transfer(address to, uint amount) returns (bool)',
    'function mint(address to, uint amount)',
    'function burn(address from, uint amount)',
    'function isBlacklisted(address account) view returns (bool)',
    'function blacklist(address account, bool isBlacklisted) returns (bool)',
    'function getBlacklistedAddresses() view returns (address[])',
    'function clearBlacklist()',
    'function togglePause()',
    'function isPaused() view returns (bool)',
    'function getOwner() view returns (address)',
    'function getContractAddress() view returns (address)',
    'function totalSupply() view returns (uint)',
  ];

  private blocksSubject = new BehaviorSubject<BlockData[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private progressSubject = new BehaviorSubject<LoadingProgress>({
    currentBlock: 0,
    totalBlocks: 0,
    isLoading: false,
  });

  public blocks$: Observable<BlockData[]> = this.blocksSubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();
  public progress$: Observable<LoadingProgress> = this.progressSubject.asObservable();

  constructor(
    private walletService: WalletService,
    private toastService: ToastService
  ) {}

async loadBlocks(): Promise<void> {
  const provider = this.walletService.getCurrentProvider();
  if (!provider) {
    this.toastService.error('Wallet Connection Required', 'Please connect your wallet to load blockchain data.');
    return;
  }

  this.loadingSubject.next(true);
  this.errorSubject.next(null);

  // Show loading toast
  const loadingToastId = this.toastService.loading('Loading blockchain data...', 'Fetching blocks from the network');

  try {
    const latest = await provider.getBlockNumber();
    const totalBlocks = latest + 1;
    const blocks: BlockData[] = [];

    // Initialize progress
    this.progressSubject.next({
      currentBlock: 0,
      totalBlocks,
      isLoading: true,
    });

    // Update loading message with progress
    this.toastService.dismiss(loadingToastId);
    const progressToastId = this.toastService.loading(`Loading ${totalBlocks} blocks...`, 'This may take a few seconds');

    for (let i = 0; i <= latest; i++) {
      // Update progress before loading each block
      this.progressSubject.next({
        currentBlock: i,
        totalBlocks,
        isLoading: true,
      });

      const block = await provider.send("eth_getBlockByNumber", [
        toBeHex(i),
        true,
      ]);
      
      console.log(`Raw block ${i}:`, block);
      
      if (block.transactions && block.transactions.length > 0) {
        console.log(`Block ${i} transactions:`, block.transactions);
        block.transactions.forEach((tx: any, idx: number) => {
          console.log(`  Transaction ${idx}:`, {
            from: tx.from,
            to: tx.to,
            input: tx.input,
            value: tx.value,
            hash: tx.hash
          });
        });
      }
      
      blocks.push(this.formatBlockData(block));

      // Update progress after loading each block
      this.progressSubject.next({
        currentBlock: i + 1,
        totalBlocks,
        isLoading: true,
      });
    }

    console.log('Loaded blocks:', blocks.length, 'latest block number:', latest);
    this.blocksSubject.next(blocks);
    
    // Complete progress
    this.progressSubject.next({
      currentBlock: totalBlocks,
      totalBlocks,
      isLoading: false,
    });
    
    // Update to success toast
    this.toastService.updateToast(
      progressToastId, 
      'Blockchain data loaded successfully', 
      'success',
      `Loaded ${blocks.length} blocks`
    );

  } catch (error: any) {
    console.error('Error loading blocks:', error);
    const errorMessage = `Failed to load blocks: ${error.message}`;
    this.errorSubject.next(errorMessage);
    
    // Reset progress on error
    this.progressSubject.next({
      currentBlock: 0,
      totalBlocks: 0,
      isLoading: false,
    });
    
    // Update to error toast
    this.toastService.updateToast(
      loadingToastId, 
      'Failed to load blockchain data', 
      'error',
      errorMessage
    );
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
      mixHash: block.mixHash || '0x0',
    };
  }

  decodeTransaction(block: BlockData): DecodedTransaction {
    let functionName = 'N/A';
    let from = 'N/A';
    let to = 'N/A';
    let decodedArgs: { [key: string]: any } = {};
    let value = '0';
    let gasLimit = '0';
    let gasPrice = '0';

    if (block.transactions?.length) {
      const tx = block.transactions[0];
      from = tx.from || 'N/A';
      to = tx.to || 'N/A';
      value = tx.value ? formatEther(tx.value) : '0';
      gasLimit = tx.gas ? parseInt(tx.gas, 16).toString() : '0';
      gasPrice = tx.gasPrice ? formatUnits(tx.gasPrice, 'gwei') : '0';

      console.log('Raw transaction:', tx);
      console.log('Transaction input:', tx.input);

      try {
        if (tx.input && tx.input !== '0x' && tx.input.length > 2) {
          const iface = new Interface(this.tokenABI);

          console.log('Attempting to parse transaction with input:', tx.input);

          const parsed = iface.parseTransaction({
            data: tx.input,
            value: tx.value || '0x0',
          });

          if (parsed) {
            functionName = parsed.name;
            console.log('Successfully parsed transaction:', parsed);
            console.log('Parsed args:', parsed.args);
            console.log('Function fragment:', parsed.fragment);

            // Get parameter names from the function fragment
            const paramNames = parsed.fragment.inputs.map(
              (input) => input.name
            );
            console.log('Parameter names from ABI:', paramNames);

            // Map numeric indices to parameter names or create descriptive names
            const entries = Object.entries(parsed.args);
            console.log('All entries:', entries);

            decodedArgs = entries
              .filter(([key]) => !isNaN(Number(key))) // Only process numeric keys
              .reduce((acc, [key, value], index) => {
                console.log(`Processing arg: ${key} = ${value}`);

                // Use parameter name from ABI if available, otherwise create descriptive name
                let paramName =
                  paramNames[parseInt(key)] ||
                  this.getParameterName(functionName, index);
                console.log(`Parameter name: ${paramName}`);

                let formattedValue: string;

                if (
                  paramName.toLowerCase().includes('amount') ||
                  paramName.toLowerCase().includes('value')
                ) {
                  try {
                    formattedValue =
                      formatUnits(value as bigint, 18) + ' tokens';
                  } catch (error) {
                    console.log('Error formatting amount:', error);
                    formattedValue = (value as any).toString();
                  }
                } else if (typeof value === 'boolean') {
                  formattedValue = value ? 'true' : 'false';
                } else {
                  formattedValue = (value as any).toString();
                }

                console.log(
                  `Formatted value for ${paramName}: ${formattedValue}`
                );
                acc[paramName] = formattedValue;
                return acc;
              }, {} as { [key: string]: any });

            console.log('Final decoded args:', decodedArgs);
          } else {
            console.log('Failed to parse transaction - parsed is null');
          }
        } else {
          console.log('Transaction has no input data or empty input');
          functionName = 'Contract Deployment or ETH Transfer';
        }
      } catch (error) {
        console.error('Error decoding transaction:', error);
        functionName = 'Unknown Function';
        decodedArgs = {};
      }
    }

    return {
      functionName,
      from,
      to,
      decodedArgs,
      value: value + ' ETH',
      gasLimit,
      gasPrice: gasPrice + ' Gwei',
    };
  }

  private getParameterName(functionName: string, index: number): string {
    const parameterMaps: { [key: string]: string[] } = {
      transfer: ['to', 'amount'],
      mint: ['to', 'amount'],
      burn: ['from', 'amount'],
      blacklist: ['address', 'isBlacklisted'],
      balanceOf: ['account'],
      isBlacklisted: ['account'],
    };

    const params = parameterMaps[functionName];
    if (params && params[index]) {
      return params[index];
    }

    // Fallback to generic names
    return `param${index}`;
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
      invalidBlocks,
    };
  }

  // Get specific block by number
  getBlockByNumber(blockNumber: number): BlockData | null {
    const blocks = this.blocksSubject.value;
    return (
      blocks.find((block) => parseInt(block.number) === blockNumber) || null
    );
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
