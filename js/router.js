class Router {
    constructor() {
        this.routes = {};
        this.currentPage = 'dashboard';
    }

    register(page, renderFn) {
        this.routes[page] = renderFn;
    }

    async navigate(page) {
        if (this.routes[page]) {
            if (window._isSubmitting) return;

            this.currentPage = page;
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.page === page);
            });
            document.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.page === page);
            });
            
            const pageTitle = document.getElementById('pageTitle');
            const titles = {
                dashboard: 'Dashboard',
                entries: 'Entradas',
                expenses: 'Salidas',
                accounts: 'Cuentas',
                debts: 'Deudas',
                cards: 'Tarjetas',
                investments: 'Inversiones',
                reports: 'Reportes',
                settings: 'Ajustes'
            };
            pageTitle.textContent = titles[page] || page;
            
            if (typeof window.destroyAllCharts === 'function') window.destroyAllCharts();
            await store.refreshAll();
            this.routes[page]();
        }
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

window.Router = Router;
window.router = new Router();
