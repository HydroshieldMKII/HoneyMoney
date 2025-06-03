import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  
  info(message: string, duration?: number | string): string | number {
    if (duration === 0) {
      // Return toast ID for persistent toasts
      return toast.info(message, {
        duration: Infinity,
      });
    }
    
    toast.info(message, {
      duration: typeof duration === 'number' ? duration : 4000,
    });
    
    return '';
  }

  success(message: string, description?: string): void {
    toast.success(message, {
      description,
      duration: 4000,
    });
  }

  error(message: string, description?: string): void {
    toast.error(message, {
      description,
      duration: 6000, // Longer duration for errors
    });
  }

  warning(message: string, description?: string): void {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  }

  // Method to remove/dismiss a toast
  remove(toastId: string | number): void {
    toast.dismiss(toastId);
  }

  // Method for custom toast with action
  showWithAction(message: string, options: {
    description?: string;
    actionLabel?: string;
    actionCallback?: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
  }): void {
    const toastFn = options.type ? toast[options.type] : toast;
    
    toastFn(message, {
      description: options.description,
      action: options.actionLabel && options.actionCallback ? {
        label: options.actionLabel,
        onClick: options.actionCallback,
      } : undefined,
      duration: 4000,
    });
  }

  // Method for loading toast (useful for blockchain operations)
  loading(message: string, description?: string): string | number {
    return toast.loading(message, {
      description,
    });
  }

  // Method to dismiss a loading toast
  dismiss(toastId: string | number): void {
    toast.dismiss(toastId);
  }

  // Method to update a loading toast to success/error
  updateToast(toastId: string | number, message: string, type: 'success' | 'error', description?: string): void {
    toast.dismiss(toastId);
    
    if (type === 'success') {
      this.success(message, description);
    } else {
      this.error(message, description);
    }
  }
}
