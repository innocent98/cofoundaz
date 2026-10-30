'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ModalDialog } from '@/components/modal-dialog';
import { apiErrorInfo } from '@/lib/api/api-error';
import { cancelSubscription, listPaymentMethods, resumeSubscription, type Subscription } from '@/lib/api/billing';
import { formatDate, formatNaira, planStatusLine } from '@/lib/billing-format';
import { Banner, Button, Card, FieldError, Label, Select, Spinner } from '../ui';
import { useAsync } from './use-async';

type View = 'plans' | 'payment' | 'usage';

const REASONS = [
  'Too expensive right now',
  'Not using it enough',
  'Missing a feature I need',
  'Switching to something else',
  "My startup is winding down",
];

export function OverviewView({
  sub,
  onChanged,
  onNavigate,
}: {
  sub: Subscription;
  onChanged: () => Promise<void> | void;
  onNavigate: (v: View) => void;
}): React.JSX.Element {
  const cards = useAsync(listPaymentMethods, "We couldn't load your card.");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState<'cancel' | 'resume' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isPaid = sub.plan.key !== 'starter' && sub.status !== 'trialing';
  const defaultCard = cards.data?.find((c) => c.is_default) ?? cards.data?.[0] ?? null;
  const pi = sub.payment_issue;

  const cancel = async () => {
    setBusy('cancel');
    setErr(null);
    try {
      const r = await cancelSubscription(reason);
      setCancelOpen(false);
      toast.success(`Cancelled. You keep ${sub.plan.name} until ${formatDate(r.ends_at)}.`);
      await onChanged();
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't cancel your plan.");
      setErr(info.code === 'NOT_SUBSCRIBED' ? 'There is no paid plan to cancel.' : info.message);
    } finally {
      setBusy(null);
    }
  };

  const resume = async () => {
    setBusy('resume');
    setErr(null);
    try {
      await resumeSubscription();
      toast.success('Your plan will renew as normal.');
      await onChanged();
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't resume your plan.");
      if (info.code === 'NO_PAYMENT_METHOD') {
        setErr('Add a card first, then resume your plan.');
        onNavigate('payment');
      } else setErr(info.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {pi && (
        <Banner
          tone="error"
          title="Your last payment failed"
          action={<Button variant="danger" onClick={() => onNavigate('payment')}>Fix payment</Button>}
        >
          Update your payment method to keep your workspace active, {pi.grace_days_left} {pi.grace_days_left === 1 ? 'day' : 'days'} left
          in the grace period (until {formatDate(pi.grace_ends_at)}). After that you move to Starter limits.
        </Banner>
      )}
      {sub.status === 'trialing' && (
        <Banner
          tone="info"
          title={`Your ${sub.plan.name} trial ends on ${formatDate(sub.trial_ends_at ?? sub.ends_at)}`}
          action={<Button onClick={() => onNavigate('plans')}>Subscribe</Button>}
        >
          You&rsquo;ll move to Starter unless you subscribe. Nothing is locked until then.
        </Banner>
      )}
      {sub.cancel_at_period_end && (
        <Banner
          tone="warn"
          title={`Your plan ends on ${formatDate(sub.ends_at)}`}
          action={<Button loading={busy === 'resume'} onClick={resume}>Keep my plan</Button>}
        >
          You keep {sub.plan.name} until then. Your data is kept for 90 days after.{sub.cancel_reason ? ` Reason given: ${sub.cancel_reason}.` : ''}
        </Banner>
      )}
      {sub.pending_change && !sub.cancel_at_period_end && (
        <Banner tone="info" title={`Moving to ${sub.pending_change.plan.name} on ${formatDate(sub.renews_at ?? sub.ends_at)}`}>
          You keep {sub.plan.name} features until then.
        </Banner>
      )}
      <FieldError message={err} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 bg-brand-900 text-white rounded-[24px] p-6 md:p-8 flex flex-col justify-between gap-8 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-neutral-xa3b3a6 uppercase tracking-wider">Current plan</span>
              <h2 className="text-2xl font-display font-medium mt-1">{sub.plan.name}</h2>
              <p className="text-xs text-neutral-xa3b3a6 mt-1">
                {planStatusLine(sub)}
                {sub.plan.key !== 'starter' && sub.status !== 'trialing' && ` · billed ${sub.interval}`}
              </p>
            </div>
            <div className="text-3xl font-display font-medium">
              {sub.status === 'trialing' ? 'Free trial' : sub.price_minor === 0 ? 'Free' : formatNaira(sub.price_minor)}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate('plans')}>Change plan</Button>
            <Button variant="secondary" onClick={() => onNavigate('payment')}>Payment method</Button>
            {isPaid && !sub.cancel_at_period_end && (
              <Button variant="ghost" className="!text-white/80 hover:!bg-white/10" onClick={() => { setErr(null); setCancelOpen(true); }}>
                Cancel plan
              </Button>
            )}
          </div>
        </div>

        <Card>
          <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
            {sub.cancel_at_period_end ? 'Plan ends' : sub.status === 'trialing' ? 'Trial ends' : 'Next invoice'}
          </span>
          {sub.cancel_at_period_end || sub.status === 'trialing' ? (
            <p className="text-3xl font-display font-medium text-ink mt-2">{formatDate(sub.ends_at)}</p>
          ) : sub.renews_at ? (
            <>
              <p className="text-3xl font-display font-medium text-ink mt-2">{formatNaira(sub.price_minor)}</p>
              <p className="text-xs text-ink-subtle">on {formatDate(sub.renews_at)}</p>
            </>
          ) : (
            <p className="text-sm text-ink-subtle mt-2">Nothing to pay. Starter is free.</p>
          )}
          <div className="pt-4 mt-4 border-t border-line text-xs">
            {cards.loading ? (
              <Spinner label="Loading card" />
            ) : defaultCard ? (
              <p className="font-semibold text-ink capitalize">
                {defaultCard.brand ?? 'Card'} •••• {defaultCard.last4}
                {defaultCard.exp_month && <span className="font-normal text-ink-subtle normal-case"> · expires {defaultCard.exp_month}/{defaultCard.exp_year}</span>}
              </p>
            ) : (
              <p className="text-ink-subtle">No card saved.</p>
            )}
          </div>
        </Card>
      </div>

      <Button variant="secondary" onClick={() => onNavigate('usage')}>See usage</Button>

      {cancelOpen && (
        <ModalDialog
          label="Cancel your plan"
          onClose={() => busy !== 'cancel' && setCancelOpen(false)}
          overlayClassName="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          className="bg-white border border-line rounded-[24px] p-6 md:p-7 max-w-md w-full shadow-accent space-y-5 outline-none"
        >
          <h3 className="text-xl font-display font-medium text-ink">Before you go</h3>
          <p className="text-xs text-ink-subtle leading-relaxed">
            You keep {sub.plan.name} until {formatDate(sub.renews_at)}, then move to Starter. Your data is kept for 90 days.
            You can change your mind any time before then.
          </p>
          <div>
            <Label htmlFor="cancel-reason">What is driving this?</Label>
            <Select id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <FieldError message={err} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled={busy === 'cancel'} onClick={() => setCancelOpen(false)}>Keep my plan</Button>
            <Button variant="danger" className="flex-1" loading={busy === 'cancel'} onClick={cancel}>Cancel plan</Button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
