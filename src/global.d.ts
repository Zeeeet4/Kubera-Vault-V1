interface Chart {
  new(canvas: HTMLCanvasElement, config: Record<string, unknown>): { destroy: () => void };
}
declare const Chart: Chart;

interface Window {
  escapeHtml: (str: string | null | undefined) => string;
  preciseRound: (num: number, decimals?: number) => number;
  preciseSum: (arr: (string | number)[]) => number;
  generateSiglas: (title: string | null | undefined) => string;
  generateAutoCode: (entry?: { id?: number } | null) => string;
  validatePositiveNumber: (value: string | number, fieldName: string) => number | null;

  DB: import('./lib/db').DB;
  store: import('./lib/store').Store;
  router: import('./lib/router').Router;
  modal: import('./components/modal').Modal;
  toast: import('./components/toast').Toast;
  Forms: typeof import('./components/forms');

  _isSubmitting: boolean;
  _chartInstances: Record<string, { destroy: () => void }>;
  preventSubmit: () => boolean;
  releaseSubmit: () => void;
  registerChart: (key: string, chartInstance: { destroy: () => void }) => void;
  destroyAllCharts: () => void;

  renderDashboard?: () => void;
  exportPageData?: (page: string, format: string) => void;
  toggleExportMenu?: (btn: HTMLElement) => void;
  openEntryModal?: () => void;
  openExpenseModal?: () => void;
  saveEntry?: () => void;
  saveExpense?: () => void;
  setView?: (view: string) => void;
  setupFormListeners?: () => void;
  applyNomenclatureCode?: (code: string) => void;
  exportAllData?: () => void;
}

declare module 'chart.js' {
  interface Chart {
    destroy(): void;
  }
}
