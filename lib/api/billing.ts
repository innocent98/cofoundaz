import { API_BASE, apiClient } from './client';

// Settings → Billing (Paystack hosted checkout). Founder only, except GET /billing/plans.
// Contract: cofoundaz-api/docs/fe-integration-guide-settings-billing.md. Money is kobo (`*_minor`), currency NGN.

async function call<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await apiClient<{ data: T }>(endpoint, options);
  return res.data;
}

const post = (body: unknown = {}, idempotencyKey?: string): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
  ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}),
});

/** One key per user action (a confirm click); reuse it for retries of that same action. */
export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type PlanKey = 'starter' | 'growth' | 'scale';
export type BillingInterval = 'monthly' | 'annual';

export interface Plan {
  key: PlanKey;
  name: string;
  tagline: string;
  currency: string;
  price_monthly_minor: number;
  price_annual_minor: number;
  ai_credits: number;
  /** null means unlimited. */
  seats: number | null;
  storage_mb: number;
  features: string[];
  modules: string[];
}

export interface Addon {
  key: string;
  name: string;
  description: string;
  credits: number;
  price_minor: number;
}

export interface PlansPayload {
  plans: Plan[];
  addons: Addon[];
}

export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface PlanRef {
  key: PlanKey;
  name: string;
}

export interface PaymentIssue {
  failed_at: string;
  grace_ends_at: string;
  grace_days_left: number;
}

export interface Subscription {
  plan: PlanRef;
  interval: BillingInterval;
  status: SubscriptionStatus;
  price_minor: number;
  currency: string;
  current_period_start: string | null;
  renews_at: string | null;
  /** Set while canceling or trialing. Show this or `renews_at`, never both. */
  ends_at: string | null;
  trial_ends_at: string | null;
  trial_available: boolean;
  cancel_at_period_end: boolean;
  cancel_reason: string | null;
  pending_change: { plan: PlanRef; interval: BillingInterval } | null;
  payment_issue: PaymentIssue | null;
  enforcement: boolean;
}

export interface Usage {
  cycle: { starts_on: string; resets_on: string };
  ai_credits: { used: number; limit: number; percent: number; from_packs: number; tokens_per_credit: number };
  /** limit null means unlimited. */
  seats: { used: number; limit: number | null };
  storage: { used_mb: number; limit_mb: number };
  daily: Array<{ date: string; credits: number }>;
  breakdown: Array<{ feature: string; runs: number; credits: number; share: number }>;
}

export interface Invoice {
  id: string;
  number: string;
  kind: 'subscription' | 'upgrade' | 'addon';
  description: string;
  amount_minor: number;
  currency: string;
  status: 'paid' | 'failed';
  date: string;
}

export interface PaymentMethod {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: string | null;
  exp_year: string | null;
  bank: string | null;
  is_default: boolean;
}

export interface BillingDetails {
  company_name: string | null;
  tax_id: string | null;
  address: string | null;
}

export interface CheckoutLink {
  authorization_url: string;
  reference: string;
}

export interface VerifyResult {
  reference: string;
  kind: string;
  status: string;
  outcome: 'applied' | 'already_processed' | 'not_successful' | 'amount_mismatch' | 'duplicate_payment_refunded';
}

export interface ChangePreview {
  kind: 'upgrade' | 'downgrade' | 'cancel' | 'checkout' | 'free' | 'same';
  amount_due_minor: number;
  credit_minor: number;
  effective: 'now' | 'period_end';
  currency: string;
  keeps_until: string | null;
}

export type ChangeResult =
  | { result: 'applied'; amount_charged_minor: number }
  | { result: 'scheduled'; effective_at: string }
  | ({ result: 'checkout' } & CheckoutLink);

export const getPlans = (): Promise<PlansPayload> => call('/billing/plans');
export const getSubscription = (): Promise<Subscription> => call('/billing/subscription');
export const startTrial = (): Promise<Subscription> => call('/billing/trial', post());
export const getUsage = (): Promise<Usage> => call('/billing/usage');
export const listInvoices = (): Promise<Invoice[]> => call('/billing/invoices');
export const listPaymentMethods = (): Promise<PaymentMethod[]> => call('/billing/payment-methods');
export const getBillingDetails = (): Promise<BillingDetails> => call('/billing/details');

export const saveBillingDetails = (d: BillingDetails): Promise<BillingDetails> =>
  call('/billing/details', { method: 'PUT', body: JSON.stringify(d) });

export const startCheckout = (plan: 'growth' | 'scale', interval: BillingInterval, key: string): Promise<CheckoutLink> =>
  call('/billing/subscription/checkout', post({ plan, interval }, key));

export const verifyReference = (reference: string): Promise<VerifyResult> =>
  call(`/billing/subscription/verify?reference=${encodeURIComponent(reference)}`);

export const previewChange = (plan: PlanKey, interval: BillingInterval): Promise<ChangePreview> =>
  call('/billing/subscription/preview-change', post({ plan, interval }));

export const changePlan = (plan: PlanKey, interval: BillingInterval, key: string): Promise<ChangeResult> =>
  call('/billing/subscription/change', post({ plan, interval }, key));

export const cancelSubscription = (reason: string): Promise<{ cancel_at_period_end: boolean; ends_at: string }> =>
  call('/billing/subscription/cancel', post({ reason }));

export const resumeSubscription = (): Promise<Subscription> => call('/billing/subscription/resume', post());

export const addPaymentMethod = (): Promise<CheckoutLink> => call('/billing/payment-methods', post());

export const setDefaultPaymentMethod = (id: string): Promise<unknown> =>
  call(`/billing/payment-methods/${id}/default`, { method: 'PUT' });

export const removePaymentMethod = (id: string): Promise<unknown> =>
  call(`/billing/payment-methods/${id}`, { method: 'DELETE' });

export const purchaseAddon = (key: string, idempotencyKey: string): Promise<CheckoutLink> =>
  call(`/billing/addons/${key}/purchase`, post({}, idempotencyKey));

/** The receipt needs the bearer token, so it is fetched then handed to the browser as a blob. */
export async function downloadInvoicePdf(inv: Pick<Invoice, 'id' | 'number'>): Promise<void> {
  const token = localStorage.getItem('cf_token');
  const ws = localStorage.getItem('cf_workspace_id');
  const res = await fetch(`${API_BASE}/billing/invoices/${inv.id}/pdf`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(ws ? { 'X-Workspace-Id': ws } : {}) },
  });
  if (!res.ok) throw new Error('Could not download the receipt.');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `${inv.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

