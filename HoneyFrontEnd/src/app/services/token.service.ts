import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, throwError } from 'rxjs';
import { ethers, formatUnits, parseUnits, isAddress,  } from 'ethers';
import { WalletService } from './wallet.service';
import { ToastService } from '../services/toast.service';
import { catchError, map } from 'rxjs/operators';

export interface TokenData {
  totalSupply: string;
  contractOwner: string;
  isPaused: boolean;
  contractAddress: string;
  userBalance: string;
  name: string;
  symbol: string;
}

export interface LeaderboardEntry {
  address: string;
  balance: number;
  isBlacklisted: boolean;
  rank: number;
}

export interface TransactionParams {
  recipient?: string;
  amount: string;
  to?: string;
  from?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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

  private readonly hardhatAccounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  ];

  // State management
  private tokenDataSubject = new BehaviorSubject<TokenData>({
    totalSupply: '0',
    contractOwner: '',
    isPaused: false,
    contractAddress: '',
    userBalance: '0',
    name: '',
    symbol: ''
  });

  private leaderboardSubject = new BehaviorSubject<LeaderboardEntry[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public tokenData$: Observable<TokenData> = this.tokenDataSubject.asObservable();
  public leaderboard$: Observable<LeaderboardEntry[]> = this.leaderboardSubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  private tokenContract: ethers.Contract | null = null;

  constructor(
    private walletService: WalletService,
    private toastService: ToastService
  ) {
    this.initializeContractSubscription();
  }

  private initializeContractSubscription(): void {
    combineLatest([
      this.walletService.signer$,
      this.walletService.connected$
    ]).subscribe(([signer, connected]) => {
      if (connected && signer) {
        this.tokenContract = new ethers.Contract(this.tokenAddress, this.tokenABI, signer);
        this.refreshAllData();
      } else {
        this.tokenContract = null;
        this.resetState();
      }
    });
  }

  private resetState(): void {
    this.tokenDataSubject.next({
      totalSupply: '0',
      contractOwner: '',
      isPaused: false,
      contractAddress: '',
      userBalance: '0',
      name: '',
      symbol: ''
    });
    this.leaderboardSubject.next([]);
    this.errorSubject.next(null);
  }

  async refreshAllData(): Promise<void> {
    if (!this.tokenContract) {
      this.toastService.error('Token contract not initialized');
      return;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      await Promise.all([
        this.updateTokenData(),
        this.updateLeaderboard()
      ]);
      // this.toastService.success('Data refreshed successfully');
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      this.errorSubject.next(error.message || 'Failed to refresh data');
      this.toastService.error(`Error refreshing data: ${error.message}`);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async updateTokenData(): Promise<void> {
    if (!this.tokenContract) return;

    try {
      const [
        totalSupply,
        contractOwner,
        isPaused,
        contractAddress,
        userBalance,
        name,
        symbol
      ] = await Promise.all([
        this.tokenContract['totalSupply'](),
        this.tokenContract['getOwner'](),
        this.tokenContract['isPaused'](),
        this.tokenContract['getContractAddress'](),
        this.getUserBalance(),
        this.tokenContract['name'](),
        this.tokenContract['symbol']()
      ]);

      const tokenData: TokenData = {
        totalSupply: parseFloat(formatUnits(totalSupply, 18)).toFixed(4),
        contractOwner,
        isPaused,
        contractAddress,
        userBalance,
        name,
        symbol
      };

      this.tokenDataSubject.next(tokenData);
    } catch (error: any) {
      console.error('Error updating token data:', error);
      throw new Error(`Failed to update token data: ${error.message}`);
    }
  }

  private async getUserBalance(): Promise<string> {
    if (!this.tokenContract) return '0';
    
    const address = this.walletService.getCurrentAddress();
    if (!address) return '0';

    try {
      const balance = await this.tokenContract['balanceOf'](address);
      return parseFloat(formatUnits(balance, 18)).toFixed(4);
    } catch (error: any) {
      console.error('Error getting user balance:', error);
      return '0';
    }
  }

  private async updateLeaderboard(): Promise<void> {
    if (!this.tokenContract) return;

    try {
      const balancePromises = this.hardhatAccounts.map(async (address, index) => {
        try {
          const [rawBalance, isBlacklisted] = await Promise.all([
            this.tokenContract!['balanceOf'](address),
            this.tokenContract!['isBlacklisted'](address)
          ]);
          
          return {
            address,
            balance: parseFloat(formatUnits(rawBalance, 18)),
            isBlacklisted,
            rank: index + 1
          };
        } catch (error: any) {
          console.error(`Error fetching balance for ${address}:`, error);
          return {
            address,
            balance: 0,
            isBlacklisted: false,
            rank: index + 1
          };
        }
      });

      const balances = await Promise.all(balancePromises);
      
      // Sort by balance descending and update ranks
      balances.sort((a, b) => b.balance - a.balance);
      balances.forEach((entry, index) => entry.rank = index + 1);
      
      this.leaderboardSubject.next(balances);
    } catch (error: any) {
      console.error('Error updating leaderboard:', error);
      throw new Error(`Failed to update leaderboard: ${error.message}`);
    }
  }

  private async executeTransaction(
    action: () => Promise<ethers.ContractTransactionResponse>,
    successMessage: string,
    loadingMessage: string = 'Processing transaction...'
  ): Promise<void> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    if (!this.walletService.isConnected()) {
      throw new Error('Wallet not connected');
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    const loadingToastId = this.toastService.info(loadingMessage, 0); // No auto-remove

    try {
      const tx = await action();
      this.toastService.info(`Transaction submitted: ${tx.hash}`);
      
      await tx.wait();
      
      this.toastService.remove(loadingToastId);
      this.toastService.success(successMessage);
      
      // Refresh data after successful transaction
      await this.refreshAllData();
    } catch (error: any) {
      this.toastService.remove(loadingToastId);
      const errorMessage = this.parseErrorMessage(error);
      this.errorSubject.next(errorMessage);
      this.toastService.error(`Transaction failed: ${errorMessage}`);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private parseErrorMessage(error: any): string {
    if (error.reason) return error.reason;
    if (error.message) {
      // Extract user-friendly message from common error patterns
      if (error.message.includes('user rejected')) {
        return 'Transaction rejected by user';
      }
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
      }
      if (error.message.includes('execution reverted')) {
        return 'Transaction reverted by contract';
      }
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // Validation methods
  private validateAddress(address: string): void {
    if (!address) {
      this.toastService.error('Address is required');
      throw new Error('Address is required');
    }
    if (!isAddress(address)) {
      this.toastService.error('Invalid Ethereum address format');
      throw new Error('Invalid Ethereum address format');
    }
  }

  private validateAmount(amount: string): void {
    if (!amount) {
      this.toastService.error('Amount is required');
      throw new Error('Amount is required');
    }
    if (isNaN(Number(amount)) || parseFloat(amount) <= 0) {
      this.toastService.error('Amount must be a positive number');
      throw new Error('Amount must be a positive number');
    }
  }

  // Public transaction methods
  async transfer(params: TransactionParams): Promise<void> {
    let { recipient, amount } = params;
    recipient = recipient?.trim();
    amount = amount?.trim();

    if (!recipient || !amount) {
      this.toastService.error('Recipient and amount are required');
      throw new Error('Recipient and amount are required');
    }

    this.validateAddress(recipient);
    this.validateAmount(amount);

    console.log(`Transferring ${amount} tokens to ${recipient}`);

    await this.executeTransaction(
      () => this.tokenContract!['transfer'](recipient, parseUnits(amount, 18)),
      `Successfully sent ${amount} tokens to ${recipient}`,
      `Sending ${amount} tokens...`
    );
  }

  async mint(params: TransactionParams): Promise<void> {
    const { amount } = params;
    const to = params.to?.trim() || this.walletService.getCurrentAddress();
    
    if (!amount) {
      this.toastService.error('Amount is required');
      throw new Error('Amount is required');
    }

    this.validateAddress(to);
    this.validateAmount(amount);

    await this.executeTransaction(
      () => this.tokenContract!['mint'](to, parseUnits(amount, 18)),
      `Successfully minted ${amount} tokens to ${to}`,
      `Minting ${amount} tokens...`
    );
  }

  async burn(params: TransactionParams): Promise<void> {
    const { amount } = params;
    const from = params.from?.trim() || this.walletService.getCurrentAddress();
    
    if (!amount) {
      this.toastService.error('Amount is required');
      throw new Error('Amount is required');
    }

    this.validateAddress(from);
    this.validateAmount(amount);

    await this.executeTransaction(
      () => this.tokenContract!['burn'](from, parseUnits(amount, 18)),
      `Successfully burned ${amount} tokens from ${from}`,
      `Burning ${amount} tokens...`
    );
  }

  async blacklistAddress(address: string, blacklist: boolean): Promise<void> {
    address = address.trim();
    this.validateAddress(address);

    const action = blacklist ? 'Blacklisting' : 'Unblacklisting';
    const actionPast = blacklist ? 'blacklisted' : 'unblacklisted';

    await this.executeTransaction(
      () => this.tokenContract!['blacklist'](address, blacklist),
      `Successfully ${actionPast} address ${address}`,
      `${action} address...`
    );
  }

  async clearBlacklist(): Promise<void> {
    await this.executeTransaction(
      () => this.tokenContract!['clearBlacklist'](),
      'Successfully cleared all blacklisted addresses',
      'Clearing blacklist...'
    );
  }

  async togglePause(): Promise<void> {
    const currentData = this.tokenDataSubject.value;
    const action = currentData.isPaused ? 'Unpausing' : 'Pausing';
    const actionPast = currentData.isPaused ? 'unpaused' : 'paused';

    await this.executeTransaction(
      () => this.tokenContract!['togglePause'](),
      `Contract successfully ${actionPast}`,
      `${action} contract...`
    );
  }

  // Utility methods
  getTokenAddress(): string {
    return this.tokenAddress;
  }

  getHardhatAccounts(): string[] {
    return [...this.hardhatAccounts];
  }

  isUserOwner(): boolean {
    const currentAddress = this.walletService.getCurrentAddress();
    const tokenData = this.tokenDataSubject.value;
    return currentAddress.toLowerCase() === tokenData.contractOwner.toLowerCase();
  }
}
