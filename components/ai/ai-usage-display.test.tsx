import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AiUsageDisplay } from './ai-usage-display';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ai/settings',
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

describe('AiUsageDisplay', () => {
  it('displays "Unlimited" gracefully and skips any progress bar when daily_budget is null', async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = render(
        <AiUsageDisplay
          status={{
            tokens_used_today: 42000,
            daily_budget: null,
            over_budget: false,
            resets_at: '2026-09-27T00:00:00Z',
            recent_enrichment_failures: [],
          }}
          loading={false}
        />
      );
      container = res.container;
    });

    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.getByText('42,000')).toBeInTheDocument();

    // Verify progress bar is NOT rendered
    expect(screen.queryByText(/% of daily budget/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Usage progress/i)).not.toBeInTheDocument();
    expect(container!.querySelector('.h-2.bg-\\[\\#EBEBE6\\]')).toBeNull();
  });

  it('displays quota progress and division when daily_budget is provided', async () => {
    await act(async () => {
      render(
        <AiUsageDisplay
          status={{
            tokens_used_today: 4000,
            daily_budget: 10000,
            over_budget: false,
            resets_at: '2026-09-27T00:00:00Z',
            recent_enrichment_failures: [],
          }}
          loading={false}
        />
      );
    });

    expect(screen.getByText('10,000 tokens')).toBeInTheDocument();
    expect(screen.getByText('4,000')).toBeInTheDocument();
    expect(screen.getByText('40% of daily budget')).toBeInTheDocument();
  });

  it('renders recent enrichment failures quietly without breaking', async () => {
    await act(async () => {
      render(
        <AiUsageDisplay
          status={{
            tokens_used_today: 1500,
            daily_budget: 10000,
            over_budget: false,
            resets_at: '2026-09-27T00:00:00Z',
            recent_enrichment_failures: [
              { type: 'persona_synthesis', failed_at: '2026-09-26T14:30:00Z' },
              { type: 'market_signals', failed_at: null },
            ],
          }}
          loading={false}
        />
      );
    });

    expect(screen.getByText('persona_synthesis')).toBeInTheDocument();
    expect(screen.getByText('market_signals')).toBeInTheDocument();
    expect(screen.getByText('2 recorded')).toBeInTheDocument();
  });
});
