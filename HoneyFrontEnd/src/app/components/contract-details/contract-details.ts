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
import { TokenService, TokenData } from '../../services/token.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-contract-details',
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
        <h3 hlmCardTitle>🐝 Contract Details</h3>
        <p hlmCardDescription>Information about the HoneyMoney smart contract</p>
      </div>
      <div hlmCardContent>
        <div class="space-y-2">
          <p><strong>Total Supply:</strong> 
            <span class="font-mono text-sm" [class]="(tokenData$ | async)?.totalSupply ? '' : 'text-black'">
              {{ (tokenData$ | async)?.totalSupply || 'Unknown' }} {{ (tokenData$ | async)?.symbol || 'BEE' }}
            </span>
          </p>
          <p><strong>Contract Address:</strong> 
            <span class="font-mono text-xs break-all" [class]="(tokenData$ | async)?.contractAddress ? '' : 'text-black'">
              {{ (tokenData$ | async)?.contractAddress || 'Unknown' }}
            </span>
          </p>
          <p><strong>Contract Owner:</strong> 
            <span class="font-mono text-xs break-all" [class]="(tokenData$ | async)?.contractOwner ? '' : 'text-black'">
              {{ (tokenData$ | async)?.contractOwner || 'Unknown' }}
            </span>
          </p>
          <p><strong>Pause State:</strong> 
            <span class="font-mono" [class]="(tokenData$ | async)?.isPaused ? 'text-red-600 font-semibold' : ((tokenData$ | async)?.isPaused !== undefined ? 'text-green-600 font-semibold' : 'text-black')">
              {{ (tokenData$ | async)?.isPaused ? 'Paused enabled' : ((tokenData$ | async)?.isPaused !== undefined ? 'not active' : 'Unknown') }}
            </span>
          </p>
          <p><strong>Token Name:</strong> 
            <span class="font-mono text-sm" [class]="(tokenData$ | async)?.name ? '' : 'text-black'">
              {{ (tokenData$ | async)?.name || 'Unknown' }}
            </span>
          </p>
        </div>
      </div>
      <div hlmCardFooter *ngIf="isUserOwner()">
        <button 
          hlmBtn 
          variant="destructive"
          (click)="togglePause()"
          [disabled]="loading$ | async"
        >
          {{ (tokenData$ | async)?.isPaused ? 'Resume Contract' : 'Pause Contract' }}
        </button>
      </div>
    </section>
  `
})
export class ContractDetails {
  tokenData$: Observable<TokenData>;
  loading$: Observable<boolean>;
  connected$: Observable<boolean>;

  constructor(
    private tokenService: TokenService,
    private walletService: WalletService
  ) {
    this.tokenData$ = this.tokenService.tokenData$;
    console.log('ContractDetails initialized with tokenData$:', this.tokenData$);
    this.loading$ = this.tokenService.loading$;
    this.connected$ = this.walletService.connected$;
  }

  isUserOwner(): boolean {
    return this.tokenService.isUserOwner();
  }

  async togglePause(): Promise<void> {
    try {
      await this.tokenService.togglePause();
    } catch (error: any) {
      console.error('Failed to toggle pause:', error);
    }
  }
}