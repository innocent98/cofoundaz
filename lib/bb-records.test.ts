import { describe, expect, it } from 'vitest';
import type { BusinessRecord, PricingAdvice } from '@/lib/api/business-builder';
import { adviceToRecord, cleanPriceRows, cleanTiers, competitorPriceRows, latestEdit, modelLabel } from './bb-records';

const rec = (data: Record<string, unknown>, updated_at: string | null = null, name: string | null = null): BusinessRecord => ({
  id: Math.random().toString(),
  kind: 'competitor',
  data,
  position: 0,
  updated_at,
  updated_by: name ? { id: 'u', name } : null,
});

describe('latestEdit', () => {
  it('picks the most recently updated record and its editor', () => {
    const out = latestEdit([
      rec({}, '2026-10-19T10:00:00Z', 'Ada'),
      rec({}, '2026-10-19T12:00:00Z', 'Bola'),
      rec({}, null),
    ]);
    expect(out).toEqual({ updatedAt: '2026-10-19T12:00:00Z', updatedBy: { id: 'u', name: 'Bola' } });
  });

  it('is empty for no timestamps (legacy rows)', () => {
    expect(latestEdit([rec({})])).toEqual({ updatedAt: null, updatedBy: null });
    expect(latestEdit([])).toEqual({ updatedAt: null, updatedBy: null });
  });
});

describe('advisor inputs', () => {
  it('prefills from competitor records that have both a name and a price', () => {
    const rows = competitorPriceRows([
      rec({ name: 'Moniepoint', price: 'NGN 0 setup' }),
      rec({ name: 'Paystack', price: '' }),
      rec({ name: '', price: '5' }),
    ]);
    expect(rows).toEqual([{ name: 'Moniepoint', price: 'NGN 0 setup' }]);
  });

  it('caps at 20 rows and 120 chars, dropping blanks', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ name: `C${i}`, price: 'x'.repeat(200) }));
    const cleaned = cleanPriceRows([...many, { name: ' ', price: 'p' }]);
    expect(cleaned).toHaveLength(20);
    expect(cleaned[0].price).toHaveLength(120);
  });
});

describe('adviceToRecord', () => {
  const advice: PricingAdvice = {
    recommended_model: 'tiered',
    rationale: 'r',
    wtp_questions: [],
    tiers: [
      { name: ' Basic ', price: ' NGN 0/month ', features: [' Core ', ''] },
      { name: '', price: 'x', features: [] },
    ],
  };

  it('maps the advice to the pricing CRUD body, trimming and dropping nameless tiers', () => {
    expect(adviceToRecord(advice)).toEqual({
      model_type: 'tiered',
      tiers: [{ name: 'Basic', price: 'NGN 0/month', features: ['Core'] }],
    });
  });

  it('falls back to tiered for an unknown model value', () => {
    expect(adviceToRecord({ ...advice, recommended_model: 'barter' }).model_type).toBe('tiered');
  });
});

describe('cleanTiers + labels', () => {
  it('splits features per line and drops nameless tiers', () => {
    expect(cleanTiers([{ name: 'Pro', price: ' 5 ', features: 'a\n\n b ' }, { name: ' ', price: '1', features: '' }])).toEqual([
      { name: 'Pro', price: '5', features: ['a', 'b'] },
    ]);
  });

  it('humanises model names', () => {
    expect(modelLabel('one_time')).toBe('One time');
  });
});
