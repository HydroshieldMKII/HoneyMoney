import { Component, Input } from '@angular/core';
import {
  BrnProgressComponent,
  BrnProgressIndicatorComponent,
} from '@spartan-ng/brain/progress';
import { HlmProgressIndicatorDirective } from '@spartan-ng/helm/progress';

@Component({
    selector: 'app-blockchain-loading-progress',
    standalone: true,
    imports: [BrnProgressComponent, BrnProgressIndicatorComponent, HlmProgressIndicatorDirective],
    template: `
        <div class="w-full space-y-3 p-6 rounded-lg">
            <div class="text-center flex items-center justify-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <h4 class="font-medium text-lg">Updating Blockchain Data</h4>
            </div>
            
            <brn-progress hlm class='w-full h-3' aria-labelledby="loading-progress" [value]="progressPercentage">
                <brn-progress-indicator hlm />
            </brn-progress>
            
            <div class="flex justify-between text-xs text-gray-400">
                <span>{{ progressPercentage }}% Complete</span>
                <span>{{ currentBlock }}/{{ totalBlocks }} blocks</span>
            </div>
        </div>

        <hr class="my-4">
    `,
})
export class BlockchainLoadingProgressComponent {
    @Input() currentBlock: number = 0;
    @Input() totalBlocks: number = 1;

    get progressPercentage(): number {
        if (this.totalBlocks === 0) return 0;
        return Math.round((this.currentBlock / this.totalBlocks) * 100);
    }
}
