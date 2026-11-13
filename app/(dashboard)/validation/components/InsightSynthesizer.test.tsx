import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { RawInsight } from '@/lib/api/validation';

// The "New pattern detected" notification always links to /validation/interviews?insight={id}
// (its payload carries no source), so the tab has to move to the report's own source.

const nav = vi.hoisted(() => ({ pathname: '/validation/interviews', insight: 'r1' as string | null, replace: vi.fn() }));
const insights = vi.hoisted(() => ({ read: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.insight ? { insight: nav.insight } : {}),
}));
vi.mock('../layout', () => ({ useToast: () => ({ triggerToast: vi.fn() }) }));
vi.mock('@/hooks/useInsights', () => ({
  useInsights: () => ({
    synthesizing: false,
    synthesize: vi.fn(),
    history: vi.fn(),
    read: insights.read,
    remove: vi.fn(),
    apply: vi.fn(),
  }),
}));

import { InsightSynthesizer } from './InsightSynthesizer';

const report = (source: RawInsight['source']): RawInsight => ({
  id: 'r1',
  source,
  inputs: { open_answers: 4 },
  patterns: [{ id: 'p1', theme: 'Price is too high', summary: 'Most say the fee is too high.', quotes: [] }],
  contradictions: [],
  suggestions: [],
  created_at: '2026-11-13T10:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  nav.pathname = '/validation/interviews';
  nav.insight = 'r1';
});

describe('InsightSynthesizer notification deep link', () => {
  it('moves a Surveys report from the Interviews tab to the Surveys tab', async () => {
    insights.read.mockResolvedValue(report('surveys'));
    render(<InsightSynthesizer source="interviews" />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/validation/surveys?insight=r1'));
  });

  it('moves an all-sources report to the MVP tab', async () => {
    insights.read.mockResolvedValue(report('all'));
    render(<InsightSynthesizer source="interviews" />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/validation/mvp?insight=r1'));
  });

  it('opens the report in place when it is already on its own tab', async () => {
    nav.pathname = '/validation/surveys';
    insights.read.mockResolvedValue(report('surveys'));
    render(<InsightSynthesizer source="surveys" />);
    await waitFor(() => expect(insights.read).toHaveBeenCalledWith('r1'));
    expect(await screen.findByText('Price is too high')).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('shows an error and stays put when the linked report cannot be read', async () => {
    insights.read.mockRejectedValue(new Error('network down'));
    render(<InsightSynthesizer source="interviews" />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
