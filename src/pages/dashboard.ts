import { store } from '../lib/store';
import { db } from '../lib/db';
import { router } from '../lib/router';
import { modal } from '../components/modal';
import { toast } from '../components/toast';
import { escapeHtml, preciseRound, generateSiglas, generateAutoCode, validatePositiveNumber } from '../lib/utils';
import { createEntryForm, createExpenseForm } from '../components/forms';
import type { Entry, Expense } from '../lib/types';

let _showAllTx = false;

function renderDashboard(): void {
  const content = document.getElementById('contentArea')!;
  const totals = store.calculateTotals();
  const period = store.getViewPeriod();
  const currency = (store.state.settings.currency as string) || 'USD';
  const expensesByCategory = store.getExpensesByCategory();
  const debts = store.state.debts;
  const cards = store.state.creditCards;

  const categoryData = Object.entries(expensesByCategory).map(([catId, data]) => {
    const cat = store.getCategoryInfo(catId);
    return { ...cat, ...data };
  }).sort((a, b) => b.total - a.total);

  const totalDebtInterest = preciseRound(debts.reduce((sum, d) => {
    if (d.interestRate && d.currentBalance) {
      return sum + (d.currentBalance * d.interestRate / 100);
    }
    return sum;
  }, 0), 2);

  const totalCardDebt = preciseRound(cards.reduce((sum, c) => sum + (c.currentDebt || 0), 0), 2);
  const totalCardFees = preciseRound(cards.reduce((sum, c) => sum + (c.autoFee || 0), 0), 2);
  const totalInstallments = store.state.expenses.filter(e => e.isInstallment).length;
  const totalRecurring = store.state.entries.filter(e => e.recurring).length;
  const avgInstallment = preciseRound(
    store.state.expenses.filter(e => e.isInstallment).reduce((sum, e) => sum + (e.amount || 0), 0) /
    (totalInstallments || 1), 2
  );
  const totalDebtWithInterest = preciseRound(totals.totalDebt + totalDebtInterest, 2);
  const totalCardCost = preciseRound(totalCardDebt + totalCardFees * 12, 2);

  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 class="page-title-main">Dashboard</h1>
            <p class="page-description">${escapeHtml(period.label)}</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" data-action="open-entry-modal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Entrada
            </button>
            <button class="btn btn-danger" data-action="open-expense-modal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Gasto
            </button>
            <div class="export-menu">
              <button class="btn btn-secondary" data-action="toggle-export">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Exportar
              </button>
              <div class="export-dropdown">
                <button data-action="export-json">Exportar JSON</button>
                <button data-action="export-csv">Exportar CSV</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="kpi-cards">
        ${renderStatCard('Balance del Período', (totals.totalBalance >= 0 ? '+' : '') + store.formatCurrency(totals.totalBalance, currency), totals.totalBalance >= 0 ? 'var(--income-color)' : 'var(--expense-color)', true)}
        ${renderStatCard('Ingresos', '+' + store.formatCurrency(totals.totalIncome, currency), 'var(--income-color)', true)}
        ${renderStatCard('Gastos', '-' + store.formatCurrency(totals.totalExpenses, currency), 'var(--expense-color)', true)}
        ${renderSavingsCard(totals.savingsRate)}
      </div>

      <div class="dashboard-grid">
        ${renderStatCard('Patrimonio Neto', (totals.netWorth >= 0 ? '+' : '') + store.formatCurrency(totals.netWorth, currency), totals.netWorth >= 0 ? 'var(--income-color)' : 'var(--expense-color)', true)}
        ${renderStatCard('Deuda Total', store.formatCurrency(totals.totalDebt, currency), 'var(--debt-color)', true)}
        ${renderStatCard('Cuentas', store.formatCurrency(totals.totalAccounts, currency), '', false)}
        ${renderStatCard('Inversiones', store.formatCurrency(totals.totalInvestments, currency), 'var(--investment-color)', true)}
      </div>

      <div class="card" style="margin-bottom: 32px;">
        <div class="card-header"><h3 class="card-title">Resumen de Deudas y Obligaciones</h3></div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
          ${renderKpi('Deudas pendientes', String(debts.length))}
          ${renderKpi('Total con intereses', store.formatCurrency(totalDebtWithInterest, currency), 'var(--debt-color)')}
          ${renderKpi('Intereses anuales est.', store.formatCurrency(totalDebtInterest, currency), 'var(--expense-color)')}
          ${renderKpi('Deuda tarjetas', store.formatCurrency(totalCardDebt, currency))}
          ${renderKpi('Cuotas anuales tarjetas', store.formatCurrency(totalCardFees * 12, currency))}
          ${renderKpi('Costo total tarjetas/año', store.formatCurrency(totalCardCost, currency), 'var(--expense-color)')}
          ${renderKpi('Cuotas activas', String(totalInstallments))}
          ${renderKpi('Entradas recurrentes', String(totalRecurring))}
          ${renderKpi('Promedio cuota', totalInstallments > 0 ? store.formatCurrency(avgInstallment, currency) : '-')}
        </div>
      </div>

      <div class="charts-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Gastos por Categoría</h3></div>
          <div class="chart-container"><canvas id="expensesChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Resumen Financiero</h3></div>
          <div class="chart-container"><canvas id="incomeExpenseChart"></canvas></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">Transacciones Recientes</h3></div>
        ${renderTransactionsSection(period, currency)}
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const observer = new MutationObserver(() => {
      const canvas = document.getElementById('expensesChart');
      if (canvas) {
        observer.disconnect();
        initCharts(categoryData);
      }
    });
    observer.observe(document.getElementById('contentArea')!, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); initCharts(categoryData); }, 500);
  });

  _showAllTx = false;
}

function renderTransactionsSection(period: { start: string; end: string; label: string }, currency: string): string {
  const allTx = [
    ...store.getFilteredData(store.state.entries, period).map(e => ({ ...e, type: 'income' as const })),
    ...store.getFilteredData(store.state.expenses, period).map(e => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allTx.length === 0) {
    return `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2h2a2 2 0 012-2"/></svg>
        <h4 class="empty-state-title">Sin transacciones</h4>
        <p class="empty-state-description">¡Agrega tu primera entrada o gasto!</p>
      </div>`;
  }

  const TX_PAGE_SIZE = 20;
  const TX_THRESHOLD = 50;
  const shouldPaginate = allTx.length > TX_THRESHOLD;
  const displayTx = _showAllTx || !shouldPaginate ? allTx : allTx.slice(0, TX_PAGE_SIZE);

  return `
    <div class="transactions-list">
      ${displayTx.map(t => `
        <div class="transaction-item">
          <div class="transaction-icon ${t.type}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${t.type === 'income' ? '<path d="M12 2v20M17 7l-5-5-5 5"/>' : '<path d="M12 22V2M7 17l5 5 5-5"/>'}
            </svg>
          </div>
          <div class="transaction-details">
            <div class="transaction-title">${t.nomenclatureCode ? `<span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); margin-right: 8px;">[${escapeHtml(t.nomenclatureCode)}]</span>` : ''}${escapeHtml(t.title)}</div>
            <div class="transaction-meta">
              <span>${escapeHtml(store.getCategoryInfo(t.category).name)}</span>
              <span>•</span>
              <span>${store.formatDate(t.date)}</span>
            </div>
          </div>
          <div class="transaction-amount ${t.type}">
            ${t.type === 'income' ? '+' : '-'}${store.formatCurrency(t.amount, currency)}
          </div>
        </div>
      `).join('')}
    </div>
    ${shouldPaginate && !_showAllTx ? `
      <div style="padding: 16px; text-align: center;">
        <button class="btn btn-secondary" data-action="show-all-tx">
          Ver más (${allTx.length - TX_PAGE_SIZE} restantes)
        </button>
      </div>
    ` : ''}
    ${_showAllTx && shouldPaginate ? `
      <div style="padding: 16px; text-align: center;">
        <span style="color: var(--text-muted); font-size: var(--text-sm);">Mostrando ${allTx.length} transacciones</span>
      </div>
    ` : ''}
  `;
}

function renderStatCard(label: string, value: string, color: string, isLarge: boolean): string {
  return `
    <div class="card stat-card">
      <span class="stat-label">${escapeHtml(label)}</span>
      <span class="stat-value ${isLarge ? 'stat-value-lg' : ''}" style="${color ? `color: ${color}` : ''}">${value}</span>
    </div>
  `;
}

function renderSavingsCard(rate: number): string {
  const cls = rate >= 20 ? 'success' : rate >= 0 ? 'warning' : 'danger';
  return `
    <div class="card stat-card">
      <span class="stat-label">Savings Rate</span>
      <span class="stat-value stat-value-lg">${rate.toFixed(1)}%</span>
      <div class="progress-bar" style="margin-top: 8px;">
        <div class="progress-fill ${cls}" style="width: ${Math.max(0, Math.min(100, rate))}%"></div>
      </div>
    </div>
  `;
}

function renderKpi(label: string, value: string, color?: string): string {
  return `
    <div>
      <div style="font-size: var(--text-sm); color: var(--text-muted); margin-bottom: 4px;">${escapeHtml(label)}</div>
      <div class="stat-value stat-value-lg" style="${color ? `color: ${color}` : ''}">${value}</div>
    </div>
  `;
}

function initCharts(
  categoryData: Array<{ name: string; total: number; color?: string }>,
): void {
  const destroyAllCharts = (window as unknown as { destroyAllCharts?: () => void }).destroyAllCharts;
  if (destroyAllCharts) destroyAllCharts();

  const chartColors = ['#DC2626', '#EF4444', '#F87171', '#F97316', '#FB923C', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E', '#A85100', '#78350F'];

  const expensesCanvas = document.getElementById('expensesChart') as HTMLCanvasElement | null;
  if (expensesCanvas && categoryData.length > 0) {
    const instance = new Chart(expensesCanvas, {
      type: 'doughnut',
      data: {
        labels: categoryData.map(c => c.name),
        datasets: [{
          data: categoryData.map(c => c.total),
          backgroundColor: categoryData.map((c, i) => c.color || chartColors[i % chartColors.length]),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { family: 'Raleway', size: 12 }, padding: 12, usePointStyle: true } },
        },
      },
    });
    (window as unknown as { registerChart?: (k: string, c: { destroy: () => void }) => void }).registerChart?.('expensesChart', instance);
  }

  const months: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleDateString('es-ES', { month: 'short' }));

    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entries = store.getFilteredData(store.state.entries, { start: monthStr + '-01', end: monthStr + '-31', label: '' });
    incomeData.push(entries.reduce((s, e) => s + (e.amount || 0), 0));

    const exp = store.getFilteredData(store.state.expenses, { start: monthStr + '-01', end: monthStr + '-31', label: '' });
    expenseData.push(exp.reduce((s, e) => s + (e.amount || 0), 0));
  }

  const incomeExpenseCanvas = document.getElementById('incomeExpenseChart') as HTMLCanvasElement | null;
  if (incomeExpenseCanvas) {
    const instance = new Chart(incomeExpenseCanvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Ingresos', data: incomeData, backgroundColor: '#059669' },
          { label: 'Gastos', data: expenseData, backgroundColor: '#DC2626' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Raleway', size: 12 }, padding: 16, usePointStyle: true } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#E5E7EB' }, beginAtZero: true } },
      },
    });
    (window as unknown as { registerChart?: (k: string, c: { destroy: () => void }) => void }).registerChart?.('incomeExpenseChart', instance);
  }
}

function toggleExportMenu(): void {
  const dropdown = document.querySelector('.export-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('show');
  if (dropdown.classList.contains('show')) {
    setTimeout(() => {
      document.addEventListener('click', () => dropdown.classList.remove('show'), { once: true });
    }, 0);
  }
}

function exportPageData(page: string, format: 'json' | 'csv'): void {
  const period = store.getViewPeriod();
  let data: Record<string, unknown>[] = [];
  let filename = '';

  switch (page) {
    case 'dashboard': {
      const entries = store.getFilteredData(store.state.entries, period);
      const expenses = store.getFilteredData(store.state.expenses, period);
      data = [...entries.map(e => ({ ...e, type: 'income' })), ...expenses.map(e => ({ ...e, type: 'expense' }))];
      filename = `kubera-vault-transactions-${period.start}.${format}`;
      break;
    }
    default: {
      const entries = store.state.entries;
      data = entries as unknown as Record<string, unknown>[];
      filename = `kubera-vault-data.${format}`;
    }
  }

  function sanitizeCsvValue(val: unknown): string {
    const str = String(val ?? '');
    const needsQuote = str.includes(',') || str.includes('"') || str.includes('\n');
    const sanitized = str.length > 0 && ['=', '+', '-', '@'].includes(str[0]!)
      ? `'${str}`
      : str;
    if (needsQuote) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  }

  let content: string;
  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
  } else {
    content = '\uFEFF';
    if (data.length > 0) {
      const firstRow = data[0];
      if (firstRow) {
        const headers = Object.keys(firstRow).filter(k => k !== 'createdAt' && k !== 'updatedAt');
        content += headers.join(',') + '\n';
        data.forEach(row => {
          content += headers.map(h => sanitizeCsvValue(row[h])).join(',') + '\n';
        });
      }
    }
  }

  const blob = new Blob([content], format === 'json' ? { type: 'application/json' } : { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  document.querySelector('.export-dropdown')?.classList.remove('show');
  toast.success(`Exportado como ${format.toUpperCase()}`);
}

function openEntryModal(): void {
  modal.open({
    title: 'Nueva Entrada',
    content: createEntryForm(),
    footer: `<button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-entry">Guardar</button>`,
  });
}

function openExpenseModal(): void {
  modal.open({
    title: 'Nuevo Gasto',
    content: createExpenseForm(),
    footer: `<button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-expense">Guardar</button>`,
  });
}

async function saveEntryHandler(): Promise<void> {
  const win = window as unknown as { preventSubmit?: () => boolean; releaseSubmit?: () => void; _isSubmitting?: boolean };
  if (win.preventSubmit?.()) return;

  const form = document.getElementById('entryForm') as HTMLFormElement | null;
  if (!form) return;
  if (!form.checkValidity()) { form.reportValidity(); win.releaseSubmit?.(); return; }

  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData) as Record<string, string>;
  const validatedAmount = validatePositiveNumber(rawData.amount ?? '0', 'Monto');
  if (validatedAmount === null) { win.releaseSubmit?.(); return; }

  const data: Partial<Entry> = {
    title: rawData.title ?? '',
    amount: validatedAmount,
    date: rawData.date ?? '',
    category: rawData.category ?? '',
    accountId: parseInt(rawData.accountId || '0'),
    nomenclatureCode: rawData.nomenclatureCode ?? '',
    nomenclatureMode: rawData.nomenclatureMode || 'manual',
    linkedDebtId: rawData.linkedDebtId ? parseInt(rawData.linkedDebtId) : undefined,
    notes: rawData.notes ?? '',
    recurring: rawData.recurring === 'on',
    recurrenceFrequency: rawData.recurrenceFrequency ?? '',
  };

  const mode = data.nomenclatureMode;
  if (mode === 'auto-siglas') {
    data.nomenclatureCode = generateSiglas(data.title ?? '') + '-' + generateAutoCode(data as { id?: number });
  } else if (mode === 'hybrid') {
    data.nomenclatureCode = generateSiglas(data.title ?? '') + '-' + (data.nomenclatureCode || '') + '-' + generateAutoCode(data as { id?: number });
  }

  if (data.linkedDebtId) { /* keep as number */ }
  if (data.accountId) { /* keep as number */ }

  try {
    await db.dbAdd('entries', data as Record<string, unknown>);
    await store.refreshEntries();
    if (data.nomenclatureCode) {
      await db.saveNomenclatureCode(data.nomenclatureCode, data.title ?? '', data.category ?? '', 'income');
    }
    modal.close();
    toast.success('Entrada guardada');
    router.navigate(router.getCurrentPage(), []);
  } catch {
    toast.error('Error al guardar');
  } finally {
    win.releaseSubmit?.();
  }
}

async function saveExpenseHandler(): Promise<void> {
  const win = window as unknown as { preventSubmit?: () => boolean; releaseSubmit?: () => void; _isSubmitting?: boolean };
  if (win.preventSubmit?.()) return;

  const form = document.getElementById('expenseForm') as HTMLFormElement | null;
  if (!form) return;
  if (!form.checkValidity()) { form.reportValidity(); win.releaseSubmit?.(); return; }

  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData) as Record<string, string>;
  const validatedAmount = validatePositiveNumber(rawData.amount ?? '0', 'Monto');
  if (validatedAmount === null) { win.releaseSubmit?.(); return; }

  const data: Partial<Expense> = {
    title: rawData.title ?? '',
    amount: validatedAmount,
    date: rawData.date ?? '',
    category: rawData.category ?? '',
    accountId: parseInt(rawData.accountId || '0'),
    isInstallment: rawData.isInstallment === 'on',
    linkedDebtId: rawData.linkedDebtId ? parseInt(rawData.linkedDebtId) : undefined,
    beneficiary: rawData.beneficiary ?? '',
    notes: rawData.notes ?? '',
  };

  if (data.isInstallment) {
    data.installmentTotal = parseInt(rawData.installmentTotal || '1') || 1;
    data.installmentCurrent = parseInt(rawData.installmentCurrent || '1') || 1;
  }

  try {
    await db.dbAdd('expenses', data as Record<string, unknown>);

    if (data.linkedDebtId) {
      const debt = await db.dbGet<{ currentBalance: number }>('debts', data.linkedDebtId);
      if (debt) {
        const newBalance = Math.max(0, parseFloat(String(debt.currentBalance)) - validatedAmount);
        await db.dbPut('debts', { ...debt, currentBalance: newBalance });
        await store.refreshDebts();
      }
    }

    await store.refreshExpenses();
    modal.close();
    toast.success('Gasto guardado');
    router.navigate(router.getCurrentPage(), []);
  } catch {
    toast.error('Error al guardar');
  } finally {
    win.releaseSubmit?.();
  }
}

function setupDashboardActions(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('[data-action]') as HTMLElement | null;
    if (!btn) return;

    switch (btn.dataset.action) {
      case 'open-entry-modal':
        openEntryModal();
        break;
      case 'open-expense-modal':
        openExpenseModal();
        break;
      case 'toggle-export':
        toggleExportMenu();
        break;
      case 'export-json':
        exportPageData('dashboard', 'json');
        break;
      case 'export-csv':
        exportPageData('dashboard', 'csv');
        break;
      case 'close-modal':
        modal.close();
        break;
      case 'save-entry':
        saveEntryHandler();
        break;
      case 'save-expense':
        saveExpenseHandler();
        break;
      case 'show-all-tx':
        _showAllTx = true;
        renderDashboard();
        break;
    }
  });
}

export function registerDashboard(): void {
  router.register('dashboard', renderDashboard);
  setupDashboardActions();
}
