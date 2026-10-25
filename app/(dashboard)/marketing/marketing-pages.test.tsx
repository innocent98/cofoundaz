import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { MarketingAnalytics } from '@/lib/api/marketing';

const analyticsState: { value: unknown } = { value: null };
const campaignsState: { value: unknown } = { value: null };

vi.mock('@/hooks/useMarketingApi', () => ({
  useAnalytics: () => analyticsState.value,
  useCampaigns: () => campaignsState.value,
  useRecordedMetrics: () => ({ page: { metrics: [], total: 0, limit: 25, offset: 0 }, status: 'ready', error: null, reload: vi.fn(), showMore: vi.fn(), remove: vi.fn() }),
}));
vi.mock('./ToastContext', () => ({
  useToast: () => ({ triggerToast: vi.fn(), runAction: vi.fn() }),
}));

import MarketingAnalyticsPage from './analytics/page';

const emptyAnalytics: MarketingAnalytics = {
  range: '30d',
  traffic_by_week: [],
  cac_by_channel: [],
  funnel: { impressions: 0, clicks: 0, conversions: 0, click_through_rate: 0, conversion_rate: 0 },
  leaderboard: [],
};

beforeEach(() => {
  campaignsState.value = { campaigns: [], status: 'ready', error: null, reload: vi.fn() };
});

describe('Marketing analytics page', () => {
  it('shows an honest empty state with a working CTA when nothing has been recorded', () => {
    analyticsState.value = { analytics: emptyAnalytics, status: 'ready', error: null, reload: vi.fn() };
    render(<MarketingAnalyticsPage />);
    expect(screen.getByText('No performance data yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Record your first metric/ })).toBeTruthy();
    // No fabricated CAC rows or leaderboard from the old mock.
    expect(screen.queryByText(/Referral/)).toBeNull();
  });

  it('renders real numbers, gap-filled weeks, and "no conversions" for a null CAC', () => {
    analyticsState.value = {
      analytics: {
        range: '30d',
        traffic_by_week: [
          { week_start: '2026-09-14', visits: 310 },
          { week_start: '2026-09-28', visits: 420 },
        ],
        cac_by_channel: [{ channel: 'search', spend: 30000, conversions: 0, cac: null }],
        funnel: { impressions: 8000, clicks: 640, conversions: 52, click_through_rate: 8.0, conversion_rate: 8.1 },
        leaderboard: [{ campaign_id: 'c1', name: 'Q4 launch push', clicks: 640, conversions: 21, spend: 25000, cac: 1190 }],
      } satisfies MarketingAnalytics,
      status: 'ready',
      error: null,
      reload: vi.fn(),
    };
    render(<MarketingAnalyticsPage />);
    expect(screen.getByText('8,000')).toBeTruthy();
    expect(screen.getByText('8.1%')).toBeTruthy();
    expect(screen.getByText('No conversions yet')).toBeTruthy();
    expect(screen.getByText('Q4 launch push')).toBeTruthy();
    expect(screen.getByRole('img', { name: /2026-09-21 0/ })).toBeTruthy();
  });

  it('renders "not available for your role" on a 403 instead of crashing', () => {
    analyticsState.value = { analytics: null, status: 'forbidden', error: 'x', reload: vi.fn() };
    render(<MarketingAnalyticsPage />);
    expect(screen.getByText('Not available for your role')).toBeTruthy();
  });

  it('shows the error and a retry on a failed load', () => {
    analyticsState.value = { analytics: null, status: 'error', error: 'Database is down.', reload: vi.fn() };
    render(<MarketingAnalyticsPage />);
    expect(screen.getByText('Database is down.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
