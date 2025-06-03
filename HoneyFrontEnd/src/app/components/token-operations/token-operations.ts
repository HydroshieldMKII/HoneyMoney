// src/app/components/token-operations/token-operations.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { TokenService } from '../../services/token.service';
import { WalletService } from '../../services/wallet.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-token-operations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective,
    HlmButtonDirective
  ],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 w-4/5 mx-auto" *ngIf="connected$ | async">
      
      <!-- Send Tokens -->
      <section hlmCard>
        <div hlmCardHeader>
          <h4 hlmCardTitle class="text-lg">💸 Send HoneyMoney</h4>
          <p hlmCardDescription>Transfer tokens to another address</p>
        </div>
        <div hlmCardContent>
          <div class="space-y-3">
            <input 
              type="text"
              [(ngModel)]="sendForm.recipient"
              placeholder="Recipient address"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              type="number"
              [(ngModel)]="sendForm.amount"
              placeholder="Amount"
              min="0"
              step="0.0001"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              hlmBtn 
              class="w-full"
              variant="default"
              (click)="onSend()"
              [disabled]="loading$ | async"
            >
              Send Tokens
            </button>
          </div>
        </div>
      </section>

      <!-- Mint Tokens -->
      <section hlmCard>
        <div hlmCardHeader>
          <h4 hlmCardTitle class="text-lg">🏭 Mint Tokens</h4>
          <p hlmCardDescription>Create new tokens (Owner only)</p>
        </div>
        <div hlmCardContent>
          <div class="space-y-3">
            <input 
              type="text"
              [(ngModel)]="mintForm.to"
              placeholder="To address (blank = self)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              type="number"
              [(ngModel)]="mintForm.amount"
              placeholder="Amount"
              min="0"
              step="0.0001"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              hlmBtn 
              class="w-full"
              variant="default"
              (click)="onMint()"
              [disabled]="loading$ | async"
            >
              Mint Tokens
            </button>
          </div>
        </div>
      </section>

      <!-- Burn Tokens -->
      <section hlmCard>
        <div hlmCardHeader>
          <h4 hlmCardTitle class="text-lg">🔥 Burn Tokens</h4>
          <p hlmCardDescription>Destroy tokens permanently</p>
        </div>
        <div hlmCardContent>
          <div class="space-y-3">
            <input 
              type="text"
              [(ngModel)]="burnForm.from"
              placeholder="From address (blank = self)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              type="number"
              [(ngModel)]="burnForm.amount"
              placeholder="Amount"
              min="0"
              step="0.0001"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              hlmBtn 
              class="w-full"
              variant="destructive"
              (click)="onBurn()"
              [disabled]="loading$ | async"
            >
              Burn Tokens
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Blacklist Management -->
    <section hlmCard class="w-4/5 mx-auto mb-4" *ngIf="isUserOwner() && (connected$ | async)">
      <div hlmCardHeader>
        <h4 hlmCardTitle class="text-lg">🚫 Blacklist Management</h4>
        <p hlmCardDescription>Manage blacklisted addresses (Owner only)</p>
      </div>
      <div hlmCardContent>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="md:col-span-1">
            <input 
              type="text"
              [(ngModel)]="blacklistForm.address"
              placeholder="Address to manage"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            hlmBtn 
            variant="destructive"
            (click)="onBlacklist()"
            [disabled]="loading$ | async"
          >
            Blacklist
          </button>
          <button 
            hlmBtn 
            variant="default"
            (click)="onUnblacklist()"
            [disabled]="loading$ | async"
          >
            Remove from Blacklist
          </button>
          <button 
            hlmBtn 
            variant="secondary"
            (click)="onClearBlacklist()"
            [disabled]="loading$ | async"
          >
            Clear All
          </button>
        </div>
      </div>
    </section>
  `
})
export class TokenOperationsComponent {
  connected$: Observable<boolean>;
  loading$: Observable<boolean>;

  sendForm = {
    recipient: '',
    amount: ''
  };

  mintForm = {
    to: '',
    amount: ''
  };

  burnForm = {
    from: '',
    amount: ''
  };

  blacklistForm = {
    address: ''
  };

  constructor(
    private tokenService: TokenService,
    private walletService: WalletService,
    private toastService: ToastService
  ) {
    this.connected$ = this.walletService.connected$;
    this.loading$ = this.tokenService.loading$;

  }

  isUserOwner(): boolean {
    return this.tokenService.isUserOwner();
  }

  async onSend(): Promise<void> {
    try {
      await this.tokenService.transfer({
        recipient: this.sendForm.recipient,
        amount: String(this.sendForm.amount)
      });
      this.sendForm = { recipient: '', amount: '' };
    } catch (error: any) {
      console.warn('Send failed:', error);
    }
  }

  async onMint(): Promise<void> {
    try {
      await this.tokenService.mint({
        to: this.mintForm.to,
        amount: String(this.mintForm.amount)
      });
      this.mintForm = { to: '', amount: '' };
    } catch (error: any) {
      console.warn('Mint failed:', error);
    }
  }

  async onBurn(): Promise<void> {
    if (!this.burnForm.amount) {
      this.toastService.error('Please specify an amount to burn');
      return;
    }

    try {
      await this.tokenService.burn({
        from: this.burnForm.from,
        amount: String(this.burnForm.amount)
      });
      this.burnForm = { from: '', amount: '' };
    } catch (error: any) {
      console.warn('Burn failed:', error);
    }
  }

  async onBlacklist(): Promise<void> {
    if (!this.blacklistForm.address) {
      this.toastService.error('Please specify an address to blacklist');
      return;
    }

    try {
      await this.tokenService.blacklistAddress(this.blacklistForm.address, true);
      this.blacklistForm = { address: '' };
    } catch (error: any) {
      console.warn('Blacklist failed:', error);
    }
  }

  async onUnblacklist(): Promise<void> {
    if (!this.blacklistForm.address) {
      this.toastService.error('Please specify an address to unblacklist');
      return;
    }

    try {
      await this.tokenService.blacklistAddress(this.blacklistForm.address, false);
      this.blacklistForm = { address: '' };
    } catch (error: any) {
      console.warn('Unblacklist failed:', error);
    }
  }

  async onClearBlacklist(): Promise<void> {
    try {
      await this.tokenService.clearBlacklist();
    } catch (error: any) {
      console.warn('Clear blacklist failed:', error);
    }
  }
}
