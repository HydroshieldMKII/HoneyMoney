// src/app/components/wallet-details/wallet-details.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { WalletService } from '../../services/wallet.service';
import { TokenService, TokenData } from '../../services/token.service';

@Component({
  selector: 'app-wallet-details',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective,
    HlmCardFooterDirective,
    HlmButtonDirective
  ],
  template: `
    <section hlmCard class="w-4/5 mx-auto mb-4">
      <div hlmCardHeader>
        <h3 hlmCardTitle>🍯 Wallet Details</h3>
        <p hlmCardDescription>Your wallet information and connection status</p>
      </div>
      <div hlmCardContent>
        <p><strong>Wallet address:</strong> 
          <span class="font-mono text-sm">
            {{ (connected$ | async) ? (address$ | async) : 'Not connected' }}
          </span>
        </p>
        <p><strong>Balance:</strong> 
          <span class="text-green-600 font-semibold">
            {{ (tokenData$ | async)?.userBalance || '?' }} BEE
          </span>
        </p>
        <p><strong>Status:</strong> 
          <span [class]="(connected$ | async) ? 'text-green-600' : 'text-red-600'">
            {{ (connected$ | async) ? 'Connected' : 'Disconnected' }}
          </span>
        </p>
      </div>
      <div hlmCardFooter>
        <button 
          hlmBtn 
          (click)="handleWalletAction()"
          [disabled]="loading$ | async"
        >
          {{ (connected$ | async) ? 'Disconnect' : 'Connect Wallet' }}
        </button>
      </div>
    </section>
  `
})
export class WalletDetails {
  connected$: Observable<boolean>;
  address$: Observable<string>;
  tokenData$: Observable<TokenData>;
  loading$: Observable<boolean>;

  constructor(
    private walletService: WalletService,
    private tokenService: TokenService
  ) {
    this.connected$ = this.walletService.connected$;
    this.address$ = this.walletService.address$;
    this.tokenData$ = this.tokenService.tokenData$;
    this.loading$ = this.tokenService.loading$;
  }

  async connectWallet(): Promise<void> {
    try {
      await this.walletService.connectWallet();
      await this.tokenService.refreshAllData();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  }

  disconnect(): void {
    this.walletService.disconnect();
  }

  handleWalletAction(): void {
    this.connected$.subscribe(connected => {
      if (connected) {
        this.disconnect();
      } else {
        this.connectWallet();
      }
    }).unsubscribe();
  }
}