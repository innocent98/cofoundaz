import { toMinor } from './format';

// Advisory builder arithmetic. The server computes every total and ignores ours,
// so the page re-renders from the create/PATCH response; this only drives the
// live preview and must mirror the server's rules so the two rarely differ:
// amount = qty x unit price, tax rounds half UP to a whole minor unit.

export interface DraftLine {
  description: string;
  quantity: string;
  price: string;
}

export interface ParsedLine {
  description: string;
  quantity: number;
  unit_price_minor: number;
}

export function parseLine(line: DraftLine): ParsedLine | null {
  const quantity = Number(line.quantity);
  const unit = toMinor(line.price);
  if (!line.description.trim() || !Number.isInteger(quantity) || quantity < 1 || quantity > 100_000 || unit === null) {
    return null;
  }
  return { description: line.description.trim(), quantity, unit_price_minor: unit };
}

export function previewTotals(lines: DraftLine[], taxPercent: number): { subtotal: number; tax: number; total: number } {
  const subtotal = lines.reduce((acc, l) => {
    const q = Number(l.quantity);
    const p = toMinor(l.price);
    return acc + (Number.isInteger(q) && q > 0 && p !== null ? q * p : 0);
  }, 0);
  // tax_percent is stored to 2 decimals, so work in hundredths of a percent.
  const hundredths = Math.round((Number.isFinite(taxPercent) ? taxPercent : 0) * 100);
  const tax = Math.floor((subtotal * hundredths + 5000) / 10000);
  return { subtotal, tax, total: subtotal + tax };
}
