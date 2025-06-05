import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, from } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { EditableBlockData } from '../../services/hashing.service';
import { BlockchainService, BlockData } from '../../services/blockchain.service';

@Component({
  selector: 'app-block-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective,
    HlmButtonDirective,
  ],
  template: `
    <div hlmCard class="w-full">
      <div hlmCardHeader>
        <div class="flex justify-between items-center">
          <div>
            <h4 hlmCardTitle class="text-lg">
              ✏️ Edit Block #{{ block.number }}
            </h4>
            <p hlmCardDescription>
              Make changes to block data and see real-time hash recalculation
            </p>
          </div>
          <div class="flex space-x-2">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              (click)="cancelEdit()"
              type="button"
            >
              Stop Editing
            </button>
          </div>
        </div>
      </div>
      
      <div hlmCardContent>
        <!-- Hash Display -->
        <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-300 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium text-sm">Current Hash:</span>
            <span 
              class="px-2 py-1 rounded text-xs font-mono"
              [class.bg-yellow-100]="block.isValidHash"
              [class.text-yellow-800]="block.isValidHash"
              [class.bg-red-100]="!block.isValidHash"
              [class.text-red-800]="!block.isValidHash"
            >
              {{ block.isValidHash ? '✅ Valid' : '❌ Invalid' }}
            </span>
          </div>
          <div class="font-mono text-xs break-all bg-white dark:bg-gray-200 p-2 rounded border">
            {{ block.hash }}
          </div>
        </div>

        <form [formGroup]="blockForm" class="space-y-4">
          <!-- Basic Block Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Block Number</label>
              <input
                type="text"
                formControlName="number"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-50"
                readonly
              />
              <small class="text-yellow-600 text-xs">Block number cannot be changed</small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Timestamp</label>
              <input
                type="datetime-local"
                formControlName="timestamp"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Miner Address</label>
              <input
                type="text"
                formControlName="miner"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                placeholder="0x..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Nonce</label>
              <input
                type="text"
                formControlName="nonce"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                placeholder="0x..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Gas Limit</label>
              <input
                type="number"
                formControlName="gasLimit"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Gas Used</label>
              <input
                type="number"
                formControlName="gasUsed"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Difficulty</label>
              <input
                type="number"
                formControlName="difficulty"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Extra Data</label>
              <input
                type="text"
                formControlName="extraData"
                class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                placeholder="0x..."
              />
            </div>
          </div>

          <!-- Transaction Details -->
          <div class="border-t pt-4 mt-4" *ngIf="block.transactions && block.transactions.length > 0">
            <h5 class="font-medium mb-3">📋 Transaction Details</h5>
            <div class="bg-yellow-50 dark:bg-yellow-200 p-4 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">From Address</label>
                  <input
                    type="text"
                    formControlName="transactionFrom"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">To Address (Contract)</label>
                  <input
                    type="text"
                    formControlName="transactionTo"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Value (ETH)</label>
                  <input
                    type="text"
                    formControlName="transactionValue"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                    placeholder="0x0"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Gas Limit</label>
                  <input
                    type="text"
                    formControlName="transactionGasLimit"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="21000"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Gas Price (Gwei)</label>
                  <input
                    type="text"
                    formControlName="transactionGasPrice"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Transaction Input Data</label>
                  <input
                    type="text"
                    formControlName="transactionInput"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                    placeholder="0x..."
                  />
                </div>
              </div>
              <small class="text-yellow-600 text-xs mt-2 block">
                Modifying transaction details will affect the block's transaction root hash
              </small>
            </div>
          </div>

          <!-- Hash Fields -->
          <div class="border-t pt-4 mt-4">
            <h5 class="font-medium mb-3">Block Hashes</h5>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Parent Hash</label>
                <input
                  type="text"
                  formControlName="parentHash"
                  class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                  placeholder="0x..."
                />
                <small class="text-yellow-600 text-xs">Changing this will break the chain</small>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">State Root</label>
                <input
                  type="text"
                  formControlName="stateRoot"
                  class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Transactions Root</label>
                <input
                  type="text"
                  formControlName="transactionsRoot"
                  class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Receipts Root</label>
                <input
                  type="text"
                  formControlName="receiptsRoot"
                  class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Mix Hash</label>
                <input
                  type="text"
                  formControlName="mixHash"
                  class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">SHA3 Uncles</label>
                <input
                  type="text"
                  formControlName="sha3Uncles"
                  class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xs"
                  placeholder="0x..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class BlockEditorComponent implements OnInit, OnDestroy {
  @Input() block!: EditableBlockData;
  @Input() blockIndex!: number;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  blockForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private blockchainService: BlockchainService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Convert timestamp from ISO to datetime-local format, accounting for timezone
    let timestamp: string;
    try {
      const date = new Date(this.block.timestamp);
      // Convert to local timezone and format for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      timestamp = `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      // Fallback for invalid dates
      timestamp = this.block.timestamp.slice(0, 16);
    }

    // Extract transaction data if available
    const transaction = this.block.transactions?.[0];
    const transactionFrom = transaction?.from || '';
    const transactionTo = transaction?.to || '';
    const transactionValue = transaction?.value || '0x0';
    const transactionGasLimit = transaction?.gas || '';
    const transactionGasPrice = transaction?.gasPrice || '';
    const transactionInput = transaction?.input || '0x';

    this.blockForm = this.fb.group({
      number: [{ value: this.block.number, disabled: true }],
      timestamp: [timestamp, Validators.required],
      miner: [this.block.miner, Validators.required],
      parentHash: [this.block.parentHash, Validators.required],
      gasLimit: [this.block.gasLimit, [Validators.required, Validators.min(0)]],
      gasUsed: [this.block.gasUsed, [Validators.required, Validators.min(0)]],
      difficulty: [this.block.difficulty, [Validators.required, Validators.min(0)]],
      nonce: [this.block.nonce, Validators.required],
      extraData: [this.block.extraData, Validators.required],
      stateRoot: [this.block.stateRoot, Validators.required],
      transactionsRoot: [this.block.transactionsRoot, Validators.required],
      receiptsRoot: [this.block.receiptsRoot, Validators.required],
      mixHash: [this.block.mixHash, Validators.required],
      sha3Uncles: [this.block.sha3Uncles, Validators.required],
      // Transaction fields
      transactionFrom: [transactionFrom],
      transactionTo: [transactionTo],
      transactionValue: [transactionValue],
      transactionGasLimit: [transactionGasLimit],
      transactionGasPrice: [transactionGasPrice],
      transactionInput: [transactionInput],
      from: [transactionFrom, Validators.required],
      to: [transactionTo, Validators.required],
      input: [transactionInput, Validators.required],
      value: [transactionValue, Validators.required],
      gas: [transactionGasLimit, Validators.required],
      gasPrice: [transactionGasPrice, Validators.required],
    });
  }

  private setupFormValueChanges(): void {
    this.blockForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500), // Wait for 500ms of inactivity
        distinctUntilChanged()
      )
      .subscribe((formValue) => {
        this.updateBlockData(formValue);
      });
  }

  private updateBlockData(formValue: any): void {
    // Check if timestamp was actually changed by comparing the dates
    let timestampToUse = this.block.timestamp;
    if (formValue.timestamp) {
      const originalDate = new Date(this.block.timestamp);
      const formDate = new Date(formValue.timestamp);
      
      // Compare year, month, day, hour, minute (ignore seconds and milliseconds)
      const originalTruncated = new Date(
        originalDate.getFullYear(),
        originalDate.getMonth(),
        originalDate.getDate(),
        originalDate.getHours(),
        originalDate.getMinutes()
      );
      const formTruncated = new Date(
        formDate.getFullYear(),
        formDate.getMonth(),
        formDate.getDate(),
        formDate.getHours(),
        formDate.getMinutes()
      );
      
      // Only update timestamp if the datetime-local value represents a different time
      if (originalTruncated.getTime() !== formTruncated.getTime()) {
        timestampToUse = formDate.toISOString();
      }
    }

    // Update each field that has changed
    const updatedData = {
      ...formValue,
      timestamp: timestampToUse,
      number: this.block.number, // Keep original number
    };

    // Valid BlockData fields that can be updated
    const validFields = [
      'timestamp', 'miner', 'parentHash', 'gasLimit', 'gasUsed', 
      'difficulty', 'nonce', 'extraData', 'stateRoot', 'transactionsRoot', 
      'receiptsRoot', 'mixHash', 'sha3Uncles'
    ];

    // Update each field individually to trigger hash recalculation
    Object.keys(updatedData).forEach(key => {
      if (key !== 'number' && validFields.includes(key) && updatedData[key] !== (this.block as any)[key]) {
        this.blockchainService.updateBlockField(
          this.blockIndex, 
          key as keyof BlockData, 
          updatedData[key]
        );
      }
    });
  }

  cancelEdit(): void {
        this.blockchainService.cancelBlockChanges(this.blockIndex);
        this.cancel.emit();
    }
}
