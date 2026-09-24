import { describe, expect, it } from 'vitest';
import { formatAUD, formatHours, parseHours, parseMoneyToCents } from './format';

describe('Beträge', () => {
  it('formatiert wie ein australischer Payslip', () => {
    expect(formatAUD(123450)).toBe('$1,234.50');
    expect(formatAUD(3000)).toBe('$30.00');
  });

  it('liest deutsche und australische Schreibweisen', () => {
    expect(parseMoneyToCents('32.50')).toBe(3250);
    expect(parseMoneyToCents('32,50')).toBe(3250);
    expect(parseMoneyToCents('$1,234.50')).toBe(123450);
    expect(parseMoneyToCents('1.234,50')).toBe(123450);
    expect(parseMoneyToCents('30')).toBe(3000);
    expect(parseMoneyToCents('1,234')).toBe(123400);
    expect(parseMoneyToCents('')).toBeNull();
    expect(parseMoneyToCents('abc')).toBeNull();
  });
});

describe('Stunden', () => {
  it('formatiert mit Komma', () => {
    expect(formatHours(7.5)).toBe('7,5 h');
    expect(formatHours(8)).toBe('8 h');
  });

  it('liest Komma und Punkt, lehnt Unsinn ab', () => {
    expect(parseHours('7,5')).toBe(7.5);
    expect(parseHours('7.5')).toBe(7.5);
    expect(parseHours('0')).toBeNull();
    expect(parseHours('25')).toBeNull();
    expect(parseHours('')).toBeNull();
  });
});
