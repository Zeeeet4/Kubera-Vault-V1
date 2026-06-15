import type { AppState, PeriodInfo, Totals, CategoryTotals, Account, Entry, Expense, Debt, CreditCard, Investment, Category, Reminder } from './types';
import { db } from './db';
import { preciseRound } from './utils';

type Listener = (state: AppState) => void;

class Store {
  state: AppState = {
    currentPage: 'dashboard',
    currentView: 'month',
    currentDate: new Date(),
    accounts: [],
    entries: [],
    expenses: [],
    debts: [],
    creditCards: [],
    investments: [],
    categories: [],
    reminders: [],
    settings: {},
    isLoading: true,
  };

  private listeners: Listener[] = [];
  private totalsCache: { periodKey: string; totals: Totals } | null = null;
  private recentTxCache: { key: string; transactions: Array<(Entry | Expense) & { type: 'income' | 'expense' }> } | null = null;

  getCurrentMonth(): string {
    const year = this.state.currentDate.getFullYear();
    const month = String(this.state.currentDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getViewPeriod(): PeriodInfo {
    const currentView = this.state.currentView || 'month';
    const currentDate = this.state.currentDate || new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start: startOfWeek.toISOString().split('T')[0] ?? '',
        end: endOfWeek.toISOString().split('T')[0] ?? '',
        label: `Semana del ${startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
      };
    } else if (currentView === 'year') {
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
        label: `Año ${year}`,
      };
    }
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      start: start.toISOString().split('T')[0] ?? '',
      end: end.toISOString().split('T')[0] ?? '',
      label: start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners = [...this.listeners, listener];
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.totalsCache = null;
    this.recentTxCache = null;
    this.notify();
  }

  setView(view: 'week' | 'month' | 'year'): void {
    this.setState({ currentView: view });
  }

  setCurrentDate(date: Date): void {
    this.setState({ currentDate: date });
  }

  navigatePeriod(direction: number): void {
    const { currentView, currentDate } = this.state;
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const d = currentDate.getDate();
    let newDate: Date;

    if (currentView === 'week') {
      newDate = new Date(y, m, d + direction * 7);
    } else if (currentView === 'year') {
      newDate = new Date(y + direction, m, d);
    } else {
      newDate = new Date(y, m + direction, d);
    }

    this.setState({ currentDate: newDate });
  }

  async loadAllData(): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const [accounts, entries, expenses, debts, creditCards, investments, categories, reminders] = await Promise.all([
        db.dbGetAll<Account>('accounts'),
        db.dbGetAll<Entry>('entries'),
        db.dbGetAll<Expense>('expenses'),
        db.dbGetAll<Debt>('debts'),
        db.dbGetAll<CreditCard>('creditCards'),
        db.dbGetAll<Investment>('investments'),
        db.dbGetAll<Category>('categories'),
        db.dbGetAll<Reminder>('reminders'),
      ]);

      const customCats = await db.getCustomCategories();
      const mergedCategories = [...categories, ...customCats];
      const settingsData = await db.dbGetAll<{ key: string; value: string | number | boolean }>('settings');
      const settings: Record<string, string | number | boolean> = {};
      settingsData.forEach(s => { settings[s.key] = s.value; });

      this.setState({
        accounts, entries, expenses, debts, creditCards,
        investments, categories: mergedCategories, reminders, settings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      this.setState({ isLoading: false });
    }
  }

  async refreshAccounts(): Promise<void> {
    const accounts = await db.dbGetAll<Account>('accounts');
    this.setState({ accounts });
  }

  async refreshEntries(): Promise<void> {
    const entries = await db.dbGetAll<Entry>('entries');
    this.setState({ entries });
    await this.updateAccountBalances();
  }

  async refreshExpenses(): Promise<void> {
    const expenses = await db.dbGetAll<Expense>('expenses');
    this.setState({ expenses });
    await this.updateAccountBalances();
  }

  async refreshDebts(): Promise<void> {
    const debts = await db.dbGetAll<Debt>('debts');
    this.setState({ debts });
  }

  async refreshCreditCards(): Promise<void> {
    const creditCards = await db.dbGetAll<CreditCard>('creditCards');
    this.setState({ creditCards });
  }

  async refreshInvestments(): Promise<void> {
    const investments = await db.dbGetAll<Investment>('investments');
    this.setState({ investments });
  }

  async refreshCategories(): Promise<void> {
    try {
      const categories = await db.dbGetAll<Category>('categories');
      const customCats = await db.getCustomCategories();
      this.setState({ categories: [...categories, ...customCats] });
    } catch (err) {
      console.error('refreshCategories error:', err);
    }
  }

  async refreshReminders(): Promise<void> {
    const reminders = await db.dbGetAll<Reminder>('reminders');
    this.setState({ reminders });
  }

  async refreshAll(): Promise<void> {
    try {
      const [accounts, entries, expenses, debts, creditCards, investments, categories, reminders, settingsData] = await Promise.all([
        db.dbGetAll<Account>('accounts'),
        db.dbGetAll<Entry>('entries'),
        db.dbGetAll<Expense>('expenses'),
        db.dbGetAll<Debt>('debts'),
        db.dbGetAll<CreditCard>('creditCards'),
        db.dbGetAll<Investment>('investments'),
        db.dbGetAll<Category>('categories'),
        db.dbGetAll<Reminder>('reminders'),
        db.dbGetAll<{ key: string; value: string | number | boolean }>('settings'),
      ]);
      const customCats = await db.getCustomCategories();
      const mergedCats = [...categories, ...customCats];
      const settings: Record<string, string | number | boolean> = {};
      settingsData.forEach(s => { settings[s.key] = s.value; });
      this.setState({ accounts, entries, expenses, debts, creditCards, investments, categories: mergedCats, reminders, settings });
    } catch (err) {
      console.error('refreshAll error:', err);
    }
  }

  async updateAccountBalances(): Promise<void> {
    const accounts = await db.dbGetAll<Account>('accounts');
    const entries = await db.dbGetAll<Entry>('entries');
    const expenses = await db.dbGetAll<Expense>('expenses');

    for (const account of accounts) {
      const accountEntries = entries.filter(e => e.accountId === account.id);
      const accountExpenses = expenses.filter(e => e.accountId === account.id);
      const totalIn = preciseRound(accountEntries.reduce((sum, e) => sum + (e.amount || 0), 0), 2);
      const totalOut = preciseRound(accountExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), 2);
      const baseBalance = account.baseBalance || 0;
      const calculatedBalance = preciseRound(baseBalance + totalIn - totalOut, 2);

      if (Math.abs(calculatedBalance - (account.balance || 0)) > 0.01) {
        await db.dbPut('accounts', { ...account, balance: calculatedBalance });
      }
    }

    const updatedAccounts = await db.dbGetAll<Account>('accounts');
    this.setState({ accounts: updatedAccounts });
  }

  getFilteredData<T extends { date: string }>(data: T[], period?: PeriodInfo | null): T[] {
    if (!period) {
      period = this.getViewPeriod();
    }
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= new Date(period!.start) && itemDate <= new Date(period!.end);
    });
  }

  calculateTotals(period?: PeriodInfo | null): Totals {
    const p = period || this.getViewPeriod();
    const periodKey = `${p.start}-${p.end}`;
    if (this.totalsCache && this.totalsCache.periodKey === periodKey) {
      return this.totalsCache.totals;
    }

    const { entries, expenses, accounts, debts, investments } = this.state;
    const filteredEntries = this.getFilteredData(entries, p);
    const filteredExpenses = this.getFilteredData(expenses, p);

    const totalIncome = preciseRound(filteredEntries.reduce((sum, e) => sum + (e.amount || 0), 0), 2);
    const totalExpenses = preciseRound(filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), 2);
    const totalBalance = preciseRound(totalIncome - totalExpenses, 2);
    const savingsRate = totalIncome > 0 ? preciseRound(((totalIncome - totalExpenses) / totalIncome) * 100, 1) : 0;

    const totalDebt = preciseRound(debts.reduce((sum, d) => sum + (d.currentBalance || 0), 0), 2);
    const totalAccounts = preciseRound(accounts.reduce((sum, a) => sum + (a.balance || 0), 0), 2);
    const totalInvestments = preciseRound(investments.reduce((sum, i) => sum + (i.currentValue || 0), 0), 2);
    const totalAssets = preciseRound(totalAccounts + totalInvestments, 2);
    const netWorth = preciseRound(totalAssets - totalDebt, 2);

    const totals: Totals = { totalIncome, totalExpenses, totalBalance, savingsRate, totalDebt, totalAccounts, totalInvestments, totalAssets, netWorth };
    this.totalsCache = { periodKey, totals };
    return totals;
  }

  getEntriesByCategory(): CategoryTotals {
    const period = this.getViewPeriod();
    const filtered = this.getFilteredData(this.state.entries, period);
    const byCategory: CategoryTotals = {};
    filtered.forEach(entry => {
      const existing = byCategory[entry.category];
      byCategory[entry.category] = existing
        ? {
            total: existing.total + (entry.amount || 0),
            count: existing.count + 1,
            items: [...existing.items, entry],
          }
        : { total: entry.amount || 0, count: 1, items: [entry] };
    });
    return byCategory;
  }

  getExpensesByCategory(): CategoryTotals {
    const period = this.getViewPeriod();
    const filtered = this.getFilteredData(this.state.expenses, period);
    const byCategory: CategoryTotals = {};
    filtered.forEach(expense => {
      const existing = byCategory[expense.category];
      byCategory[expense.category] = existing
        ? {
            total: existing.total + (expense.amount || 0),
            count: existing.count + 1,
            items: [...existing.items, expense],
          }
        : { total: expense.amount || 0, count: 1, items: [expense] };
    });
    return byCategory;
  }

  getRecentTransactions(limit = 5): Array<(Entry | Expense) & { type: 'income' | 'expense' }> {
    const cacheKey = `limit-${limit}`;
    if (this.recentTxCache && this.recentTxCache.key === cacheKey) {
      return this.recentTxCache.transactions;
    }
    const all = [
      ...this.state.entries.map(e => ({ ...e, type: 'income' as const })),
      ...this.state.expenses.map(e => ({ ...e, type: 'expense' as const })),
    ];
    const sorted = [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const transactions = sorted.slice(0, limit);
    this.recentTxCache = { key: cacheKey, transactions };
    return transactions;
  }

  formatCurrency(amount: number, currency = 'USD'): string {
    const info = db.getCurrencyByCode(currency);
    const preciseAmount = Math.round(Math.abs(amount) * 100) / 100;
    const formatted = preciseAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${info.symbol}${formatted}`;
  }

  formatCurrencyNoWrap(amount: number, currency = 'USD'): string {
    const info = db.getCurrencyByCode(currency);
    const preciseAmount = Math.round(Math.abs(amount) * 100) / 100;
    const formatted = preciseAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    });
    return `${info.symbol}${formatted}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  getMonthName(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year!), parseInt(month!) - 1)
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  getPreviousMonth(monthStr: string): string {
    const [yearStr, monthStr2] = monthStr.split('-');
    const date = new Date(parseInt(yearStr!), parseInt(monthStr2!) - 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  getNextMonth(monthStr: string): string {
    const [yearStr, monthStr2] = monthStr.split('-');
    const date = new Date(parseInt(yearStr!), parseInt(monthStr2!));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  getCategoryInfo(categoryId: string): { name: string; color: string } {
    return this.state.categories.find(c => c.id === categoryId) || { name: categoryId, color: '#6B7280' };
  }

  getAccountInfo(accountId: number): { name: string } {
    return this.state.accounts.find(a => a.id === accountId) || { name: 'Sin cuenta' };
  }
}

export const store = new Store();
