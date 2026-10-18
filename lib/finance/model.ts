import type { FinancialModel, ModelRow } from '@/lib/api/finance';

// Client-side helpers for the Financial Model screen. The statements come from
// the server's deterministic engine; sensitivity and export are FE-only (the
// guide: no server sensitivity endpoint, XLSX export deferred).

const row = (rows: ModelRow[], label: string): number[] | undefined => rows.find((r) => r.label === label)?.values;

/**
 * Revenue what-if for the P&L only. Revenue and COGS (a % of revenue) scale by
 * the adjustment; Opex is unchanged; gross profit and net income are re-derived.
 * Cash flow and the balance sheet are not recomputed (AR/AP timing lives in the
 * engine), so the page says so rather than implying they moved.
 */
export function applyRevenueSensitivity(rows: ModelRow[], pct: number): ModelRow[] {
  if (pct === 0) return rows;
  const m = 1 + pct / 100;
  const revenue = row(rows, 'Revenue');
  const cogs = row(rows, 'COGS');
  const opex = row(rows, 'Opex');
  if (!revenue || !cogs || !opex) return rows;
  const rev = revenue.map((v) => Math.round(v * m));
  const cg = cogs.map((v) => Math.round(v * m));
  const gross = rev.map((v, i) => v - cg[i]);
  const net = gross.map((v, i) => v - opex[i]);
  return rows.map((r) => {
    switch (r.label) {
      case 'Revenue':
        return { ...r, values: rev };
      case 'COGS':
        return { ...r, values: cg };
      case 'Gross profit':
        return { ...r, values: gross };
      case 'Net income':
        return { ...r, values: net };
      default:
        return r;
    }
  });
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** All three statements as one CSV in major units (minor / 100). */
export function modelToCsv(model: FinancialModel): string {
  const months = model.months ?? [];
  const lines: string[] = [['Statement', 'Line', ...months].map(csvCell).join(',')];
  const sections: [string, ModelRow[] | undefined][] = [
    ['P&L', model.pnl?.rows],
    ['Cash flow', model.cash_flow?.rows],
    ['Balance sheet', model.balance_sheet?.rows],
  ];
  for (const [name, rows] of sections) {
    for (const r of rows ?? []) {
      lines.push([name, r.label, ...r.values.map((v) => (v / 100).toFixed(2))].map(csvCell).join(','));
    }
  }
  return lines.join('\n');
}
