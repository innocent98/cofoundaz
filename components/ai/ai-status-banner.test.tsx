import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AiStatusBanner } from './ai-status-banner';
import { formatResetTime } from '@/hooks/useAiStatus';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ai',
}));

vi.mock('@/lib/api/ai', () => ({
  getAiStatus: vi.fn().mockResolvedValue({
    data: {
      tokens_used_today: 0,
      daily_budget: 1000,
      over_budget: false,
      resets_at: '',
      recent_enrichment_failures: [],
    },
  }),
}));

describe('AiStatusBanner', () => {
  it('does not render when over_budget is false', async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = render(
        <AiStatusBanner
          status={{
            tokens_used_today: 1000,
            daily_budget: 5000,
            over_budget: false,
            resets_at: '2026-09-27T00:00:00Z',
            recent_enrichment_failures: [],
          }}
        />
      );
      container = res.container;
    });

    expect(container!.firstChild).toBeNull();
  });

  it('renders subtle, non-alarming banner with exact required copy when over_budget is true', async () => {
    const resetsAt = '2026-09-27T00:00:00Z';
    const formattedTime = formatResetTime(resetsAt);

    await act(async () => {
      render(
        <AiStatusBanner
          status={{
            tokens_used_today: 5500,
            daily_budget: 5000,
            over_budget: true,
            resets_at: resetsAt,
            recent_enrichment_failures: [],
          }}
        />
      );
    });

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(
      `AI personalization is paused until ${formattedTime}, your data is never affected.`
    );
  });

  it('renders gracefully if resets_at is missing or null', async () => {
    await act(async () => {
      render(
        <AiStatusBanner
          status={{
            tokens_used_today: 6000,
            daily_budget: 5000,
            over_budget: true,
            resets_at: '',
            recent_enrichment_failures: [],
          }}
        />
      );
    });

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('your data is never affected.');
  });
});
