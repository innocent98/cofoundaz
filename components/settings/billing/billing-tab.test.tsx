import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BillingTab } from './billing-tab';
import type { Subscription } from '@/lib/api/billing';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams('tab=billing'),
}));
vi.mock('@/lib/api/billing', async (orig) => ({ ...(await orig<typeof import('@/lib/api/billing')>()), verifyReference: vi.fn(), listPaymentMethods: vi.fn().mockResolvedValue([]) }));

const sub = (over: Partial<Subscription>): Subscription => ({
  plan: { key: 'growth', name: 'Growth' }, interval: 'monthly', status: 'active', price_minor: 2400000, currency: 'NGN',
  current_period_start: null, renews_at: '2026-11-27T12:00:00+00:00', ends_at: null, trial_ends_at: null, trial_available: false,
  cancel_at_period_end: false, cancel_reason: null, pending_change: null, payment_issue: null, enforcement: false, ...over,
});

describe('BillingTab', () => {
  it('tells non-founders billing is managed by the founder and shows no billing sections', () => {
    render(<BillingTab isFounder={false} sub={null} subError={null} reloadSub={vi.fn()} />);
    expect(screen.getByText('Billing is managed by your workspace founder.')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Billing sections' })).toBeNull();
  });

  it('shows the failed-payment banner with grace days and a Fix payment button', async () => {
    render(
      <BillingTab
        isFounder
        sub={sub({ status: 'past_due', payment_issue: { failed_at: '2026-10-27T00:00:00+00:00', grace_ends_at: '2026-11-03T00:00:00+00:00', grace_days_left: 7 } })}
        subError={null}
        reloadSub={vi.fn()}
      />,
    );
    expect(screen.getByText('Your last payment failed')).toBeTruthy();
    expect(screen.getByText(/7 days left/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fix payment' })).toBeTruthy();
  });

  it('offers Keep my plan for a canceling plan and never a pause option', () => {
    render(
      <BillingTab isFounder sub={sub({ cancel_at_period_end: true, renews_at: null, ends_at: '2026-11-27T12:00:00+00:00' })} subError={null} reloadSub={vi.fn()} />,
    );
    expect(screen.getByText(/Your plan ends on/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Keep my plan' })).toBeTruthy();
    expect(screen.queryByText(/pause/i)).toBeNull();
  });

  it('shows a Retry when the subscription failed to load', () => {
    render(<BillingTab isFounder sub={null} subError="We couldn't load your billing." reloadSub={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
