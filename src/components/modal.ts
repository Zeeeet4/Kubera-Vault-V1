interface ModalOptions {
  title: string;
  content: string;
  footer?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  closeOnOverlay?: boolean;
}

class Modal {
  private overlay: HTMLElement;
  private modal: HTMLElement;
  private title: HTMLElement;
  private body: HTMLElement;
  private footer: HTMLElement;
  private closeOnOverlay = false;

  constructor() {
    this.overlay = document.getElementById('modalOverlay')!;
    this.modal = document.getElementById('modal')!;
    this.title = document.getElementById('modalTitle')!;
    this.body = document.getElementById('modalBody')!;
    this.footer = document.getElementById('modalFooter')!;

    document.getElementById('modalClose')!.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && this.closeOnOverlay) this.close();
    });
  }

  open(options: ModalOptions): void {
    const { title, content, footer = '', size = 'medium', closeOnOverlay = false } = options;

    this.title.textContent = title;
    this.body.innerHTML = content;
    this.footer.innerHTML = footer;

    this.modal.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
    if (size === 'small') this.modal.classList.add('modal-sm');
    if (size === 'large') this.modal.classList.add('modal-lg');
    if (size === 'xlarge') this.modal.classList.add('modal-xl');

    this.closeOnOverlay = closeOnOverlay;
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    const firstInput = this.body.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => (firstInput as HTMLElement).focus(), 100);
  }

  close(): void {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  setContent(content: string): void {
    this.body.innerHTML = content;
  }

  setFooter(footer: string): void {
    this.footer.innerHTML = footer;
  }
}

export const modal = new Modal();
