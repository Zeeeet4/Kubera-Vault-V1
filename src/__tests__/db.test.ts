import { describe, it, expect } from 'vitest';
import { db } from '../lib/db';

describe('getCurrencyByCode', () => {
  it('returns the correct currency for USD', () => {
    const currency = db.getCurrencyByCode('USD');
    expect(currency.code).toBe('USD');
    expect(currency.symbol).toBe('$');
    expect(currency.name).toBe('Dólar Americano');
  });

  it('returns the correct currency for EUR', () => {
    const currency = db.getCurrencyByCode('EUR');
    expect(currency.code).toBe('EUR');
    expect(currency.symbol).toBe('€');
  });

  it('returns fallback for unknown currency code', () => {
    const currency = db.getCurrencyByCode('XXX');
    expect(currency).toBeDefined();
    expect(currency.code).toBe('USD');
  });
});

describe('getAllCurrencies', () => {
  it('returns all default currencies', () => {
    const currencies = db.getAllCurrencies();
    expect(currencies.length).toBeGreaterThanOrEqual(12);
    expect(currencies.some(c => c.code === 'USD')).toBe(true);
    expect(currencies.some(c => c.code === 'EUR')).toBe(true);
    expect(currencies.some(c => c.code === 'PEN')).toBe(true);
    expect(currencies.some(c => c.code === 'BRL')).toBe(true);
  });
});

describe('defaultCategories', () => {
  it('has income categories', () => {
    const incomeCats = db.defaultCategories.income;
    expect(incomeCats.length).toBeGreaterThan(0);
    expect(incomeCats.some(c => c.type === 'income')).toBe(true);
    expect(incomeCats.some(c => c.id === 'salary')).toBe(true);
    expect(incomeCats.some(c => c.id === 'freelance')).toBe(true);
  });

  it('has expense categories', () => {
    const expenseCats = db.defaultCategories.expense;
    expect(expenseCats.length).toBeGreaterThan(0);
    expect(expenseCats.some(c => c.type === 'expense')).toBe(true);
    expect(expenseCats.some(c => c.id === 'food')).toBe(true);
    expect(expenseCats.some(c => c.id === 'transport')).toBe(true);
  });

  it('every category has required fields', () => {
    const allCategories = [...db.defaultCategories.income, ...db.defaultCategories.expense];
    allCategories.forEach(cat => {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(cat.color).toBeDefined();
      expect(cat.icon).toBeDefined();
      expect(['income', 'expense']).toContain(cat.type);
    });
  });
});
