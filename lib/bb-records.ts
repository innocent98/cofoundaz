import type { BusinessRecord, EditorRef, PricingAdvice, PricingTier } from '@/lib/api/business-builder';

/** The most recent edit across a record list, for the page header's "Last edited by". */
export function latestEdit(records: BusinessRecord[]): { updatedAt: string | null; updatedBy: EditorRef | null } {
  let best: BusinessRecord | null = null;
  for (const r of records) {
    if (!r.updated_at) continue;
    if (!best || new Date(r.updated_at).getTime() > new Date(best.updated_at as string).getTime()) best = r;
  }
  // Records written before the release (and AI-created ones) have a null `updated_by`: show no name rather than guess.
  return best ? { updatedAt: best.updated_at ?? null, updatedBy: best.updated_by ?? null } : { updatedAt: null, updatedBy: null };
}

export const PRICING_MODELS = ['subscription', 'one_time', 'usage', 'freemium', 'tiered'] as const;

export function modelLabel(model: string): string {
  const base = model.replace(/_/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export interface CompetitorPriceRow {
  name: string;
  price: string;
}

/** Competitor records that carry a price, as the advisor's prefilled inputs (name and price 1 to 120 chars, max 20). */
export function competitorPriceRows(records: BusinessRecord[]): CompetitorPriceRow[] {
  const rows: CompetitorPriceRow[] = [];
  for (const r of records) {
    const name = typeof r.data.name === 'string' ? r.data.name.trim() : '';
    const price = typeof r.data.price === 'string' ? r.data.price.trim() : '';
    if (name && price) rows.push({ name: name.slice(0, 120), price: price.slice(0, 120) });
  }
  return rows.slice(0, 20);
}

/** Drops blank rows and clamps lengths so the advisor request cannot 422 on our side. */
export function cleanPriceRows(rows: CompetitorPriceRow[]): CompetitorPriceRow[] {
  return rows
    .map((r) => ({ name: r.name.trim().slice(0, 120), price: r.price.trim().slice(0, 120) }))
    .filter((r) => r.name && r.price)
    .slice(0, 20);
}

/** The pricing record body for "Apply": the advice's model and tiers, mapped to the CRUD shape. */
export function adviceToRecord(advice: PricingAdvice): { model_type: string; tiers: PricingTier[] } {
  const model = (PRICING_MODELS as readonly string[]).includes(advice.recommended_model)
    ? advice.recommended_model
    : 'tiered';
  return {
    model_type: model,
    tiers: (advice.tiers ?? [])
      .filter((t) => t.name && t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        price: (t.price ?? '').trim(),
        features: (t.features ?? []).map((f) => f.trim()).filter(Boolean),
      })),
  };
}

export function tiersOf(data: Record<string, unknown>): PricingTier[] {
  const raw = Array.isArray(data.tiers) ? (data.tiers as Array<Record<string, unknown>>) : [];
  return raw.map((t) => ({
    name: typeof t.name === 'string' ? t.name : '',
    price: typeof t.price === 'string' ? t.price : '',
    features: Array.isArray(t.features) ? (t.features as unknown[]).filter((f): f is string => typeof f === 'string') : [],
  }));
}

/** Pricing form rows to the API body: nameless tiers are dropped, features are one per line. */
export function cleanTiers(rows: Array<{ name: string; price: string; features: string }>): PricingTier[] {
  return rows
    .filter((t) => t.name.trim() !== '')
    .map((t) => ({
      name: t.name.trim(),
      price: t.price.trim(),
      features: t.features.split('\n').map((s) => s.trim()).filter(Boolean),
    }));
}
