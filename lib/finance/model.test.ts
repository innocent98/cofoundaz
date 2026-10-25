import { describe, expect, it } from 'vitest';
import { applyRevenueSensitivity, modelToCsv } from './model';
import type { FinancialModel } from '@/lib/api/finance';

const pnl = [
  { label: 'Revenue', values: [1000, 2000] },
  { label: 'COGS', values: [100, 200] },
  { label: 'Gross profit', values: [900, 1800] },
  { label: 'Opex', values: [500, 500] },
  { label: 'Net income', values: [400, 1300] },
];

describe('financial model helpers', () => {
  it('leaves the P&L untouched at 0%', () => {
    expect(applyRevenueSensitivity(pnl, 0)).toBe(pnl);
  });
  it('scales revenue and COGS, keeps opex, re-derives gross and net', () => {
    const rows = applyRevenueSensitivity(pnl, 10);
    const by = (l: string) => rows.find((r) => r.label === l)!.values;
    expect(by('Revenue')).toEqual([1100, 2200]);
    expect(by('COGS')).toEqual([110, 220]);
    expect(by('Gross profit')).toEqual([990, 1980]);
    expect(by('Opex')).toEqual([500, 500]);
    expect(by('Net income')).toEqual([490, 1480]);
  });
  it('exports every statement in major units', () => {
    const model = {
      months: ['2026-10', '2026-11'],
      pnl: { rows: pnl.slice(0, 1) },
      cash_flow: { rows: [{ label: 'Closing cash', values: [-5000, 10000] }] },
      balance_sheet: { rows: [{ label: 'Cash, total', values: [100, 200] }] },
    } as unknown as FinancialModel;
    expect(modelToCsv(model).split('\n')).toEqual([
      'Statement,Line,2026-10,2026-11',
      'P&L,Revenue,10.00,20.00',
      'Cash flow,Closing cash,-50.00,100.00',
      'Balance sheet,"Cash, total",1.00,2.00',
    ]);
  });
  it('subtracts depreciation from the re-derived net income', () => {
    const rows = applyRevenueSensitivity([...pnl.slice(0, 4), { label: 'Depreciation', values: [50, 50] }, { label: 'Net income', values: [350, 1250] }], 10);
    expect(rows.find((r) => r.label === 'Net income')!.values).toEqual([440, 1430]);
  });
  it('exports the yearly rollup with period labels', () => {
    const model = {
      months: ['2026-11'],
      pnl: { rows: pnl.slice(0, 1) },
      cash_flow: null,
      balance_sheet: null,
      yearly: {
        periods: [{ label: 'Year 1', start_month: '2026-11', end_month: '2027-10' }],
        pnl: { rows: [{ label: 'Revenue', values: [123456] }] },
        cash_flow: { rows: [] },
        balance_sheet: { rows: [] },
      },
    } as unknown as FinancialModel;
    expect(modelToCsv(model, true).split('\n')).toEqual(['Statement,Line,Year 1', 'P&L,Revenue,1234.56']);
  });
});
