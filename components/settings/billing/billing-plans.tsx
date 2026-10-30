'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  changePlan,
  getPlans,
  newIdempotencyKey,
  previewChange,
  startCheckout,
  startTrial,
  type BillingInterval,
  type ChangePreview,
  type Plan,
  type Subscription,
} from '@/lib/api/billing';
import { PLAN_RANK, formatCount, formatDate, formatNaira, formatStorage, planPrice } from '@/lib/billing-format';
import { Button, Card, FieldError, LoadError, Spinner } from '../ui';
import { goToCheckout, useAsync } from './use-async';

interface Pending {
  plan: Plan;
  interval: BillingInterval;
  preview: ChangePreview;
  key: string;
}

export function PlansView({
  sub,
  onChanged,
  onNavigate,
}: {
  sub: Subscription;
  onChanged: () => Promise<void> | void;
  onNavigate: (view: 'payment') => void;
}): React.JSX.Element {
  const { data, error, loading, reload } = useAsync(getPlans, "We couldn't load the plans.");
  const [interval, setIntervalState] = useState<BillingInterval>(sub.interval);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [modalErr, setModalErr] = useState<{ message: string; code: string | null } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  if (error && !data) return <LoadError message={error} onRetry={reload} />;
  if (loading || !data) return <Spinner label="Loading plans" />;

  const current = sub.plan.key;
  const paid = current !== 'starter';
  const onTrial = sub.status === 'trialing';

  const unavailable = (code: string | null, fallback: string) =>
    code === 'BILLING_NOT_CONFIGURED' ? 'Payments are not available right now.' : fallback;

  const choose = async (plan: Plan) => {
    setErr(null);
    setBusy(plan.key);
    try {
      const preview = await previewChange(plan.key, interval);
      if (preview.kind === 'same') {
        toast.info("You're already on that plan.");
        return;
      }
      setModalErr(null);
      setCheckoutKey(null);
      setPending({ plan, interval, preview, key: newIdempotencyKey() });
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't check that plan change.");
      setErr(unavailable(info.code, info.message));
    } finally {
      setBusy(null);
    }
  };

  const trial = async () => {
    setBusy('trial');
    setErr(null);
    try {
      await startTrial();
      toast.success('Your 14-day Growth trial has started.');
      await onChanged();
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't start the trial.");
      setErr(info.code === 'TRIAL_UNAVAILABLE' ? 'This workspace has already used its trial.' : info.message);
      await onChanged();
    } finally {
      setBusy(null);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    setConfirming(true);
    setModalErr(null);
    try {
      const { plan, interval: iv, preview, key } = pending;
      if (preview.kind === 'checkout') {
        const k = checkoutKey ?? newIdempotencyKey();
        setCheckoutKey(k);
        goToCheckout((await startCheckout(plan.key as 'growth' | 'scale', iv, k)).authorization_url);
        return;
      }
      const r = await changePlan(plan.key, iv, key);
      if (r.result === 'checkout') {
        goToCheckout(r.authorization_url);
        return;
      }
      setPending(null);
      toast.success(
        r.result === 'applied'
          ? `You're on ${plan.name} now. ${formatNaira(r.amount_charged_minor)} was charged.`
          : `Done. Your plan changes on ${formatDate(r.effective_at)}.`,
      );
      await onChanged();
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't change your plan.");
      if (info.code === 'CHARGE_PENDING') {
        setModalErr({ code: info.code, message: "Your bank hasn't confirmed the charge yet. Check back in a minute; your plan updates by itself once it does." });
        await onChanged();
      } else {
        setModalErr({ code: info.code, message: unavailable(info.code, info.message) });
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div role="group" aria-label="Billing interval" className="inline-flex bg-surface-subtle border border-line rounded-full p-1">
          {(['monthly', 'annual'] as const).map((iv) => (
            <button
              key={iv}
              type="button"
              aria-pressed={interval === iv}
              onClick={() => setIntervalState(iv)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${interval === iv ? 'bg-white text-ink shadow-card' : 'text-ink-muted'}`}
            >
              {iv === 'monthly' ? 'Monthly' : 'Annual (2 months free)'}
            </button>
          ))}
        </div>
        {sub.trial_available && !paid && (
          <Button variant="secondary" loading={busy === 'trial'} onClick={trial}>Start 14-day Growth trial, no card</Button>
        )}
      </div>
      <FieldError message={err} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.plans.map((p) => {
          const isCurrent = p.key === current && !onTrial;
          const price = planPrice(p, interval);
          const cta = isCurrent
            ? 'Current plan'
            : PLAN_RANK[p.key] > PLAN_RANK[current] || onTrial
              ? `${onTrial && p.key === current ? 'Subscribe to' : 'Upgrade to'} ${p.name}`
              : `Switch to ${p.name}`;
          return (
            <Card key={p.key} className={isCurrent ? 'ring-2 ring-brand-strong' : ''}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-display font-medium text-ink">{p.name}</h3>
                {isCurrent && <span className="text-[10px] font-bold uppercase bg-brand-tint text-brand-strong rounded-full px-2 py-0.5">Current</span>}
              </div>
              <p className="text-xs text-ink-subtle mt-1">{p.tagline}</p>
              <p className="text-3xl font-display font-medium text-ink mt-4">
                {price === 0 ? 'Free' : formatNaira(price)}
                {price > 0 && <span className="text-xs text-ink-subtle font-normal"> /{interval === 'annual' ? 'year' : 'month'}</span>}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-ink">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="w-3.5 h-3.5 text-brand-strong shrink-0 mt-0.5" aria-hidden />{f}</li>
                ))}
                <li className="flex gap-2 text-ink-subtle">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
                  {formatStorage(p.storage_mb)} storage · {p.seats ? `${p.seats} ${p.seats === 1 ? 'seat' : 'seats'}` : 'unlimited seats'} · {formatCount(p.ai_credits)} credits
                </li>
              </ul>
              <Button
                className="w-full mt-6"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent}
                loading={busy === p.key}
                onClick={(e) => { lastFocus.current = e.currentTarget; void choose(p); }}
              >
                {cta}
              </Button>
              {sub.pending_change?.plan.key === p.key && (
                <p className="text-[11px] text-ink-subtle mt-2">Scheduled for {formatDate(sub.renews_at ?? sub.ends_at)}.</p>
              )}
            </Card>
          );
        })}
      </div>

      {pending && (
        <ModalDialog
          label={`${pending.preview.kind === 'upgrade' || pending.preview.kind === 'checkout' ? 'Upgrade' : 'Change'} to ${pending.plan.name}`}
          onClose={() => !confirming && setPending(null)}
          returnFocusRef={lastFocus}
          overlayClassName="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          className="bg-white border border-line rounded-[24px] p-6 md:p-7 max-w-md w-full shadow-accent space-y-5 outline-none"
        >
          <PreviewBody pending={pending} />
          {modalErr && (
            <div role="alert" className="text-xs text-danger-ink space-y-2">
              <p>{modalErr.message}</p>
              {modalErr.code === 'NO_PAYMENT_METHOD' && (
                <Button variant="secondary" onClick={() => { setPending(null); onNavigate('payment'); }}>Add a card</Button>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled={confirming} onClick={() => setPending(null)}>Not now</Button>
            <Button className="flex-1" loading={confirming} onClick={confirm}>
              {pending.preview.kind === 'checkout' ? 'Continue to Paystack' : 'Confirm'}
            </Button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

function PreviewBody({ pending }: { pending: Pending }): React.JSX.Element {
  const { plan, interval, preview } = pending;
  const price = formatNaira(planPrice(plan, interval));
  const title = (t: string) => <h3 className="text-xl font-display font-medium text-ink">{t}</h3>;
  if (preview.kind === 'checkout') {
    return (
      <div className="space-y-2">
        {title(`Subscribe to ${plan.name}`)}
        <p className="text-xs text-ink-subtle leading-relaxed">
          {price} per {interval === 'annual' ? 'year' : 'month'}. You&rsquo;ll pay on Paystack&rsquo;s secure page, then come back here. We never see your card.
        </p>
      </div>
    );
  }
  if (preview.kind === 'upgrade') {
    return (
      <div className="space-y-3">
        {title(`Upgrade to ${plan.name}`)}
        <p className="text-xs text-ink-subtle">New limits apply immediately. Your new plan starts today and renews on the same day each {interval === 'annual' ? 'year' : 'month'}.</p>
        <div className="bg-surface-subtle border border-line rounded-[24px] p-4 text-xs space-y-2">
          <div className="flex justify-between"><span>{plan.name}, {interval}</span><span className="font-semibold">{price}</span></div>
          {preview.credit_minor > 0 && <div className="flex justify-between"><span>Credit for unused time</span><span className="font-semibold">-{formatNaira(preview.credit_minor)}</span></div>}
          <div className="flex justify-between font-bold text-sm border-t border-line pt-2"><span>Charged today (prorated)</span><span>{formatNaira(preview.amount_due_minor)}</span></div>
        </div>
        <p className="text-[11px] text-ink-subtle">This charges your saved card.</p>
      </div>
    );
  }
  const toStarter = plan.key === 'starter';
  return (
    <div className="space-y-2">
      {title(toStarter ? 'Move to Starter' : `Downgrade to ${plan.name}`)}
      <p className="text-xs text-ink-subtle leading-relaxed">
        You keep your current features until {formatDate(preview.keeps_until)}. Nothing is charged or refunded. Your data is kept;
        features above {plan.name} lock after that date.
      </p>
    </div>
  );
}
