// src/app/components/blockchain-viewer/blockchain-viewer.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { BlockchainService, BlockData, DecodedTransaction } from '../../services/blockchain.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-blockchain-viewer',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective,
    HlmButtonDirective
  ],
  template: `
    <section hlmCard class="w-4/5 mx-auto mb-4" *ngIf="connected$ | async">
      <div hlmCardHeader>
        <div class="flex justify-between items-center">
          <div>
            <h3 hlmCardTitle>⛓️ Live Blockchain Explorer</h3>
            <p hlmCardDescription>Real-time view of blockchain blocks and transactions</p>
          </div>
          <button 
            hlmBtn 
            (click)="loadBlocks()" 
            [disabled]="loading$ | async"
            variant="secondary"
          >
            {{ (loading$ | async) ? 'Loading...' : 'Refresh Blocks' }}
          </button>
        </div>
      </div>
      <div hlmCardContent>
        <!-- Blockchain Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div class="font-bold text-xl text-blue-600">{{ getBlocksCount() }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Blocks</div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div class="font-bold text-xl text-green-600">{{ getLatestBlockNumber() }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Latest Block</div>
          </div>
          <div class="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div class="font-bold text-xl text-purple-600">{{ isChainValid() ? '✅' : '❌' }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Chain Integrity</div>
          </div>
        </div>

        <!-- Error Display -->
        <div 
          *ngIf="error$ | async as error" 
          class="mb-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg"
        >
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading$ | async" class="text-center py-8">
          <div class="inline-flex items-center space-x-2">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading blockchain data...</span>
          </div>
        </div>

        <!-- Blocks Carousel -->
        <div class="relative" *ngIf="(blocks$ | async)?.length">
          <!-- Navigation Controls -->
          <div class="flex justify-between items-center mb-4">
            <button 
              hlmBtn 
              variant="outline"
              (click)="prevSlide()" 
              [disabled]="currentSlide === 0"
              class="flex items-center space-x-2"
            >
              <span>←</span>
              <span>Previous</span>
            </button>
            
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Block {{ currentSlide + 1 }} of {{ (blocks$ | async)?.length }}
            </div>
            
            <button 
              hlmBtn 
              variant="outline"
              (click)="nextSlide()" 
              [disabled]="currentSlide >= ((blocks$ | async)?.length || 0) - 1"
              class="flex items-center space-x-2"
            >
              <span>Next</span>
              <span>→</span>
            </button>
          </div>

          <!-- Block Display -->
          <div 
            *ngFor="let block of blocks$ | async; let i = index"
            [class.hidden]="i !== currentSlide"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Block Information -->
              <div>
                <h4 class="font-bold text-lg mb-3 text-blue-600">🧱 Block Information</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="font-medium">Block Number:</span>
                    <span class="font-mono">{{ block.number }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Timestamp:</span>
                    <span class="font-mono text-xs">{{ formatTimestamp(block.timestamp) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Hash:</span>
                    <span class="font-mono text-xs break-all">{{ truncateHash(block.hash) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Parent Hash:</span>
                    <span class="font-mono text-xs break-all">{{ truncateHash(block.parentHash) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Miner:</span>
                    <span class="font-mono text-xs">{{ block.miner }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Gas Used:</span>
                    <span class="font-mono">{{ block.gasUsed }} / {{ block.gasLimit }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Transactions:</span>
                    <span class="font-mono">{{ block.transactions.length || 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- Transaction Information -->
              <div>
                <h4 class="font-bold text-lg mb-3 text-green-600">📋 Transaction Details</h4>
                <div *ngIf="block.transactions && block.transactions.length > 0; else noTransactions">
                  <ng-container *ngFor="let decoded of getDecodedTransactions(block)">
                    <div class="space-y-2 text-sm bg-white p-3 rounded border">
                      <div class="flex justify-between">
                        <span class="font-medium">Function:</span>
                        <span class="font-mono text-blue-600">{{ decoded.functionName }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="font-medium">From:</span>
                        <span class="font-mono text-xs">{{ truncateHash(decoded.from) }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="font-medium">To:</span>
                        <span class="font-mono text-xs">{{ truncateHash(decoded.to) }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="font-medium">Value:</span>
                        <span class="font-mono">{{ decoded.value }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="font-medium">Gas:</span>
                        <span class="font-mono text-xs">{{ decoded.gasLimit }} ({{ decoded.gasPrice }})</span>
                      </div>
                      
                      <!-- Decoded Arguments -->
                      <div *ngIf="Object.keys(decoded.decodedArgs).length > 0" class="mt-3">
                        <span class="font-medium text-purple-600">Arguments:</span>
                        <div class="mt-1 space-y-1">
                          <div 
                            *ngFor="let arg of Object.keys(decoded.decodedArgs)"
                            class="flex justify-between text-xs"
                          >
                            <span class="text-gray-600">{{ arg }}:</span>
                            <span class="font-mono">{{ decoded.decodedArgs[arg] }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
                <ng-template #noTransactions>
                  <div class="text-center py-4 text-gray-500">
                    <span class="text-2xl">📭</span>
                    <p class="mt-2">No transactions in this block</p>
                  </div>
                </ng-template>
              </div>
            </div>

            <!-- Additional Block Details (Collapsible) -->
            <div class="mt-4 pt-4 border-t">
              <button 
                class="text-sm text-blue-600 hover:text-blue-800"
                (click)="toggleBlockDetails(i)"
              >
                {{ showDetails[i] ? 'Hide' : 'Show' }} Additional Details
              </button>
              
              <div *ngIf="showDetails[i]" class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="font-medium">State Root:</span>
                  <span class="font-mono block break-all">{{ block.stateRoot }}</span>
                </div>
                <div>
                  <span class="font-medium">Transactions Root:</span>
                  <span class="font-mono block break-all">{{ block.transactionsRoot }}</span>
                </div>
                <div>
                  <span class="font-medium">Receipts Root:</span>
                  <span class="font-mono block break-all">{{ block.receiptsRoot }}</span>
                </div>
                <div>
                  <span class="font-medium">Difficulty:</span>
                  <span class="font-mono">{{ block.difficulty }}</span>
                </div>
                <div>
                  <span class="font-medium">Nonce:</span>
                  <span class="font-mono">{{ block.nonce }}</span>
                </div>
                <div>
                  <span class="font-medium">Extra Data:</span>
                  <span class="font-mono break-all">{{ block.extraData }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Block Navigation Dots -->
          <div class="flex justify-center mt-4 space-x-1">
            <button
              *ngFor="let block of blocks$ | async; let i = index"
              (click)="goToSlide(i)"
              class="w-2 h-2 rounded-full transition-colors"
              [class.bg-blue-600]="i === currentSlide"
              [class.bg-gray-300]="i !== currentSlide"
              [title]="'Block ' + block.number"
            ></button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!(blocks$ | async)?.length && !(loading$ | async)" class="text-center py-8">
          <span class="text-4xl">⛓️</span>
          <p class="mt-2 text-gray-600 dark:text-gray-400">No blocks loaded yet</p>
          <button hlmBtn class="mt-4" (click)="loadBlocks()">Load Blockchain Data</button>
        </div>
      </div>
    </section>
  `
})
export class BlockchainViewerComponent implements OnInit {
  blocks$: Observable<BlockData[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  connected$: Observable<boolean>;
  currentSlide = 0;
  showDetails: boolean[] = [];
  Object = Object; // Make Object available in template

  constructor(
    private blockchainService: BlockchainService,
    private walletService: WalletService
  ) {
    this.blocks$ = this.blockchainService.blocks$;
    this.loading$ = this.blockchainService.loading$;
    this.error$ = this.blockchainService.error$;
    this.connected$ = this.walletService.connected$;
  }

  ngOnInit(): void {
    // Auto-load blocks if wallet is connected
    if (this.walletService.isConnected()) {
      this.loadBlocks();
    }
  }

  async loadBlocks(): Promise<void> {
    await this.blockchainService.loadBlocks();
  }

  nextSlide(): void {
    this.blockchainService.blocks$.subscribe(blocks => {
      if (this.currentSlide < blocks.length - 1) {
        this.currentSlide++;
      }
    }).unsubscribe();
  }

  prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  toggleBlockDetails(index: number): void {
    this.showDetails[index] = !this.showDetails[index];
  }

  getDecodedTransactions(block: BlockData): DecodedTransaction[] {
    if (!block.transactions?.length) return [];
    return [this.blockchainService.decodeTransaction(block)];
  }

  getBlocksCount(): number {
    return this.blockchainService.getBlocksCount();
  }

  getLatestBlockNumber(): string {
    const latest = this.blockchainService.getLatestBlock();
    return latest ? latest.number : 'N/A';
  }

  isChainValid(): boolean {
    const validation = this.blockchainService.validateBlockchain();
    return validation.isValid;
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  truncateHash(hash: string): string {
    if (!hash || hash === 'N/A') return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  }
}
