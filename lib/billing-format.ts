import type { BillingInterval, PlanKey, Subscription, VerifyResult } from '@/lib/api/billing';

/** Kobo to naira text: "₦24,000", "₦44,049.29" (kobo shown only when there are any). */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  const whole = Number.isInteger(naira);
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-NG');
}

/** 5120 MB -> "5 GB"; 512 -> "512 MB". */
export function formatStorage(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

export const PLAN_RANK: Record<PlanKey, number> = { starter: 0, growth: 1, scale: 2 };

export function planPrice(plan: { price_monthly_minor: number; price_annual_minor: number }, interval: BillingInterval): number {
  return interval === 'annual' ? plan.price_annual_minor : plan.price_monthly_minor;
}

/** The `?reference=` Paystack appends when it sends the browser back; null when absent. */
export function checkoutReference(search: string): string | null {
  const p = new URLSearchParams(search);
  const ref = p.get('reference') ?? p.get('trxref');
  return ref && ref.trim() ? ref.trim() : null;
}

export interface VerifyMessage {
  tone: 'success' | 'info' | 'error';
  text: string;
}

/**
 * What to tell the user after the callback verify. Only `status: "paid"` counts as success; the query
 * string never decides that.
 */
export function verifyMessage(v: VerifyResult): VerifyMessage {
  switch (v.outcome) {
    case 'applied':
    case 'already_processed':
      if (v.status !== 'paid') return { tone: 'info', text: "We haven't received this payment yet." };
      if (v.kind === 'addon') return { tone: 'success', text: 'Added. Your AI credits are live now.' };
      if (v.kind === 'card' || v.reference.startsWith('cfz_card')) return { tone: 'success', text: 'Card saved. The ₦50 check is refunded.' };
      return { tone: 'success', text: 'Payment received. Your plan is updated.' };
    case 'duplicate_payment_refunded':
      return { tone: 'info', text: 'You were already subscribed, so this second payment was refunded.' };
    case 'amount_mismatch':
      return { tone: 'error', text: "The amount paid didn't match, so nothing changed. Contact support if you were charged." };
    case 'not_successful':
    default:
      return { tone: 'info', text: "The payment wasn't completed, so nothing changed. You can try again." };
  }
}

/** A short status line for the plan card. */
export function planStatusLine(s: Subscription): string {
  if (s.status === 'trialing') return `Free trial until ${formatDate(s.trial_ends_at ?? s.ends_at)}`;
  if (s.status === 'past_due') return 'Payment failed';
  if (s.cancel_at_period_end) return `Ends ${formatDate(s.ends_at)}`;
  if (s.status === 'active' && s.renews_at) return `Renews ${formatDate(s.renews_at)}`;
  return s.plan.key === 'starter' ? 'No card required' : '';
}

export function creditsPercentTone(percent: number): 'ok' | 'warn' | 'full' {
  return percent >= 100 ? 'full' : percent >= 90 ? 'warn' : 'ok';
}

/** `PLAN_REQUIRED` carries the cheapest unlocking plan in field_errors[0].message. */
export function upgradeTarget(fieldErrors: Array<{ field: string; message: string }>): PlanKey | null {
  const m = fieldErrors.find((f) => f.field === 'plan')?.message;
  return m === 'growth' || m === 'scale' ? m : null;
}
