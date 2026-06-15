import { escapeHtml } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

class Toast {
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('toastContainer')!;
  }

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons: Record<ToastType, string> = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    };

    toast.innerHTML = `
      <div class="toast-progress"></div>
      <div class="toast-content">
        ${icons[type] || icons.info}
        <span>${escapeHtml(message)}</span>
      </div>
    `;
    this.container.appendChild(toast);

    const progress = toast.querySelector('.toast-progress') as HTMLElement | null;
    if (progress) {
      progress.style.animation = `toastProgress ${duration}ms linear forwards`;
    }

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.2s ease-out reverse';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  success(message: string, duration?: number): void { this.show(message, 'success', duration); }
  error(message: string, duration?: number): void { this.show(message, 'error', duration); }
  warning(message: string, duration?: number): void { this.show(message, 'warning', duration); }
  info(message: string, duration?: number): void { this.show(message, 'info', duration); }

  withUndo(message: string, onUndo: () => void, duration = 5000): void {
    const toast = document.createElement('div');
    toast.className = 'toast info';
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>${escapeHtml(message)}</span><button class="toast-undo-btn" onclick="this.closest('.toast').remove();(${onUndo.toString()})()">Deshacer</button>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.2s ease-out reverse';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
}

export const toast = new Toast();
