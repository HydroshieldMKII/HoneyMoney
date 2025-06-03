import { Component, OnInit } from '@angular/core';
import { BlockchainService, BlockData, DecodedTransaction } from '../../services/blockchain.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-blockchain-viewer',
  templateUrl: './blockchain-viewer.html'
})
export class BlockchainViewerComponent implements OnInit {
  blocks$: Observable<BlockData[]>;
  currentSlide = 0;

  constructor(private blockchainService: BlockchainService) {
    this.blocks$ = this.blockchainService.blocks$;
  }

  ngOnInit(): void {
    this.blockchainService.loadBlocks();
  }

  decodeTransaction(block: BlockData): DecodedTransaction {
    return this.blockchainService.decodeTransaction(block);
  }

  nextSlide(): void {
    this.currentSlide++;
  }

  prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}
