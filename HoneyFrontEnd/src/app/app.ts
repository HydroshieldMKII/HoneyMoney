import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from './services/wallet.service';
import { TokenService } from './services/token.service';
import { BlockchainService } from './services/blockchain.service';
import { Observable } from 'rxjs';
import { HlmToasterComponent } from '@spartan-ng/helm/sonner';

// Import components
import { WalletDetails } from './components/wallet-details/wallet-details';
import { ContractDetails } from './components/contract-details/contract-details';
import { TokenOperationsComponent } from './components/token-operations/token-operations';
import { LeaderboardComponent } from './components/leaderboard/leaderboard';
import { BlockchainViewerComponent } from './components/blockchain-viewer/blockchain-viewer';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    WalletDetails,
    ContractDetails,
    TokenOperationsComponent,
    LeaderboardComponent,
    BlockchainViewerComponent,
    ToastComponent,
    HlmToasterComponent
  ],
  templateUrl: './app.html'
})

export class AppComponent implements OnInit {
  connected$: Observable<boolean>;
  address$: Observable<string>;
  loading$: Observable<boolean>;

  constructor(
    private walletService: WalletService,
    private tokenService: TokenService,
    private blockchainService: BlockchainService
  ) {
    this.connected$ = this.walletService.connected$;
    this.address$ = this.walletService.address$;
    this.loading$ = this.tokenService.loading$;
  }

  ngOnInit(): void {
    // Auto-connect if already connected
    if (this.walletService.isConnected()) {
      this.tokenService.refreshAllData();
      this.blockchainService.loadBlocks();
    }
  }

  async connectWallet(): Promise<void> {
    try {
      await this.walletService.connectWallet();
      await this.tokenService.refreshAllData();
      await this.blockchainService.loadBlocks();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  }

  disconnect(): void {
    this.walletService.disconnect();
  }
}
