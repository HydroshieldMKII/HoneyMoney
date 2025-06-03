// src/app/components/leaderboard/leaderboard.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { TokenService, LeaderboardEntry } from '../../services/token.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective
  ],
  template: `
    <section hlmCard class="w-4/5 mx-auto mb-4" *ngIf="connected$ | async">
      <div hlmCardHeader>
        <h3 hlmCardTitle>🏆 Token Holders Leaderboard</h3>
        <p hlmCardDescription>Top token holders and their balances</p>
      </div>
      <div hlmCardContent>
        <div class="overflow-x-auto">
          <table class="w-full table-auto border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-200 dark:border-gray-700">
                <th class="px-4 py-3 text-left font-semibold">Rank</th>
                <th class="px-4 py-3 text-left font-semibold">Address</th>
                <th class="px-4 py-3 text-left font-semibold">Balance (BEE)</th>
                <th class="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                *ngFor="let entry of leaderboard$ | async; trackBy: trackByAddress"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 transition-colors"
                [class.bg-yellow-50]="isCurrentUser(entry.address)"
                [class.dark:bg-yellow-100]="isCurrentUser(entry.address)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center">
                    <span class="font-bold text-lg">{{ entry.rank }}</span>
                    <span *ngIf="entry.rank <= 3" class="ml-2">
                      {{ entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉' }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-col">
                    <code 
                      class="text-xs break-all"
                      [class.text-red-600]="entry.isBlacklisted"
                      [class.font-bold]="isCurrentUser(entry.address)"
                    >
                      {{ entry.address }}<span 
                      *ngIf="isCurrentUser(entry.address)"
                      class="text-xs text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      (You)
                    </span>
                    </code>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span 
                    class="font-semibold"
                    [class.text-green-600]="entry.balance > 0"
                    [class.text-gray-500]="entry.balance === 0"
                  >
                    {{ entry.balance.toFixed(4) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span 
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                    [class.bg-red-100]="entry.isBlacklisted"
                    [class.text-red-800]="entry.isBlacklisted"
                    [class.dark:bg-red-900]="entry.isBlacklisted"
                    [class.dark:text-red-200]="entry.isBlacklisted"
                    [class.bg-green-100]="!entry.isBlacklisted"
                    [class.text-green-800]="!entry.isBlacklisted"
                    [class.dark:bg-green-900]="!entry.isBlacklisted"
                    [class.dark:text-green-200]="!entry.isBlacklisted"
                  >
                    {{ entry.isBlacklisted ? '🚫 Blacklisted' : '✅ Active' }}
                  </span>
                </td>
              </tr>
              
              <!-- Empty state -->
              <tr *ngIf="(leaderboard$ | async)?.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                  <div class="flex flex-col items-center space-y-2">
                    <span class="text-2xl">🕐</span>
                    <span>Loading leaderboard data...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Statistics -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" *ngIf="(leaderboard$ | async)?.length">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="font-semibold text-lg text-blue-600">{{ getTotalHolders() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Total Holders</div>
            </div>
            <div>
              <div class="font-semibold text-lg text-green-600">{{ getActiveHolders() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Active Holders</div>
            </div>
            <div>
              <div class="font-semibold text-lg text-red-600">{{ getBlacklistedHolders() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Blacklisted</div>
            </div>
            <div>
              <div class="font-semibold text-lg text-purple-600">{{ getTotalBalance() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Total Balance</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LeaderboardComponent {
  leaderboard$: Observable<LeaderboardEntry[]>;
  connected$: Observable<boolean>;
  currentAddress$: Observable<string>;
  private currentLeaderboard: LeaderboardEntry[] = [];

  constructor(
    private tokenService: TokenService,
    private walletService: WalletService
  ) {
    this.leaderboard$ = this.tokenService.leaderboard$;
    this.connected$ = this.walletService.connected$;
    this.currentAddress$ = this.walletService.address$;
    
    // Subscribe to leaderboard changes to keep current data
    this.leaderboard$.subscribe(data => {
      this.currentLeaderboard = data;
    });
  }

  trackByAddress(index: number, entry: LeaderboardEntry): string {
    return entry.address;
  }
  getTotalHolders(): number {
    return this.currentLeaderboard.length;
  }

  getActiveHolders(): number {
    return this.currentLeaderboard.filter(entry => !entry.isBlacklisted).length;
  }

  getBlacklistedHolders(): number {
    return this.currentLeaderboard.filter(entry => entry.isBlacklisted).length;
  }

  getTotalBalance(): string {
    const total = this.currentLeaderboard.reduce((sum, entry) => sum + entry.balance, 0);
    return total.toFixed(4);
  }

  isCurrentUser(address: string): boolean {
    let currentAddress = '';
    this.currentAddress$.subscribe(addr => currentAddress = addr).unsubscribe();
    return currentAddress.toLowerCase() === address.toLowerCase();
  }
}