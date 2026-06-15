import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../lib/store';
import type { Entry } from '../lib/types';

describe('Store', () => {
  beforeEach(() => {
    store.setState({
      accounts: [],
      entries: [],
      expenses: [],
      debts: [],
      creditCards: [],
      investments: [],
      categories: [],
      reminders: [],
      settings: { currency: 'USD' },
      currentView: 'month',
      currentDate: new Date('2025-01-15'),
    });
  });

  it('getCurrentMonth returns YYYY-MM format', () => {
    expect(store.getCurrentMonth()).toBe('2025-01');
  });

  it('calculateTotals returns correct values with no data', () => {
    const totals = store.calculateTotals();
    expect(totals.totalIncome).toBe(0);
    expect(totals.totalExpenses).toBe(0);
    expect(totals.savingsRate).toBe(0);
  });

  it('getFilteredData filters by date range', () => {
    const data = [
      { date: '2025-01-05', amount: 100 },
      { date: '2025-01-15', amount: 200 },
      { date: '2025-02-05', amount: 300 },
    ];
    const filtered = store.getFilteredData(data as unknown as Entry[], {
      start: '2025-01-01',
      end: '2025-01-31',
      label: 'Enero',
    });
    expect(filtered).toHaveLength(2);
  });

  it('getViewPeriod returns month view by default', () => {
    const period = store.getViewPeriod();
    expect(period.label).toContain('enero');
  });

  it('setView updates currentView', () => {
    store.setView('year');
    expect(store.state.currentView).toBe('year');
  });

  it('navigatePeriod changes date', () => {
    const initialMonth = store.getCurrentMonth();
    store.navigatePeriod(1);
    expect(store.getCurrentMonth()).not.toBe(initialMonth);
  });

  it('getCategoryInfo returns fallback for unknown category', () => {
    const info = store.getCategoryInfo('nonexistent');
    expect(info.name).toBe('nonexistent');
    expect(info.color).toBe('#6B7280');
  });
});
