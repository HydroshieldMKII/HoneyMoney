import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { WalletDetails } from './wallet-details/wallet-details';
import { ContractDetails } from './contract-details/contract-details';



@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    WalletDetails,
    ContractDetails
  ],
  templateUrl: './app.html'
})

export class App {
}
