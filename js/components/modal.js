class Modal {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.title = document.getElementById('modalTitle');
        this.body = document.getElementById('modalBody');
        this.footer = document.getElementById('modalFooter');
        
        document.getElementById('modalClose').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this._closeOnOverlay) this.close();
        });
    }

    open(options) {
        const { title, content, footer, size = 'medium', closeOnOverlay = false } = options;
        
        this.title.textContent = title || '';
        this.body.innerHTML = content || '';
        this.footer.innerHTML = footer || '';
        
        this.modal.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
        if (size === 'small') this.modal.classList.add('modal-sm');
        if (size === 'large') this.modal.classList.add('modal-lg');
        if (size === 'xlarge') this.modal.classList.add('modal-xl');
        
        this._closeOnOverlay = closeOnOverlay;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const firstInput = this.body.querySelector('input, select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    setContent(content) {
        this.body.innerHTML = content;
    }

    setFooter(footer) {
        this.footer.innerHTML = footer;
    }
}

window.Modal = Modal;
window.modal = new Modal();
