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
import {
  BlockchainService,
  BlockData,
  DecodedTransaction,
  LoadingProgress,
} from '../../services/blockchain.service';
import { WalletService } from '../../services/wallet.service';
import { HashingService } from '../../services/hashing.service';
import { BlockchainLoadingProgressComponent } from './blockchain-loading-progress';
import { BlockEditorComponent } from '../block-editor/block-editor';
import { EditableBlockData } from '../../services/hashing.service';

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
    HlmButtonDirective,
    BlockchainLoadingProgressComponent,
    BlockEditorComponent,
  ],
  template: `
    <section hlmCard class="w-4/5 mx-auto mb-5" *ngIf="connected$ | async">
      <div hlmCardHeader>
        <div class="flex justify-between items-center">
          <div>
            <h3 hlmCardTitle>⛓️ Live Blockchain Explorer</h3>
            <p hlmCardDescription>
              Real-time view of blockchain blocks and transactions
            </p>
          </div>
          <button
            *ngIf="(blocks$ | async)?.length"
            hlmBtn
            (click)="loadBlocks()"
            [disabled]="loading$ | async"
            variant="default"
          >
            {{ (loading$ | async) ? 'Loading...' : 'Refresh Blocks' }}
          </button>
        </div>
      </div>
      <div hlmCardContent>
        <!-- Blockchain Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div class="font-bold text-xl text-blue-600">
              {{ getBlocksCount() }}
            </div>
            <div class="text-sm text-yellow-600 dark:text-yellow-400">
              Total Blocks
            </div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div class="font-bold text-xl text-green-600">
              {{ getLatestBlockNumber() }}
            </div>
            <div class="text-sm text-yellow-600 dark:text-yellow-400">
              Latest Block
            </div>
          </div>
          <div
            class="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg"
          >
            <div class="font-bold text-xl text-purple-600">
              {{ isChainValid() ? '✅' : '❌' }}
            </div>
            <div class="text-sm text-yellow-600 dark:text-yellow-400">
              Chain Integrity
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div
          *ngIf="error$ | async as error"
          class="mb-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg"
        >
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Loading State with Progress Bar -->
        <div *ngIf="progress$ | async as progress" class="mb-6">
          <div *ngIf="progress.isLoading" class="py-8">
            <app-blockchain-loading-progress
              [currentBlock]="progress.currentBlock"
              [totalBlocks]="progress.totalBlocks">
            </app-blockchain-loading-progress>
          </div>
        </div>

        <!-- Enhanced Blockchain Validation Display -->
        <div *ngIf="(editableBlocks$ | async)?.length" class="mb-6 p-4 border rounded-lg" 
             [class.border-green-200]="getValidationStatus().status === 'valid'"
             [class.bg-green-50]="getValidationStatus().status === 'valid'"
             [class.border-red-200]="getValidationStatus().status === 'invalid'"
             [class.bg-red-50]="getValidationStatus().status === 'invalid'">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium">Blockchain Validation Status:</span>
            <span class="px-3 py-1 rounded text-sm font-medium"
                  [class.bg-green-100]="getValidationStatus().status === 'valid'"
                  [class.text-green-800]="getValidationStatus().status === 'valid'"
                  [class.bg-red-100]="getValidationStatus().status === 'invalid'"
                  [class.text-red-800]="getValidationStatus().status === 'invalid'">
              {{ getValidationStatus().message }}
            </span>
          </div>
            <div class="text-sm space-y-1">
            <div *ngFor="let detail of getValidationStatus().details" class="text-yellow-600">
              • {{ detail }}
            </div>
          </div>
          <div class="mt-3 flex space-x-2">
            <button hlmBtn variant="outline" size="sm" (click)="restoreAllBlocks()">
              🔄 Restore All Blocks
            </button>
          </div>
        </div>

        <!-- Blocks Carousel -->
        <div class="relative" *ngIf="(editableBlocks$ | async)?.length">
          <!-- Navigation Controls -->
          <div class="flex justify-between items-center mb-4">
            <button
              hlmBtn
              variant="secondary"
              (click)="prevSlide()"
              [disabled]="currentSlide === 0"
              class="flex items-center space-x-2"
            >
              <span>←</span>
              <span>Previous</span>
            </button>

            <div class="text-sm text-yellow-600 dark:text-yellow-400">
              Block {{ currentSlide + 1 }} of {{ (editableBlocks$ | async)?.length }}
            </div>

            <button
              hlmBtn
              variant="secondary"
              (click)="nextSlide()"
              [disabled]="currentSlide >= ((editableBlocks$ | async)?.length || 0) - 1"
              class="flex items-center space-x-2"
            >
              <span>Next</span>
              <span>→</span>
            </button>
          </div>

          <!-- Block Display -->
          <div
            *ngFor="let block of editableBlocks$ | async; let i = index"
            [class.hidden]="i !== currentSlide"
            class="border border-yellow-200 dark:border-yellow-700 rounded-lg p-4"
            [class.border-blue-300]="block.isEditing"
            [class.bg-blue-50]="block.isEditing"
          >
            <!-- Block Editor (when editing) -->
            <div *ngIf="block.isEditing; else viewMode">
              <app-block-editor
                [block]="block"
                [blockIndex]="i"
                (save)="onBlockSaved()"
                (cancel)="onBlockCancelled()">
              </app-block-editor>
            </div>

            <!-- View Mode Template -->
            <ng-template #viewMode>
              <!-- Block Header with Edit Button -->
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center space-x-3">
                  <h4 class="font-bold text-lg text-blue-600">
                    🧱 Block #{{ block.number }}
                  </h4>
                  <span 
                    class="px-2 py-1 rounded text-xs font-mono"
                    [class.bg-green-100]="block.isValidHash"
                    [class.text-green-800]="block.isValidHash"
                    [class.bg-red-100]="!block.isValidHash"
                    [class.text-red-800]="!block.isValidHash"
                  >
                    {{ block.isValidHash ? '✅ Valid Hash' : '❌ Invalid Hash' }}
                  </span>
                </div>
                <button
                  hlmBtn
                  variant="outline"
                  size="sm"
                  (click)="toggleEditMode(i)"
                >
                  ✏️ Edit Block
                </button>
              </div>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Block Information -->
              <div>
                <h4 class="font-bold text-lg mb-3 text-blue-600">
                  🧱 Block Information
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="font-medium">Block Number:</span>
                    <span class="font-mono">{{ block.number }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Timestamp:</span>
                    <span class="font-mono text-xs">{{
                      formatTimestamp(block.timestamp)
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Hash:</span>
                    <span class="font-mono text-xs break-all">{{
                      block.hash
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Parent Hash:</span>
                    <span class="font-mono text-xs break-all">{{
                      block.parentHash
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Miner:</span>
                    <span class="font-mono text-xs">{{ block.miner }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Gas Used:</span>
                    <span class="font-mono"
                      >{{ block.gasUsed }} / {{ block.gasLimit }}</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Transactions:</span>
                    <span class="font-mono">{{
                      block.transactions.length || 0
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Transaction Information -->
              <div>
                <h4 class="font-bold text-lg mb-3 text-green-600">
                  📋 Transaction Details
                </h4>
                <div
                  *ngIf="
                    block.transactions && block.transactions.length > 0;
                    else noTransactions
                  "
                >
                  <ng-container
                    *ngFor="let decoded of getDecodedTransactions(block)"
                  >
                    <div class="space-y-2 text-sm bg-white p-3 rounded border">
                      <div class="flex justify-between">
                        <span class="font-medium">Function:</span>
                        <span class="font-mono text-blue-600">{{
                          decoded.functionName
                        }}</span>
                      </div>

                      <div>
                        <div class="flex justify-between mb-2">
                          <span class="font-medium">Decoded Params:</span>
                        </div>
                        <div
                          class="bg-yellow-50 p-2 rounded text-xs"
                          style="white-space: normal;"
                          [innerHTML]="
                            getFormattedDecodedArgs(decoded.decodedArgs)
                          "
                        ></div>
                      </div>

                      <div class="flex justify-between">
                        <span class="font-medium">From:</span>
                        <span class="font-mono text-xs">{{
                          decoded.from
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="font-medium">To (Contract):</span>
                        <span class="font-mono text-xs">{{ decoded.to }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="font-medium">Gas:</span>
                        <span class="font-mono text-xs"
                          >{{ decoded.gasLimit }} ({{ decoded.gasPrice }})</span
                        >
                      </div>
                    </div>
                  </ng-container>
                </div>
                <ng-template #noTransactions>
                  <div class="text-center py-4 text-yellow-500">
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

              <div
                *ngIf="showDetails[i]"
                class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
              >
                <div>
                  <span class="font-medium">State Root:</span>
                  <span class="font-mono block break-all">{{
                    block.stateRoot
                  }}</span>
                </div>
                <div>
                  <span class="font-medium">Transactions Root:</span>
                  <span class="font-mono block break-all">{{
                    block.transactionsRoot
                  }}</span>
                </div>
                <div>
                  <span class="font-medium">Receipts Root:</span>
                  <span class="font-mono block break-all">{{
                    block.receiptsRoot
                  }}</span>
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
            </ng-template>
          </div>

          <!-- Block Navigation Dots -->
          <div class="flex justify-center mt-4 space-x-1">
            <button
              *ngFor="let block of blocks$ | async; let i = index"
              (click)="goToSlide(i)"
              class="w-2 h-2 rounded-full transition-colors"
              [class.bg-blue-600]="i === currentSlide"
              [class.bg-yellow-300]="i !== currentSlide"
              [title]="'Block ' + block.number"
            ></button>
          </div>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!(blocks$ | async)?.length && !(loading$ | async)"
          class="text-center py-8"
        >
          <span class="text-4xl">⛓️</span>
          <p class="mt-2 text-yellow-600 dark:text-yellow-400">
            No blocks loaded yet
          </p>
          <button hlmBtn class="mt-4" (click)="loadBlocks()">
            Load Blockchain Data
          </button>
        </div>
      </div>
    </section>
  `,
})
export class BlockchainViewerComponent implements OnInit {
  blocks$: Observable<BlockData[]>;
  editableBlocks$: Observable<EditableBlockData[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  connected$: Observable<boolean>;
  progress$: Observable<LoadingProgress>;
  currentSlide = 0;
  showDetails: boolean[] = [];
  Object = Object; // Make Object available in template
  validationStatus: {
    status: 'valid' | 'invalid' | 'mixed';
    message: string;
    details: string[];
  } | null = null;
  
  private hasDebugged = false; // Add flag to prevent infinite loop

  constructor(
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private hashingService: HashingService
  ) {
    this.blocks$ = this.blockchainService.blocks$;
    this.editableBlocks$ = this.blockchainService.editableBlocks$;
    this.loading$ = this.blockchainService.loading$;
    this.error$ = this.blockchainService.error$;
    this.connected$ = this.walletService.connected$;
    this.progress$ = this.blockchainService.progress$;
  }

  async ngOnInit(): Promise<void> {
    if (this.walletService.isConnected()) {
      // Debug removed to prevent infinite loop during blockchain loading
      this.loadBlocks();
    }
  }

  // FIXED: Remove debug call from loadBlocks
  async loadBlocks(): Promise<void> {
    await this.blockchainService.loadBlocks();
  }

  // REST OF YOUR METHODS STAY THE SAME...
  nextSlide(): void {
    this.blockchainService.blocks$
      .subscribe((blocks) => {
        if (this.currentSlide < blocks.length - 1) {
          this.currentSlide++;
        }
      })
      .unsubscribe();
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

  getFormattedDecodedArgs(decodedArgs: { [key: string]: any }): string {
    if (!decodedArgs || Object.keys(decodedArgs).length === 0) {
      return '<div class="text-gray-500 italic">No parameters</div>';
    }

    const formatted = Object.entries(decodedArgs)
      .map(([key, value]) => {
        return `<div><b>${key}:</b> ${value}</div>`;
      })
      .join('');

    return formatted || '<div class="text-gray-500 italic">No parameters</div>';
  }

  // FIXED: Make getValidationStatus synchronous and check isValidHash properly
  getValidationStatus(): {
    status: 'valid' | 'invalid' | 'mixed';
    message: string;
    details: string[];
  } {
    // Default fallback if no validation status is available
    const defaultStatus = {
      status: 'valid' as const,
      message: 'Blockchain is valid',
      details: ['All blocks have correct hashes']
    };

    // Get the current blocks synchronously
    let currentBlocks: any[] = [];
    this.editableBlocks$.subscribe(blocks => {
      currentBlocks = blocks || [];
    }).unsubscribe();

    if (currentBlocks.length === 0) {
      return defaultStatus;
    }

    // Check which blocks have invalid hashes
    const invalidHashBlocks: number[] = [];
    const brokenChainBlocks: number[] = [];

    for (let i = 0; i < currentBlocks.length; i++) {
      const block = currentBlocks[i];
      const blockNumber = parseInt(block.number);

      // Check hash validity
      if (!block.isValidHash) {
        invalidHashBlocks.push(blockNumber);
      }

      // Check parent hash linkage (skip genesis block)
      if (i > 0) {
        const previousBlock = currentBlocks[i - 1];
        if (block.parentHash !== previousBlock.hash) {
          brokenChainBlocks.push(blockNumber);
        }
      }
    }

    const isValid = invalidHashBlocks.length === 0 && brokenChainBlocks.length === 0;
    const details: string[] = [];

    if (isValid) {
      details.push('All blocks have correct hashes');
      details.push('All parent hash references are correct');
    } else {
      if (invalidHashBlocks.length > 0) {
        details.push(`Blocks with invalid hashes: ${invalidHashBlocks.join(', ')}`);
      }
      if (brokenChainBlocks.length > 0) {
        details.push(`Blocks with broken parent hash chain: ${brokenChainBlocks.join(', ')}`);
      }
    }

    // console.log('Blockchain validation details:', { isValid, invalidHashBlocks, brokenChainBlocks });

    return {
      status: isValid ? 'valid' : 'invalid',
      message: isValid ? 'Blockchain is valid' : 'Blockchain integrity compromised',
      details
    };
  }

  toggleEditMode(blockIndex: number): void {
    this.blockchainService.toggleEditMode(blockIndex);
  }

  onBlockSaved(): void {
    // Block has been saved, refresh validation status
    console.log('Block saved successfully');
    this.blockchainService.getValidationStatus(); // Refresh validation status
  }

  onBlockCancelled(): void {
    // Block editing was cancelled
    console.log('Block editing cancelled');
    this.blockchainService.getValidationStatus(); // Refresh validation status
  }

  restoreAllBlocks(): void {
    this.blockchainService.restoreAllBlocks();
  }
}
