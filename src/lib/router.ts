import { store } from './store';

type PageRenderer = () => void;

const REFRESH_MAP: Record<string, () => Promise<void>> = {
  accounts: () => store.refreshAccounts(),
  entries: () => store.refreshEntries(),
  expenses: () => store.refreshExpenses(),
  debts: () => store.refreshDebts(),
  creditCards: () => store.refreshCreditCards(),
  investments: () => store.refreshInvestments(),
  categories: () => store.refreshCategories(),
  reminders: () => store.refreshReminders(),
};

class Router {
  private routes: Record<string, PageRenderer> = {};
  currentPage = 'dashboard';

  register(page: string, renderFn: PageRenderer): void {
    this.routes[page] = renderFn;
  }

  showSkeleton(): void {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    contentArea.innerHTML = `
      <div class="skeleton-page">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton-grid">
          ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}
        </div>
        <div class="skeleton skeleton-chart"></div>
      </div>
    `;
  }

  async navigate(page: string, stores?: string[]): Promise<void> {
    const renderFn = this.routes[page];
    if (!renderFn) return;

    this.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', (item as HTMLElement).dataset.page === page);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', (item as HTMLElement).dataset.page === page);
    });

    const pageTitle = document.getElementById('pageTitle');
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', entries: 'Entradas', expenses: 'Salidas',
      accounts: 'Cuentas', debts: 'Deudas', cards: 'Tarjetas',
      investments: 'Inversiones', reports: 'Reportes', settings: 'Ajustes',
    };
    if (pageTitle) pageTitle.textContent = titles[page] || page;

    const win = window as unknown as { destroyAllCharts?: () => void };
    if (typeof win.destroyAllCharts === 'function') win.destroyAllCharts();

    const contentArea = document.getElementById('contentArea');

    const hasCachedData = store.state.entries.length > 0;
    const doNavigation = async (): Promise<void> => {
      const needsSkeleton = stores || !hasCachedData;
      if (needsSkeleton) this.showSkeleton();
      if (stores) {
        for (const key of stores) {
          await REFRESH_MAP[key]?.();
        }
      } else {
        await store.refreshAll();
      }
      renderFn();
      requestAnimationFrame(() => {
        if (contentArea) contentArea.style.opacity = '1';
      });
    };

    if (contentArea) contentArea.style.opacity = '0';

    if (document.startViewTransition) {
      await document.startViewTransition(() => doNavigation()).finished;
    } else {
      await doNavigation();
    }
  }

  getCurrentPage(): string {
    return this.currentPage;
  }
}

export const router = new Router();
