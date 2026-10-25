import { describe, expect, it } from 'vitest';
import { parseLine, previewTotals } from './invoiceMath';

describe('invoice preview math (mirrors the server)', () => {
  it('matches the live-captured invoice: 125,000 + 7.5% = 134,375', () => {
    const lines = [
      { description: 'Design retainer', quantity: '1', price: '1000' },
      { description: 'Hosting setup', quantity: '5', price: '50' },
    ];
    expect(previewTotals(lines, 7.5)).toEqual({ subtotal: 125000, tax: 9375, total: 134375 });
  });
  it('rounds half a kobo up', () => {
    // 0.05 naira = 5 kobo at 10% = 0.5 kobo -> 1
    expect(previewTotals([{ description: 'x', quantity: '1', price: '0.05' }], 10).tax).toBe(1);
  });
  it('ignores incomplete lines', () => {
    expect(previewTotals([{ description: '', quantity: '', price: '' }], 5)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
  it('parseLine requires description, whole quantity >= 1 and a valid price', () => {
    expect(parseLine({ description: ' A ', quantity: '2', price: '10.50' })).toEqual({ description: 'A', quantity: 2, unit_price_minor: 1050 });
    expect(parseLine({ description: 'A', quantity: '0', price: '1' })).toBeNull();
    expect(parseLine({ description: 'A', quantity: '1.5', price: '1' })).toBeNull();
    expect(parseLine({ description: '', quantity: '1', price: '1' })).toBeNull();
    expect(parseLine({ description: 'A', quantity: '1', price: 'x' })).toBeNull();
  });
});
