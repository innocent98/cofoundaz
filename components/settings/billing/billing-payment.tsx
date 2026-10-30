'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  addPaymentMethod,
  getBillingDetails,
  listPaymentMethods,
  removePaymentMethod,
  saveBillingDetails,
  setDefaultPaymentMethod,
  type BillingDetails,
} from '@/lib/api/billing';
import { Button, Card, FieldError, Label, LoadError, Spinner, TextArea, TextInput } from '../ui';
import { goToCheckout, useAsync } from './use-async';

function DetailsCard(): React.JSX.Element {
  const { data, error, loading, reload, setData } = useAsync(getBillingDetails, "We couldn't load your billing details.");
  const [draft, setDraft] = useState<Partial<BillingDetails>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (error && !data) return <LoadError message={error} onRetry={reload} />;
  if (loading || !data) return <Spinner />;

  const form: BillingDetails = {
    company_name: data.company_name ?? '',
    tax_id: data.tax_id ?? '',
    address: data.address ?? '',
    ...draft,
  };
  const dirty =
    (form.company_name ?? '') !== (data.company_name ?? '') ||
    (form.tax_id ?? '') !== (data.tax_id ?? '') ||
    (form.address ?? '') !== (data.address ?? '');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrs({});
    setFormError(null);
    try {
      setData(await saveBillingDetails({
        company_name: form.company_name?.trim() || null,
        tax_id: form.tax_id?.trim() || null,
        address: form.address?.trim() || null,
      }));
      setDraft({});
      toast.success('Billing details saved.');
    } catch (err) {
      const info = apiErrorInfo(err, "We couldn't save your billing details.");
      const next: Record<string, string> = {};
      for (const f of info.fieldErrors) next[f.field] = f.message;
      setErrs(next);
      setFormError(info.fieldErrors.length ? null : info.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Billing details" description="Printed on your receipts.">
      <form onSubmit={save} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="bd-company">Company name</Label>
          <TextInput id="bd-company" maxLength={160} value={form.company_name ?? ''} onChange={(e) => setDraft({ ...draft, company_name: e.target.value })} />
          <FieldError message={errs.company_name} />
        </div>
        <div>
          <Label htmlFor="bd-tin">Tax ID (TIN)</Label>
          <TextInput id="bd-tin" maxLength={40} value={form.tax_id ?? ''} onChange={(e) => setDraft({ ...draft, tax_id: e.target.value })} />
          <FieldError message={errs.tax_id} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="bd-address">Address</Label>
          <TextArea id="bd-address" maxLength={500} value={form.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          <FieldError message={errs.address} />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <Button type="submit" loading={busy} disabled={!dirty}>Save details</Button>
          <FieldError message={formError} />
        </div>
      </form>
    </Card>
  );
}

export function PaymentView(): React.JSX.Element {
  const { data, error, loading, reload } = useAsync(listPaymentMethods, "We couldn't load your payment methods.");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    setErr(null);
    try {
      await fn();
      if (ok) toast.success(ok);
      await reload();
    } catch (e) {
      const info = apiErrorInfo(e, 'Something went wrong. Try again.');
      setErr(info.status === 404 ? 'That card is already gone.' : info.message);
      await reload();
    } finally {
      setBusy(null);
      setConfirmRemove(null);
    }
  };

  const addCard = async () => {
    setBusy('add');
    setErr(null);
    try {
      goToCheckout((await addPaymentMethod()).authorization_url);
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't start adding a card.");
      setErr(info.code === 'BILLING_NOT_CONFIGURED' ? 'Payments are not available right now.' : info.message);
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Payment methods"
        description="Cards are held by Paystack. We only keep the brand, last four digits and expiry."
        action={<Button loading={busy === 'add'} onClick={addCard}>Add card</Button>}
      >
        <p className="text-[11px] text-ink-subtle mb-4">
          Adding a card charges ₦50 on Paystack&rsquo;s secure page to verify it. We refund it straight away.
        </p>
        {error && !data ? (
          <LoadError message={error} onRetry={reload} />
        ) : loading || !data ? (
          <Spinner />
        ) : data.length === 0 ? (
          <p className="text-xs text-ink-subtle py-3">No card saved yet. Add one to upgrade without leaving the page.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((m) => (
              <li key={m.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CreditCard className="w-5 h-5 text-ink-muted shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink capitalize">
                      {m.brand ?? 'Card'} •••• {m.last4 ?? '----'}
                      {m.is_default && <span className="ml-2 text-[10px] font-bold uppercase bg-brand-tint text-brand-strong rounded-full px-2 py-0.5">Default</span>}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {m.exp_month && m.exp_year ? `Expires ${m.exp_month}/${m.exp_year}` : 'No expiry on file'}
                      {m.bank ? ` · ${m.bank}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!m.is_default && (
                    <Button variant="secondary" loading={busy === `d${m.id}`} onClick={() => run(`d${m.id}`, () => setDefaultPaymentMethod(m.id), 'Default card updated.')}>
                      Make default
                    </Button>
                  )}
                  {confirmRemove === m.id ? (
                    <>
                      <Button variant="danger" loading={busy === `r${m.id}`} onClick={() => run(`r${m.id}`, () => removePaymentMethod(m.id), 'Card removed.')}>Remove card</Button>
                      <Button variant="ghost" onClick={() => setConfirmRemove(null)}>Keep</Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => setConfirmRemove(m.id)} aria-label={`Remove ${m.brand ?? 'card'} ending ${m.last4 ?? ''}`}>Remove</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <FieldError message={err} />
      </Card>
      <DetailsCard />
    </div>
  );
}
