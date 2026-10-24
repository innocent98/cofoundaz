import type { DatedCost, HiringPlanItem, ModelAssumptions, ModelAssumptionsPatch } from '@/lib/api/finance';
import { minorToInput, toMinor } from './format';

// The model editor holds text, because that is what a person types. These helpers
// turn it into the PATCH body: only fields that differ from what the engine used
// are sent, lists replace whole, money is naira in the form and kobo on the wire.

export interface HiringRow {
  role: string;
  start: string;
  cost: string;
}
export interface CostRow {
  label: string;
  month: string;
  amount: string;
}

export interface EditorState {
  growth: string;
  opexGrowth: string;
  cogs: string;
  ar: string;
  ap: string;
  rev0: string;
  costs0: string;
  depreciation: string;
  hiring: HiringRow[];
  oneOffs: CostRow[];
  capex: CostRow[];
}

const num = (v: number | undefined, fallback = 0) => String(v ?? fallback);

export function stateFromAssumptions(a: ModelAssumptions): EditorState {
  return {
    growth: num(a.monthly_revenue_growth_pct),
    opexGrowth: num(a.monthly_opex_growth_pct),
    cogs: num(a.cogs_pct_of_revenue),
    ar: num(a.ar_days),
    ap: num(a.ap_days),
    rev0: minorToInput(a.revenue_0_minor ?? 0),
    costs0: minorToInput(a.monthly_costs_0_minor ?? 0),
    depreciation: num(a.depreciation_months, 36),
    hiring: (a.hiring_plan ?? []).map((h) => ({ role: h.role, start: h.start_month, cost: minorToInput(h.monthly_cost_minor) })),
    oneOffs: (a.one_offs ?? []).map((c) => ({ label: c.label, month: c.month, amount: minorToInput(c.amount_minor) })),
    capex: (a.capex ?? []).map((c) => ({ label: c.label, month: c.month, amount: minorToInput(c.amount_minor) })),
  };
}

function parseNumber(text: string, label: string, min: number, max: number, integer = false): { value: number } | { error: string } {
  const t = text.trim();
  if (t === '' || !Number.isFinite(Number(t))) return { error: `${label} must be a number.` };
  const value = Number(t);
  if (integer && !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
}

type Built<T> = { value: T } | { error: string };

function hiring(rows: HiringRow[], months: string[]): Built<HiringPlanItem[]> {
  const out: HiringPlanItem[] = [];
  for (const [i, r] of rows.entries()) {
    const cost = toMinor(r.cost);
    if (!r.role.trim()) return { error: `Hire ${i + 1} needs a role.` };
    if (cost === null) return { error: `Hire ${i + 1} needs a monthly cost like 250000.` };
    if (!months.includes(r.start)) return { error: `Hire ${i + 1} needs a start month inside the projection.` };
    out.push({ role: r.role.trim(), start_month: r.start, monthly_cost_minor: cost });
  }
  return { value: out };
}

function costs(rows: CostRow[], months: string[], noun: string): Built<DatedCost[]> {
  const out: DatedCost[] = [];
  for (const [i, r] of rows.entries()) {
    const amount = toMinor(r.amount);
    if (!r.label.trim()) return { error: `${noun} ${i + 1} needs a label.` };
    if (amount === null) return { error: `${noun} ${i + 1} needs an amount like 500000.` };
    if (!months.includes(r.month)) return { error: `${noun} ${i + 1} needs a month inside the projection.` };
    out.push({ label: r.label.trim(), month: r.month, amount_minor: amount });
  }
  return { value: out };
}

/**
 * The PATCH body for the fields the user changed, or the first thing wrong with
 * their input. An empty patch means nothing differs from what the model used.
 */
export function buildPatch(
  state: EditorState,
  current: ModelAssumptions,
  months: string[],
): { patch: ModelAssumptionsPatch } | { error: string } {
  const patch: ModelAssumptionsPatch = {};

  const scalars: [string, string, number, number, number, boolean, (v: number) => void][] = [
    ['Revenue growth', state.growth, -50, 100, current.monthly_revenue_growth_pct, false, (v) => (patch.monthly_revenue_growth_pct = v)],
    ['Opex growth', state.opexGrowth, -50, 100, current.monthly_opex_growth_pct, false, (v) => (patch.monthly_opex_growth_pct = v)],
    ['COGS', state.cogs, 0, 100, current.cogs_pct_of_revenue, false, (v) => (patch.cogs_pct_of_revenue = v)],
    ['Receivable days', state.ar, 0, 120, current.ar_days, true, (v) => (patch.ar_days = v)],
    ['Payable days', state.ap, 0, 120, current.ap_days, true, (v) => (patch.ap_days = v)],
    ['Depreciation months', state.depreciation, 6, 120, current.depreciation_months ?? 36, true, (v) => (patch.depreciation_months = v)],
  ];
  for (const [label, text, min, max, was, integer, set] of scalars) {
    const parsed = parseNumber(text, label, min, max, integer);
    if ('error' in parsed) return { error: parsed.error };
    if (parsed.value !== was) set(parsed.value);
  }

  const money: [string, string, number | undefined, (v: number) => void][] = [
    ['Starting monthly revenue', state.rev0, current.revenue_0_minor, (v) => (patch.revenue_0_minor = v)],
    ['Starting monthly costs', state.costs0, current.monthly_costs_0_minor, (v) => (patch.monthly_costs_0_minor = v)],
  ];
  for (const [label, text, was, set] of money) {
    const v = toMinor(text);
    if (v === null) return { error: `${label} must be an amount like 1500000.` };
    if (v !== (was ?? 0)) set(v);
  }

  const h = hiring(state.hiring, months);
  if ('error' in h) return { error: h.error };
  if (JSON.stringify(h.value) !== JSON.stringify(current.hiring_plan ?? [])) patch.hiring_plan = h.value;
  const o = costs(state.oneOffs, months, 'One-off');
  if ('error' in o) return { error: o.error };
  if (JSON.stringify(o.value) !== JSON.stringify(current.one_offs ?? [])) patch.one_offs = o.value;
  const c = costs(state.capex, months, 'Capex');
  if ('error' in c) return { error: c.error };
  if (JSON.stringify(c.value) !== JSON.stringify(current.capex ?? [])) patch.capex = c.value;

  return { patch };
}
