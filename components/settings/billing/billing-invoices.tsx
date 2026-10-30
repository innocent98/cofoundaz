'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { downloadInvoicePdf, listInvoices, type Invoice } from '@/lib/api/billing';
import { formatDate, formatNaira } from '@/lib/billing-format';
import { Button, Card, LoadError, Spinner } from '../ui';
import { useAsync } from './use-async';

export function InvoicesView(): React.JSX.Element {
  const { data, error, loading, reload } = useAsync(listInvoices, "We couldn't load your invoices.");
  const [busy, setBusy] = useState<string | null>(null);

  if (error && !data) return <LoadError message={error} onRetry={reload} />;
  if (loading || !data) return <Spinner label="Loading invoices" />;

  const download = async (inv: Invoice) => {
    setBusy(inv.id);
    try {
      await downloadInvoicePdf(inv);
    } catch {
      toast.error("We couldn't download that receipt. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="Billing history" description="Receipts for every charge. Paystack also emails you each one.">
      {data.length === 0 ? (
        <p className="text-xs text-ink-subtle py-4">No invoices yet. They appear here after your first payment.</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.map((inv) => (
            <li key={inv.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{inv.description}</p>
                <p className="text-ink-subtle">
                  {formatDate(inv.date)} · {inv.number}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-ink">{formatNaira(inv.amount_minor)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-brand-tint text-brand-strong' : 'bg-danger-xfdf0ed text-danger-ink'}`}>
                  {inv.status === 'paid' ? 'Paid' : 'Failed'}
                </span>
                <Button variant="secondary" loading={busy === inv.id} onClick={() => download(inv)} aria-label={`Download receipt ${inv.number}`}>
                  Receipt
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
