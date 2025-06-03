import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1050">
      <div 
        *ngFor="let toast of toasts$ | async"
        class="toast show align-items-center"
        [ngClass]="getToastClass(toast.type)"
        role="alert"
      >
        <div class="d-flex">
          <div class="toast-body" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 300px; white-space: normal;">
            {{ toast.message }}
          </div>
          <button 
            type="button" 
            class="btn-close me-2 m-auto" 
            (click)="removeToast(toast.id)"
            aria-label="Close"
          ></button>
        </div>
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
      info: 'text-bg-primary',
      success: 'text-bg-success',
      error: 'text-bg-danger',
      warning: 'text-bg-warning'
    };
    return classes[type] || 'text-bg-secondary';
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
