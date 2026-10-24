import { describe, expect, it } from 'vitest';
import type { ModelAssumptions } from '@/lib/api/finance';
import { buildPatch, stateFromAssumptions } from './modelEdits';

const MONTHS = ['2026-11', '2026-12', '2027-01'];
const current: ModelAssumptions = {
  monthly_revenue_growth_pct: 0,
  cogs_pct_of_revenue: 0,
  monthly_opex_growth_pct: 0,
  ar_days: 0,
  ap_days: 0,
  narrative: 'n',
  revenue_0_minor: 2000000,
  monthly_costs_0_minor: 10666667,
};

describe('model editor patch', () => {
  it('is empty when nothing changed', () => {
    expect(buildPatch(stateFromAssumptions(current), current, MONTHS)).toEqual({ patch: {} });
  });

  it('sends only the changed fields, money in kobo and lists whole', () => {
    const s = stateFromAssumptions(current);
    s.growth = '6';
    s.ar = '30';
    s.rev0 = '25000.50';
    s.hiring = [{ role: 'Backend engineer', start: '2027-01', cost: '15000' }];
    s.capex = [{ label: 'Laptops', month: '2027-01', amount: '48000' }];
    expect(buildPatch(s, current, MONTHS)).toEqual({
      patch: {
        monthly_revenue_growth_pct: 6,
        ar_days: 30,
        revenue_0_minor: 2500050,
        hiring_plan: [{ role: 'Backend engineer', start_month: '2027-01', monthly_cost_minor: 1500000 }],
        capex: [{ label: 'Laptops', month: '2027-01', amount_minor: 4800000 }],
      },
    });
  });

  it('rejects out of range numbers and months outside the projection', () => {
    const s = stateFromAssumptions(current);
    s.growth = '150';
    expect(buildPatch(s, current, MONTHS)).toEqual({ error: 'Revenue growth must be between -50 and 100.' });
    const t = stateFromAssumptions(current);
    t.oneOffs = [{ label: 'Audit', month: '2025-03', amount: '1000' }];
    expect(buildPatch(t, current, MONTHS)).toEqual({ error: 'One-off 1 needs a month inside the projection.' });
    const u = stateFromAssumptions(current);
    u.ar = '1.5';
    expect(buildPatch(u, current, MONTHS)).toEqual({ error: 'Receivable days must be a whole number.' });
  });

  it('sends an empty list when the user removes every row of an edited list', () => {
    const withHire: ModelAssumptions = { ...current, hiring_plan: [{ role: 'PM', start_month: '2026-12', monthly_cost_minor: 100 }] };
    const s = stateFromAssumptions(withHire);
    s.hiring = [];
    expect(buildPatch(s, withHire, MONTHS)).toEqual({ patch: { hiring_plan: [] } });
  });
});
