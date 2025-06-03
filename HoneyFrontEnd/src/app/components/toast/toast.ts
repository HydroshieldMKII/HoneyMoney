import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div 
        *ngFor="let toast of toasts$ | async"
        class="flex items-center justify-between min-w-80 max-w-md p-4 rounded-lg shadow-lg"
        [ngClass]="getToastClass(toast.type)"
        role="alert"
      >
        <div class="flex-1 text-sm font-medium break-words">
          {{ toast.message }}
        </div>
        <button 
          type="button" 
          class="ml-3 flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center text-lg font-bold leading-none" 
          (click)="removeToast(toast.id)"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  toasts$: Observable<Toast[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  getToastClass(type: Toast['type']): string {
    const classes = {
      info: 'bg-blue-500 text-white',
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-black',
      default: 'bg-gray-500 text-white'
    };
    return classes[type] || 'text-bg-secondary';
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
