import { describe, expect, it } from 'vitest';
import { escapeHtml, invoiceHtml } from './printInvoice';

describe('printInvoice', () => {
  it('escapes user-controlled text', () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe('&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;');
  });
  it('renders totals and escapes the client name', () => {
    const html = invoiceHtml({
      number: 'INV-2026-001',
      clientName: '<b>Acme</b>',
      clientEmail: 'a@b.co',
      currency: 'NGN',
      lines: [{ description: 'Retainer', quantity: 1, unitMinor: 100000, amountMinor: 100000 }],
      subtotalMinor: 100000,
      taxPercent: 7.5,
      taxMinor: 7500,
      totalMinor: 107500,
      issuedOn: null,
      dueOn: '2026-10-30',
      status: 'draft',
    });
    expect(html).toContain('INV-2026-001');
    expect(html).toContain('&lt;b&gt;Acme&lt;/b&gt;');
    expect(html).not.toContain('<b>Acme</b>');
    expect(html).toContain('₦1,075');
  });
});
