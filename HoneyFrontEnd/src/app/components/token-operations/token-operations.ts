import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TokenService, TokenData } from '../../services/token.service';
import { WalletService } from '../../services/wallet.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-token-operations',
  templateUrl: './token-operations.html'
})
export class TokenOperationsComponent {
  transferForm: FormGroup;
  mintForm: FormGroup;
  burnForm: FormGroup;
  blacklistForm: FormGroup;
  
  connected$: Observable<boolean>;
  tokenData$: Observable<TokenData>;
  loading$: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private tokenService: TokenService,
    private walletService: WalletService
  ) {
    this.connected$ = this.walletService.connected$;
    this.tokenData$ = this.tokenService.tokenData$;
    this.loading$ = this.tokenService.loading$;

    this.transferForm = this.fb.group({
      recipient: ['', [Validators.required, Validators.pattern(/^0x[a-fA-F0-9]{40}$/)]],
      amount: ['', [Validators.required, Validators.min(0.0001)]]
    });

    this.mintForm = this.fb.group({
      to: [''],
      amount: ['', [Validators.required, Validators.min(0.0001)]]
    });

    this.burnForm = this.fb.group({
      from: [''],
      amount: ['', [Validators.required, Validators.min(0.0001)]]
    });

    this.blacklistForm = this.fb.group({
      address: ['', [Validators.required, Validators.pattern(/^0x[a-fA-F0-9]{40}$/)]]
    });
  }

  async onTransfer(): Promise<void> {
    if (this.transferForm.valid) {
      const { recipient, amount } = this.transferForm.value;
      try {
        await this.tokenService.transfer({ recipient, amount });
        this.transferForm.reset();
      } catch (error) {
        console.error('Transfer failed:', error);
      }
    }
  }

  async onMint(): Promise<void> {
    if (this.mintForm.valid) {
      const { to, amount } = this.mintForm.value;
      try {
        await this.tokenService.mint({ to, amount });
        this.mintForm.reset();
      } catch (error) {
        console.error('Mint failed:', error);
      }
    }
  }

  async onBurn(): Promise<void> {
    if (this.burnForm.valid) {
      const { from, amount } = this.burnForm.value;
      try {
        await this.tokenService.burn({ from, amount });
        this.burnForm.reset();
      } catch (error) {
        console.error('Burn failed:', error);
      }
    }
  }

  async onBlacklist(): Promise<void> {
    if (this.blacklistForm.valid) {
      const { address } = this.blacklistForm.value;
      try {
        await this.tokenService.blacklistAddress(address, true);
        this.blacklistForm.reset();
      } catch (error) {
        console.error('Blacklist failed:', error);
      }
    }
  }

  async onUnblacklist(): Promise<void> {
    if (this.blacklistForm.valid) {
      const { address } = this.blacklistForm.value;
      try {
        await this.tokenService.blacklistAddress(address, false);
        this.blacklistForm.reset();
      } catch (error) {
        console.error('Unblacklist failed:', error);
      }
    }
  }

  async onClearBlacklist(): Promise<void> {
    try {
      await this.tokenService.clearBlacklist();
    } catch (error) {
      console.error('Clear blacklist failed:', error);
    }
  }

  async onTogglePause(): Promise<void> {
    try {
      await this.tokenService.togglePause();
    } catch (error) {
      console.error('Toggle pause failed:', error);
    }
  }
}
