import { describe, expect, it } from 'vitest';
import {
  clampPercent,
  currentMonth,
  formatDate,
  formatMoney,
  formatMonth,
  minorToInput,
  minorToThousands,
  plainText,
  shiftMonth,
  thousandsToMinor,
  toMinor,
} from './format';

describe('money', () => {
  it('formats minor units as naira', () => {
    expect(formatMoney(12050000)).toBe('₦120,500');
    expect(formatMoney(161250)).toBe('₦1,612.50');
    expect(formatMoney(4500050)).toBe('₦45,000.50');
    expect(formatMoney(96016667)).toBe('₦960,166.67');
    expect(formatMoney(0)).toBe('₦0');
  });
  it('falls back for a non-ISO currency code', () => {
    expect(formatMoney(1000, 'ZZ1')).toContain('10');
  });
  it('parses typed amounts to integer minor units without float error', () => {
    expect(toMinor('1,250.50')).toBe(125050);
    expect(toMinor('0.07')).toBe(7);
    expect(toMinor('19.99')).toBe(1999);
    expect(toMinor(' 5 ')).toBe(500);
  });
  it('rejects negatives, junk and more than two decimals', () => {
    expect(toMinor('-5')).toBeNull();
    expect(toMinor('abc')).toBeNull();
    expect(toMinor('1.234')).toBeNull();
    expect(toMinor('')).toBeNull();
  });
  it('round-trips minor <-> input', () => {
    expect(minorToInput(125050)).toBe('1250.5');
    expect(minorToInput(100)).toBe('1');
    expect(minorToInput(105)).toBe('1.05');
  });
  it('converts runway-screen NGN thousands to kobo and back', () => {
    expect(thousandsToMinor(20)).toBe(2000000);
    expect(thousandsToMinor(50)).toBe(5000000);
    expect(minorToThousands(2000000)).toBe(20);
  });
});

describe('dates', () => {
  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('formats months and dates locale-independently', () => {
    expect(formatMonth('2026-09')).toBe('Sep 2026');
    expect(formatDate('2026-09-30')).toBe('30 Sep 2026');
    expect(formatDate(null)).toBe('Not set');
  });
  it('uses UTC for the current month', () => {
    expect(currentMonth(new Date('2026-09-30T23:30:00Z'))).toBe('2026-09');
  });
});

describe('copy helpers', () => {
  it('replaces em and en dashes in server text', () => {
    expect(plainText('Invoice INV-2026-001 — Acme')).toBe('Invoice INV-2026-001 - Acme');
    expect(plainText('a–b')).toBe('a - b');
  });
  it('clamps percent for the bar only', () => {
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(null)).toBe(0);
    expect(clampPercent(40)).toBe(40);
  });
});
