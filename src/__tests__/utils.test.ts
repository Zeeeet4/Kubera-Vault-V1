import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  preciseRound,
  preciseSum,
  validatePositiveNumber,
  generateSiglas,
  generateAutoCode,
} from '../lib/utils';

describe('escapeHtml', () => {
  it('escapes <, >, and & characters', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&lt;/script&gt;');
  });

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('passes through normal text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });
});

describe('preciseRound', () => {
  it('rounds to 2 decimal places by default', () => {
    expect(preciseRound(10.567)).toBe(10.57);
  });

  it('rounds to specified decimal places', () => {
    expect(preciseRound(10.5678, 3)).toBe(10.568);
  });

  it('handles whole numbers', () => {
    expect(preciseRound(10, 2)).toBe(10);
  });

  it('handles negative numbers', () => {
    expect(preciseRound(-10.567, 2)).toBe(-10.57);
  });

  it('handles zero', () => {
    expect(preciseRound(0, 2)).toBe(0);
  });

  it('handles floating point precision issues', () => {
    expect(preciseRound(0.1 + 0.2, 2)).toBe(0.3);
  });

  it('handles rounding with floating point edge cases', () => {
    expect(preciseRound(1.005, 2)).toBe(1);
  });
});

describe('preciseSum', () => {
  it('sums multiple numbers correctly', () => {
    expect(preciseSum([1.5, 2.3, 3.2])).toBe(7.0);
  });

  it('handles empty array', () => {
    expect(preciseSum([])).toBe(0);
  });

  it('handles decimal precision across items', () => {
    expect(preciseSum([0.1, 0.2, 0.3])).toBe(0.6);
  });

  it('handles single element array', () => {
    expect(preciseSum([5.55])).toBe(5.55);
  });

  it('coerces string numbers', () => {
    expect(preciseSum([1, '2' as unknown as number, 3])).toBe(6);
  });
});

describe('validatePositiveNumber', () => {
  it('returns number for valid positive number', () => {
    expect(validatePositiveNumber(100, 'test')).toBe(100);
  });

  it('returns null for negative number', () => {
    expect(validatePositiveNumber(-5, 'test')).toBeNull();
  });

  it('returns 0 for zero', () => {
    expect(validatePositiveNumber(0, 'test')).toBe(0);
  });

  it('returns null for NaN', () => {
    expect(validatePositiveNumber(NaN, 'test')).toBeNull();
  });

  it('returns null for string', () => {
    expect(validatePositiveNumber('abc', 'test')).toBeNull();
  });

  it('parses string numbers', () => {
    expect(validatePositiveNumber('50', 'test')).toBe(50);
  });

  it('rounds to 2 decimals', () => {
    expect(validatePositiveNumber(10.567, 'test')).toBe(10.57);
  });
});

describe('generateSiglas', () => {
  it('generates acronym from title', () => {
    expect(generateSiglas('Hola Mundo Cruel')).toBe('HMC');
  });

  it('returns ??? for null', () => {
    expect(generateSiglas(null)).toBe('???');
  });

  it('returns ??? for undefined', () => {
    expect(generateSiglas(undefined)).toBe('???');
  });

  it('returns ??? for empty string', () => {
    expect(generateSiglas('')).toBe('???');
  });

  it('returns first letter uppercase for 1-word titles with length > 2', () => {
    expect(generateSiglas('Hola')).toBe('H');
  });

  it('filters words with length <= 2', () => {
    expect(generateSiglas('Hola y Adios')).toBe('HA');
  });
});

describe('generateAutoCode', () => {
  it('returns code in YYMM-XX format', () => {
    const code = generateAutoCode();
    expect(code).toMatch(/^\d{2}(0[1-9]|1[0-2])-\d{2}$/);
  });

  it('returns sequential code when entry is provided', () => {
    const code = generateAutoCode({ id: 1 });
    expect(code).toMatch(/^\d{2}(0[1-9]|1[0-2])-01$/);
  });

  it('returns random code when entry is null', () => {
    const code = generateAutoCode(null);
    expect(code).toMatch(/^\d{2}(0[1-9]|1[0-2])-\d{2}$/);
  });
});
