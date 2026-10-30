'use client';

import React, { useRef, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { getPlans, newIdempotencyKey, purchaseAddon, type Addon } from '@/lib/api/billing';
import { formatCount, formatNaira } from '@/lib/billing-format';
import { Button, Card, FieldError, LoadError, Spinner } from '../ui';
import { goToCheckout, useAsync } from './use-async';

export function AddonsView(): React.JSX.Element {
  const { data, error, loading, reload } = useAsync(getPlans, "We couldn't load the add-ons.");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // One key per pack per attempt; a retry of the same click replays the same link.
  const keys = useRef<Record<string, string>>({});

  if (error && !data) return <LoadError message={error} onRetry={reload} />;
  if (loading || !data) return <Spinner label="Loading add-ons" />;

  const buy = async (a: Addon) => {
    setBusy(a.key);
    setErr(null);
    keys.current[a.key] ??= newIdempotencyKey();
    try {
      const link = await purchaseAddon(a.key, keys.current[a.key]);
      delete keys.current[a.key];
      goToCheckout(link.authorization_url);
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't start that purchase.");
      setErr(info.code === 'BILLING_NOT_CONFIGURED' ? 'Payments are not available right now.' : info.message);
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-subtle">One-time AI credit top-ups. They never expire and add to this month&rsquo;s limit straight away.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.addons.map((a) => (
          <Card key={a.key}>
            <h3 className="text-base font-display font-medium text-ink">{a.name}</h3>
            <p className="text-xs text-ink-subtle mt-1">{a.description}</p>
            <p className="text-2xl font-display font-medium text-ink mt-4">{formatNaira(a.price_minor)}</p>
            <p className="text-[11px] text-ink-subtle">{formatCount(a.credits)} credits, one time</p>
            <Button className="mt-4" loading={busy === a.key} onClick={() => buy(a)}>
              Buy with Paystack
            </Button>
          </Card>
        ))}
      </div>
      <FieldError message={err} />
    </div>
  );
}
