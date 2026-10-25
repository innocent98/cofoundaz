import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { axe } from 'jest-axe';
import HealthOverviewPage from './page';
import DimensionPage from './dimensions/[dim]/page';
import HistoryPage from './history/page';
import BenchmarksPage from './benchmarks/page';
import RecommendationsPage from './recommendations/page';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ dim: 'financial' }),
  redirect: vi.fn(),
  usePathname: () => '/health',
}));
// jsdom has no layout, so recharts renders nothing useful: assert what we hand it.
vi.mock('@/components/health/health-charts', () => ({
  DimensionsRadar: () => <div data-testid="radar" />,
  DimensionTrendChart: () => <div data-testid="dim-trend" />,
  Sparkline: ({ values }: { values: number[] }) => <div data-testid="sparkline">{values.join(',')}</div>,
  ScoreHistoryChart: ({ markers }: { markers?: unknown[] }) => <div data-testid="history-chart">{markers?.length ?? 0} markers</div>,
}));

let role: string | null = 'founder';
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ role }) }));

let overview: Record<string, unknown>;
const refetchOverview = vi.fn();
vi.mock('@/components/health/health-score-provider', () => ({
  useHealthOverview: () => ({ ...overview, refetch: refetchOverview }),
}));

let dimension: Record<string, unknown>;
const refetchDim = vi.fn();
let historyState: Record<string, unknown>;
const historyRanges: string[] = [];
const refetchHistory = vi.fn();
let bench: Record<string, unknown>;
const refetchBench = vi.fn();
let recsState: Record<string, unknown>;
const recFns = { accept: vi.fn(), dismiss: vi.fn(), refetch: vi.fn() };
const recFilters: string[] = [];
vi.mock('@/hooks/useHealthDetails', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useHealthDetails')>('@/hooks/useHealthDetails');
  return {
    ...actual,
    useHealthDimension: () => ({ ...dimension, refetch: refetchDim }),
    useHealthHistory: (r: string) => {
      historyRanges.push(r);
      return { ...historyState, refetch: refetchHistory };
    },
    useHealthBenchmarks: () => ({ ...bench, refetch: refetchBench }),
    useHealthRecommendations: (f: string) => {
      recFilters.push(f);
      return { ...recsState, ...recFns };
    },
  };
});

const dim = (score: number, band: string, trend: number[]) => ({ score, band, trend, label: '', key: '', status: 'strong' });
const okOverview = (over: Record<string, unknown> = {}) => ({
  loading: false,
  error: null,
  ...over,
  data: {
    status: 'ok',
    score: 92,
    weeklyDelta: 2,
    band: 'thriving',
    stage: '',
    message: '',
    summary: "You're thriving for idea stage. Team is carrying you; Legal is holding you back.",
    dimensions: {
      product: dim(99, 'thriving', [89, 78, 100]),
      market: dim(87, 'thriving', [88]),
      financial: dim(98, 'thriving', [86, 57, 100]),
      legal: dim(74, 'healthy', [100, 0, 75]),
      team: dim(100, 'thriving', [88, 100]),
    },
    topRecommendations: [
      { id: 'r1', title: 'Track your money in and out', rationale: 'Record this month.', estimatedLift: 10, effort: 'low', actionUrl: '/finance', dimension: 'Financial' },
    ],
    ...((over.data as object) ?? {}),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  role = 'founder';
  historyRanges.length = 0;
  recFilters.length = 0;
  overview = okOverview();
});

describe('Overview', () => {
  it('draws each sparkline from the dimension trend, not a fixed curve', () => {
    render(<HealthOverviewPage />);
    const lines = screen.getAllByTestId('sparkline').map((n) => n.textContent);
    expect(lines).toEqual(['89,78,100', '88', '86,57,100', '100,0,75', '88,100']);
  });

  it('shows the PRD summary and a Do it link to the recommendation href', () => {
    render(<HealthOverviewPage />);
    expect(screen.getByText(/You're thriving for idea stage/)).toBeTruthy();
    expect(screen.getByText('est. +10 pts')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Do it' }).getAttribute('href')).toBe('/finance');
  });

  it('hides Do it for a role that cannot open the route', () => {
    role = 'mentor';
    render(<HealthOverviewPage />);
    expect(screen.queryByRole('link', { name: 'Do it' })).toBeNull();
  });

  it('says "+1 pt" for a one point estimate', () => {
    overview = okOverview({ data: { topRecommendations: [{ id: 'r1', title: 'T', rationale: 'R', estimatedLift: 1, effort: 'low', actionUrl: '/finance', dimension: 'Financial' }] } });
    render(<HealthOverviewPage />);
    expect(screen.getByText('est. +1 pt')).toBeTruthy();
  });

  it('a failed load is an error with Retry, never the assessment CTA', () => {
    overview = okOverview({ error: new Error('x') });
    render(<HealthOverviewPage />);
    expect(screen.queryByText('Take your assessment')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(refetchOverview).toHaveBeenCalled();
  });

  it('pending_assessment shows the assessment CTA', () => {
    overview = okOverview({ data: { status: 'pending_assessment', message: 'Complete your kickoff assessment.' } });
    render(<HealthOverviewPage />);
    expect(screen.getByRole('link', { name: 'Take your assessment' }).getAttribute('href')).toBe('/assessment');
  });

  it('says so when every signal is on target', () => {
    overview = okOverview({ data: { topRecommendations: [] } });
    render(<HealthOverviewPage />);
    expect(screen.getByText('Nothing to fix right now')).toBeTruthy();
  });

  it('opens an accessible calculation dialog and closes on Escape', () => {
    render(<HealthOverviewPage />);
    fireEvent.click(screen.getByRole('button', { name: 'How is this calculated?' }));
    expect(screen.getByRole('dialog', { name: 'How is this calculated?' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(<HealthOverviewPage />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('Dimension drill-down', () => {
  const signals = [
    { key: 'assessment.money', label: 'Kickoff assessment', value: 43, unit: 'score', target: 100, contribution: 8.6, source: 'assessment', href: '/assessment', source_ref: 'a' },
    { key: 'money.transactions_30d', label: 'Transactions tracked (30 days)', value: 0, unit: 'count', target: 3, contribution: 0, source: 'live', status: 'ok', href: '/finance', source_ref: '/finance' },
    { key: 'money.runway_live', label: 'Runway', value: 999, unit: 'months', target: 12, contribution: 4.2, source: 'live', status: 'not_burning', href: '/finance/runway', source_ref: '/finance/runway' },
  ];
  beforeEach(() => {
    dimension = {
      loading: false,
      notFound: false,
      error: null,
      detail: {
        key: 'money',
        label: 'Financial',
        score: 98,
        band: 'thriving',
        signals,
        trend: [{ score: 86, computed_at: '2026-10-17T17:20:49Z' }],
        recommendations: [{ id: 'r1', dimension: 'money', key: 'k', title: 'Track your money in and out', body: 'b', estimated_lift: 10, effort: 'low', status: 'pending', priority: 1, href: '/finance' }],
      },
    };
  });

  it('renders the PRD columns with real labels, targets, contribution and source links', () => {
    render(<DimensionPage />);
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Signal', 'Current', 'Target for stage', 'Contribution', 'Source']);
    const row = screen.getByText('Transactions tracked (30 days)').closest('tr')!;
    expect(within(row).getByText('3')).toBeTruthy();
    expect(within(row).getByRole('link', { name: 'Finance' }).getAttribute('href')).toBe('/finance');
    expect(screen.getByText('+8.6 pts')).toBeTruthy();
  });

  it('shows Profitable, never 999 months', () => {
    render(<DimensionPage />);
    expect(screen.getByText('Profitable')).toBeTruthy();
    expect(screen.queryByText(/999/)).toBeNull();
  });

  it('a recommendation has a Do it link to its href', () => {
    render(<DimensionPage />);
    expect(screen.getByRole('link', { name: 'Do it' }).getAttribute('href')).toBe('/finance');
  });

  it('hides Do it for a role that cannot open the route', () => {
    role = 'mentor';
    render(<DimensionPage />);
    expect(screen.queryByRole('link', { name: 'Do it' })).toBeNull();
  });

  it('a load error offers Retry', () => {
    dimension = { loading: false, notFound: false, error: 'boom', detail: null };
    render(<DimensionPage />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(refetchDim).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<DimensionPage />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('History', () => {
  const point = (score: number) => ({ score, delta: 0, dimension_scores: {}, computed_at: '2026-10-17T17:20:49Z', trigger: 'nightly' });
  beforeEach(() => {
    historyState = {
      loading: false,
      error: null,
      points: [point(90), point(92)],
      markers: [{ at: '2026-10-17T17:20:49Z', label: 'Business plan generated', action: 'business_plan.generated' }],
    };
  });

  it('offers the PRD ranges 30, 90 and 365 days and requests the chosen one', () => {
    render(<HistoryPage />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['30 days', '90 days', '365 days']);
    fireEvent.click(screen.getByRole('button', { name: '365 days' }));
    expect(historyRanges.at(-1)).toBe('365d');
  });

  it('passes markers to the chart and lists them as text', () => {
    render(<HistoryPage />);
    expect(screen.getByTestId('history-chart').textContent).toBe('1 markers');
    expect(screen.getByText('Business plan generated')).toBeTruthy();
  });

  it('empty range and error states', () => {
    historyState = { loading: false, error: null, points: [], markers: [] };
    const { unmount } = render(<HistoryPage />);
    expect(screen.getByText(/No history in the last/)).toBeTruthy();
    unmount();
    historyState = { loading: false, error: 'boom', points: [], markers: [] };
    render(<HistoryPage />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(refetchHistory).toHaveBeenCalled();
  });
});

describe('Benchmarks', () => {
  it('thin cohort: empty state quotes the API minimum', () => {
    bench = { loading: false, error: null, benchmarks: { status: 'insufficient_data', cohort: { stage: 'idea', industry: 'Fintech' }, min_cohort_size: 10, percentiles: null } };
    render(<BenchmarksPage />);
    expect(screen.getByText(/at least 10 other startups/)).toBeTruthy();
    expect(screen.queryByText(/Better than/)).toBeNull();
  });

  it('enough peers: a bar per row with the percentile copy', () => {
    const row = (you: number, yp: number) => ({ p25: 50, p50: 65, p75: 80, you, your_percentile: yp });
    bench = {
      loading: false,
      error: null,
      benchmarks: { status: 'ok', cohort: { stage: 'idea', industry: 'Fintech', size_at_least: 15 }, min_cohort_size: 10, percentiles: { money: row(98, 97), overall: row(92, 91) } },
    };
    render(<BenchmarksPage />);
    expect(screen.getByText('Better than 91% of similar startups')).toBeTruthy();
    expect(screen.getByText('Better than 97% of similar startups')).toBeTruthy();
    // Overall first, money labelled Financial.
    const labels = screen.getAllByRole('img').map((n) => n.getAttribute('aria-label')?.split(':')[0]);
    expect(labels).toEqual(['Overall', 'Financial']);
  });

  it('error offers Retry', () => {
    bench = { loading: false, error: 'boom', benchmarks: null };
    render(<BenchmarksPage />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(refetchBench).toHaveBeenCalled();
  });
});

describe('Recommendations', () => {
  const rec = { id: 'r1', dimension: 'money', key: 'k', title: 'Track your money in and out', body: 'b', estimated_lift: 10, effort: 'low', status: 'pending', priority: 1, href: '/finance' };
  beforeEach(() => {
    recsState = { loading: false, error: null, recs: [rec] };
    recFns.accept.mockResolvedValue({ ok: true });
    recFns.dismiss.mockResolvedValue({ ok: true });
  });

  it('Start accepts then goes to the recommendation href', async () => {
    render(<RecommendationsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/finance'));
    expect(recFns.accept).toHaveBeenCalledWith('r1');
  });

  it('a failed Start stays put and shows the row error', async () => {
    recFns.accept.mockResolvedValue({ ok: false, error: 'That recommendation was already actioned.' });
    render(<RecommendationsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(await screen.findByText('That recommendation was already actioned.')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('Dismiss does not navigate', async () => {
    render(<RecommendationsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(recFns.dismiss).toHaveBeenCalledWith('r1'));
    expect(push).not.toHaveBeenCalled();
  });

  it('shows the Financial label, not the API key "money"', () => {
    render(<RecommendationsPage />);
    expect(screen.getByText(/Effort: low · Financial/)).toBeTruthy();
    expect(screen.getByText('est. +10 pts')).toBeTruthy();
  });

  it.each(['mentor', 'business_consultant', 'team_member'])('%s cannot Start or Dismiss, only Open where the role can see the route', (who) => {
    role = who;
    recsState = { loading: false, error: null, recs: [{ ...rec, href: who === 'team_member' ? '/finance' : '/validation/interviews' }] };
    render(<RecommendationsPage />);
    expect(screen.queryByRole('button', { name: /Start/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    if (who === 'team_member') expect(screen.getByRole('link', { name: /Open/ }).getAttribute('href')).toBe('/finance');
    else expect(screen.queryByRole('link', { name: /Open/ })).toBeNull();
  });

  it('accepted items link back to the work', () => {
    render(<RecommendationsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Accepted' }));
    expect(recFilters.at(-1)).toBe('accepted');
    expect(screen.getByRole('link', { name: /Open/ }).getAttribute('href')).toBe('/finance');
  });

  it('error offers Retry', () => {
    recsState = { loading: false, error: 'boom', recs: [] };
    render(<RecommendationsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(recFns.refetch).toHaveBeenCalled();
  });
});
