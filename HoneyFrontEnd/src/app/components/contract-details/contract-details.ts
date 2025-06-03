import { Component } from '@angular/core';

import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';

import { HlmSpinnerComponent } from '@spartan-ng/helm/spinner';


@Component({
  selector: 'app-contract-details',
  imports: [
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective
  ],
  templateUrl: './contract-details.html',
  styleUrl: './contract-details.css'
})

export class ContractDetails {

}
