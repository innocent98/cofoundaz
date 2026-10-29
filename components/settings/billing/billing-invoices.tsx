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
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs min-w-[34rem]">
            <thead>
              <tr className="text-left text-ink-subtle">
                <th className="py-2 px-1 font-semibold">Date</th><th className="py-2 px-1 font-semibold">Invoice</th>
                <th className="py-2 px-1 font-semibold">Description</th><th className="py-2 px-1 font-semibold">Amount</th>
                <th className="py-2 px-1 font-semibold">Status</th><th className="py-2 px-1"><span className="sr-only">Receipt</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 px-1 whitespace-nowrap">{formatDate(inv.date)}</td>
                  <td className="py-3 px-1 whitespace-nowrap">{inv.number}</td>
                  <td className="py-3 px-1">{inv.description}</td>
                  <td className="py-3 px-1 whitespace-nowrap font-semibold">{formatNaira(inv.amount_minor)}</td>
                  <td className="py-3 px-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-brand-tint text-brand-strong' : 'bg-danger-xfdf0ed text-danger-ink'}`}>
                      {inv.status === 'paid' ? 'Paid' : 'Failed'}
                    </span>
                  </td>
                  <td className="py-3 px-1 text-right">
                    <Button variant="secondary" loading={busy === inv.id} onClick={() => download(inv)} aria-label={`Download receipt ${inv.number}`}>
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
