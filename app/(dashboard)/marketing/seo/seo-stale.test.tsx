import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { ContentGapGeneration } from '@/lib/api/marketing';

const toast = vi.hoisted(() => ({ triggerToast: vi.fn(), runAction: vi.fn() }));
vi.mock('../ToastContext', () => ({ useToast: () => toast }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ workspaceName: 'Acme' }) }));

const state = vi.hoisted(() => ({ history: [] as unknown[] }));
const resource = (data: unknown) => ({ status: 'ready', error: null, reload: vi.fn(), ...(data as object) });
vi.mock('@/hooks/useMarketingApi', () => ({
  useContentGapHistory: () => ({ history: state.history, ...resource({}) }),
  useKeywords: () => resource({ keywords: [], create: vi.fn(), update: vi.fn(), remove: vi.fn() }),
  usePositioning: () => resource({ positioning: null, save: vi.fn() }),
  useTrackedPages: () => resource({ pages: [], create: vi.fn(), toggle: vi.fn(), remove: vi.fn() }),
}));
const gen = vi.hoisted(() => ({ run: vi.fn(), state: { phase: 'idle', generation: null, error: null, busy: false } }));
vi.mock('@/hooks/useMarketingGeneration', () => ({ useMarketingGeneration: () => ({ ...gen.state, run: gen.run }) }));

import MarketingSeoPage from './page';

const run = (over: Partial<ContentGapGeneration> = {}): ContentGapGeneration => ({
  id: 'g1',
  startup_id: 's1',
  kind: 'content_gap',
  status: 'ready',
  inputs: {},
  output: { gaps: [{ title: 'Idea one', angle: 'An angle', target_keyword: 'kw' }] },
  error: null,
  created_at: '2026-10-21T09:00:00Z',
  updated_at: '2026-10-21T09:00:00Z',
  stale: false,
  ...over,
});

const NOTICE = 'Your brand details changed since these ideas were written.';

beforeEach(() => {
  vi.clearAllMocks();
  gen.state = { phase: 'idle', generation: null, error: null, busy: false };
});

describe('SEO content gaps: stale runs', () => {
  it('shows the notice and a Regenerate button, keeping the old ideas visible', () => {
    state.history = [run({ stale: true })];
    render(<MarketingSeoPage />);
    expect(screen.getByText(NOTICE)).toBeInTheDocument();
    expect(screen.getByText('Idea one')).toBeInTheDocument();
    gen.run.mockResolvedValue(null);
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(gen.run).toHaveBeenCalledTimes(1);
  });

  it('shows nothing extra for a fresh run', () => {
    state.history = [run({ stale: false })];
    render(<MarketingSeoPage />);
    expect(screen.queryByText(NOTICE)).toBeNull();
    expect(screen.getByText('Idea one')).toBeInTheDocument();
  });

  it('judges staleness by the newest ready run only, ignoring a running one and older runs', () => {
    state.history = [
      run({ id: 'g3', status: 'generating', stale: null, output: {} }),
      run({ id: 'g2', stale: false }),
      run({ id: 'g1', stale: true }),
    ];
    render(<MarketingSeoPage />);
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  it('hides the notice while the regeneration is running', () => {
    state.history = [run({ stale: true })];
    gen.state = { phase: 'generating', generation: null, error: null, busy: true };
    render(<MarketingSeoPage />);
    expect(screen.queryByText(NOTICE)).toBeNull();
    expect(screen.getByText('Idea one')).toBeInTheDocument();
  });
});
