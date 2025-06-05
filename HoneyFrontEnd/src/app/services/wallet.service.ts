import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ethers, BrowserProvider } from 'ethers';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  connected: boolean;
  address: string;
  provider: BrowserProvider | null;
  signer: ethers.Signer | null;
  networkId: bigint | null;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private walletStateSubject = new BehaviorSubject<WalletState>({
    connected: false,
    address: '',
    provider: null,
    signer: null,
    networkId: null
  });

  public walletState$ = this.walletStateSubject.asObservable();
  public connected$ = new BehaviorSubject<boolean>(false);
  public address$ = new BehaviorSubject<string>('');
  public provider$ = new BehaviorSubject<BrowserProvider | null>(null);
  public signer$ = new BehaviorSubject<ethers.Signer | null>(null);

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.updateAddress(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      window.ethereum.on('disconnect', () => {
        this.disconnect();
      });
    }
  }

  async connectWallet(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected! Please install MetaMask.');
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      const newState: WalletState = {
        connected: true,
        address,
        provider,
        signer,
        networkId: network.chainId
      };

      this.walletStateSubject.next(newState);
      this.connected$.next(true);
      this.address$.next(address);
      this.provider$.next(provider);
      this.signer$.next(signer);

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  disconnect(): void {
    const disconnectedState: WalletState = {
      connected: false,
      address: '',
      provider: null,
      signer: null,
      networkId: null
    };

    this.walletStateSubject.next(disconnectedState);
    this.connected$.next(false);
    this.address$.next('');
    this.provider$.next(null);
    this.signer$.next(null);

  }

  private updateAddress(newAddress: string): void {
    const currentState = this.walletStateSubject.value;
    if (currentState.connected) {
      const updatedState = { ...currentState, address: newAddress };
      this.walletStateSubject.next(updatedState);
      this.address$.next(newAddress);
    }
  }

  // Getter methods for current values
  getCurrentProvider(): BrowserProvider | null {
    return this.walletStateSubject.value.provider;
  }

  getCurrentSigner(): ethers.Signer | null {
    return this.walletStateSubject.value.signer;
  }

  getCurrentAddress(): string {
    return this.walletStateSubject.value.address;
  }

  isConnected(): boolean {
    return this.walletStateSubject.value.connected;
  }

  getNetworkId(): bigint | null {
    return this.walletStateSubject.value.networkId;
  }
}
