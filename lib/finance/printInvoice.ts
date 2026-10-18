import { formatDate, formatMoney } from './format';

// "Download PDF" has no server endpoint (the BE deferred it), so it is FE-only:
// open a print view of the invoice and let the browser save it as PDF.

export interface PrintableInvoice {
  number: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  lines: { description: string; quantity: number; unitMinor: number; amountMinor: number }[];
  subtotalMinor: number;
  taxPercent: number;
  taxMinor: number;
  totalMinor: number;
  issuedOn: string | null;
  dueOn: string | null;
  status: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function invoiceHtml(inv: PrintableInvoice): string {
  const money = (m: number) => escapeHtml(formatMoney(m, inv.currency));
  const rows = inv.lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.description)}</td><td class="r">${l.quantity}</td><td class="r">${money(l.unitMinor)}</td><td class="r">${money(l.amountMinor)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(inv.number)}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#171c1a;padding:0 24px}
h1{margin:0 0 4px;font-size:28px} .muted{color:#67716c;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:24px} th,td{padding:8px 0;border-bottom:1px solid #e5e9e7;text-align:left;font-size:14px}
.r{text-align:right} .tot{margin-top:16px;margin-left:auto;width:260px;font-size:14px} .tot div{display:flex;justify-content:space-between;padding:4px 0}
.grand{font-weight:700;font-size:18px;border-top:1px solid #e5e9e7;margin-top:6px;padding-top:8px!important}
</style></head><body>
<h1>Invoice ${escapeHtml(inv.number)}</h1>
<p class="muted">Status: ${escapeHtml(inv.status)} &middot; Issued: ${escapeHtml(formatDate(inv.issuedOn))} &middot; Due: ${escapeHtml(formatDate(inv.dueOn))}</p>
<p><strong>Bill to</strong><br>${escapeHtml(inv.clientName)}<br><span class="muted">${escapeHtml(inv.clientEmail)}</span></p>
<table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div><span>Subtotal</span><span>${money(inv.subtotalMinor)}</span></div>
<div><span>Tax (${inv.taxPercent}%)</span><span>${money(inv.taxMinor)}</span></div>
<div class="grand"><span>Total</span><span>${money(inv.totalMinor)}</span></div></div>
</body></html>`;
}

/** Opens the print dialog for an invoice. Returns false if the popup was blocked. */
export function printInvoice(inv: PrintableInvoice): boolean {
  const w = window.open('', '_blank', 'noopener=no,width=800,height=900');
  if (!w) return false;
  w.document.open();
  w.document.write(invoiceHtml(inv));
  w.document.close();
  w.focus();
  w.print();
  return true;
}
