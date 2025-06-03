import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { TokenService, TokenData } from '../../services/token.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-wallet-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Wallet Information222</h5>
      </div>
      <div class="card-body">
        <div class="row" *ngIf="connected$ | async">
          <div class="col-md-6">
            <p><strong>Address:</strong></p>
            <code class="d-block text-break">{{ address$ | async }}</code>
          </div>
          <div class="col-md-6" *ngIf="tokenData$ | async as tokenData">
            <p><strong>Balance:</strong> {{ tokenData.userBalance }} tokens</p>
            <p><strong>Total Supply:</strong> {{ tokenData.totalSupply }} tokens</p>
            <p><strong>Contract Status:</strong> 
              <span [class]="tokenData.isPaused ? 'text-danger' : 'text-success'">
                {{ tokenData.isPaused ? 'Paused' : 'Active' }}
              </span>
            </p>
          </div>
        </div>
        <div *ngIf="!(connected$ | async)" class="text-center">
          <p>Please connect your wallet to view information</p>
        </div>
      </div>
    </div>
  `
})
export class WalletInfoComponent {
  connected$: Observable<boolean>;
  address$: Observable<string>;
  tokenData$: Observable<TokenData>;

  constructor(
    private walletService: WalletService,
    private tokenService: TokenService
  ) {
    this.connected$ = this.walletService.connected$;
    this.address$ = this.walletService.address$;
    this.tokenData$ = this.tokenService.tokenData$;
  }
}
