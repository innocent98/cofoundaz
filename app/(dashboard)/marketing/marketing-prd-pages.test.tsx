import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import type {
  CalendarEntry,
  Campaign,
  CampaignPerformance,
  CampaignReadout,
  CopyGeneration,
  MarketingAnalytics,
  RecordedMetric,
  Segment,
} from '@/lib/api/marketing';

// Shapes follow cofoundaz-api/docs/fe-integration-guide-marketing-prd.md (live captures).

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
let search = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/marketing',
  useSearchParams: () => search,
}));
vi.mock('@/components/shell-top-bar', () => ({ ShellTopBar: ({ title }: { title: string }) => <div data-testid="shell-top-bar">{title}</div> }));
vi.mock('@/components/marketing-hub/charts', () => ({
  SERIES_METRICS: [
    { value: 'impressions', label: 'Impressions' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'conversions', label: 'Conversions' },
    { value: 'spend', label: 'Spend' },
  ],
  SeriesChart: ({ series, metric }: { series: unknown[]; metric: string }) => <div data-testid="series-chart">{metric}:{series.length}</div>,
  ChannelChart: ({ rows, metric }: { rows: unknown[]; metric: string }) => <div data-testid="channel-chart">{metric}:{rows.length}</div>,
}));

const toast = vi.hoisted(() => ({ toast: { show: false, message: '', kind: 'success' }, triggerToast: vi.fn(), runAction: vi.fn() }));
vi.mock('./ToastContext', () => ({ useToast: () => toast, ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/app/(dashboard)/marketing/ToastContext', () => ({ useToast: () => toast, ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const resource = <T,>(data: T, status = 'ready') => ({ data, status, error: null as string | null, reload: vi.fn() });
const hooks = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
}));
vi.mock('@/hooks/useMarketingApi', () => ({
  useCampaign: () => hooks.state.campaign,
  useCampaigns: () => hooks.state.campaigns,
  useCampaignPerformance: () => hooks.state.performance,
  useCampaignReadouts: () => hooks.state.readouts,
  useSegments: () => hooks.state.segments,
  useSegmentAttributes: () => ({ attributes: { text: [], channel_acquired: [], behaviour_tags: { max_tags: 3, max_length: 10 } } }),
  useCopyHistory: () => hooks.state.history,
  useCopyPlatforms: () => ({ platforms: [{ key: 'x', label: 'X', limit: 280, kind: 'hard' }, { key: 'email_subject', label: 'Email subject line', limit: 60, kind: 'recommended' }] }),
  useCalendar: () => hooks.state.calendar,
  useResource: () => resource([]),
}));
vi.mock('@/hooks/useBusinessRecords', () => ({
  useBusinessRecords: () => ({ records: [{ id: 'p1', data: { name: 'Ada' } }], loading: false, error: null }),
}));
vi.mock('@/components/marketing-hub/media-slot', () => ({ MediaSlot: () => <div data-testid="media-slot" />, MediaThumb: () => null }));
vi.mock('@/components/marketing-hub/write-with-ai', () => ({ WriteWithAi: () => <button type="button">Write with AI</button> }));

const gen = vi.hoisted(() => ({ run: vi.fn(), state: { phase: 'idle', generation: null, error: null, busy: false, reset: vi.fn() } }));
vi.mock('@/hooks/useMarketingGeneration', () => ({
  useMarketingGeneration: () => ({ ...gen.state, run: gen.run }),
}));

const api = vi.hoisted(() => ({
  createCalendarEntry: vi.fn(),
  getCopy: vi.fn(),
  exportAnalyticsCsv: vi.fn(),
  listChannels: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  listCalendarEntries: vi.fn(),
  updateCalendarEntry: vi.fn(),
  getCalendarEntry: vi.fn(),
}));
vi.mock('@/lib/api/marketing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/marketing')>('@/lib/api/marketing');
  return { ...actual, ...api };
});

import CampaignDetailPage from './campaigns/[id]/page';
import MarketingCampaignsPage from './campaigns/page';
import MarketingCopyPage from './copy/page';
import MarketingSegmentsPage from './segments/page';
import MarketingCalendarPage from './calendar/page';
import MarketingLayout from './layout';

const campaign: Campaign = {
  id: 'c1',
  startup_id: 's1',
  name: 'Waitlist push',
  objective: 'launch',
  budget: 5000000,
  channel_mix: { email: 60, search: 40 },
  status: 'active',
  metrics: { impressions: 2000, clicks: 100, conversions: 10, spend: 20000, click_through_rate: 5.0, conversion_rate: 10.0 },
  segment_ids: ['seg1'],
  period_start: '2026-10-20',
  period_end: '2026-11-03',
  launched_at: null,
  completed_at: null,
  created_at: '2026-10-20T18:14:36Z',
  updated_at: '2026-10-20T18:14:36Z',
};

const performance: CampaignPerformance = {
  campaign_id: 'c1',
  name: 'Waitlist push',
  range: 'all',
  totals: { impressions: 2000, clicks: 100, conversions: 10, spend: 20000, click_through_rate: 5.0, conversion_rate: 10.0 },
  series: [{ date: '2026-10-20', impressions: 2000, clicks: 100, conversions: 10, spend: 20000 }],
  by_channel: [
    { channel: 'email', share_percent: 60, impressions: 1200, clicks: 60, conversions: 6, spend: 12000, estimated: true },
    { channel: 'search', share_percent: 40, impressions: 800, clicks: 40, conversions: 4, spend: 8000, estimated: true },
  ],
};

const readout: CampaignReadout = {
  id: 'r1',
  campaign_id: 'c1',
  week_start: '2026-10-19',
  status: 'ready',
  output: { headline: 'Clicks are up', summary: 'Email drove most of it.', wins: ['CTR 5%'], watch: [], next_step: 'Shift budget to email.' },
  error: null,
  created_at: '2026-10-20T18:32:44Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  search = new URLSearchParams();
  gen.state = { phase: 'idle', generation: null, error: null, busy: false, reset: vi.fn() };
  toast.runAction.mockImplementation(async (fn: () => Promise<unknown>) => ({ ok: true, value: await fn() }));
  hooks.state = {
    campaign: { campaign: resource(campaign), posts: resource([] as CalendarEntry[]), copy: resource([] as CopyGeneration[]) },
    campaigns: { campaigns: [campaign], status: 'ready', error: null, reload: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
    performance: { performance, ...resource(performance) },
    readouts: { readouts: [readout], ...resource([readout]) },
    segments: { segments: [{ id: 'seg1', name: 'Lagos merchants', est_size: 1200, persona_id: null, definition: {} }], status: 'ready', error: null, reload: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
    history: { history: [], ...resource([]) },
    calendar: { entries: [], backlog: [], status: 'ready', error: null, reload: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  };
});

describe('Marketing layout', () => {
  it('mounts the shared top bar and marks the current section', () => {
    render(<MarketingLayout><p>body</p></MarketingLayout>);
    expect(screen.getByTestId('shell-top-bar')).toHaveTextContent('Marketing Hub');
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Campaigns' })).toHaveAttribute('href', '/marketing/campaigns');
  });
});

describe('Campaign detail', () => {
  // React's `use` reads a settled thenable synchronously, so the page renders without suspending.
  const settled = Object.assign(Promise.resolve({ id: 'c1' }), { status: 'fulfilled', value: { id: 'c1' } });
  const renderDetail = () => render(<CampaignDetailPage params={settled} />);

  it('shows the header, honest numbers note, readout, totals and both charts', async () => {
    renderDetail();
    expect(await screen.findByRole('heading', { name: 'Waitlist push' })).toBeInTheDocument();
    expect(screen.getByText(/Nothing syncs from an ad platform/)).toBeInTheDocument();
    expect(screen.getByText('Clicks are up')).toBeInTheDocument();
    expect(screen.getByText('5.0%')).toBeInTheDocument();
    expect(screen.getByTestId('series-chart')).toHaveTextContent('clicks:1');
    expect(screen.getByTestId('channel-chart')).toHaveTextContent('spend:2');
    expect(screen.getByRole('heading', { name: 'Estimated split by channel' })).toBeInTheDocument();
    expect(screen.getByText(/Estimated\. Numbers recorded for a campaign carry no channel/)).toBeInTheDocument();
  });

  it('offers copy prefilled from the objective and segments, linked to this campaign', async () => {
    renderDetail();
    const link = await screen.findByRole('link', { name: /Write copy for this campaign/ });
    const href = link.getAttribute('href') as string;
    expect(href).toContain('campaign=c1');
    expect(decodeURIComponent(href)).toContain('Launch campaign "Waitlist push" for Lagos merchants');
  });

  it('says plainly when no numbers were recorded, with a way to record some', async () => {
    const empty = { ...performance, series: [], by_channel: [], totals: { impressions: 0, clicks: 0, conversions: 0, spend: 0, click_through_rate: 0, conversion_rate: 0 } };
    hooks.state.performance = { performance: empty, ...resource(empty) };
    renderDetail();
    expect(await screen.findByText(/No numbers recorded for this campaign in this range yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Record a metric' })).toHaveAttribute('href', '/marketing/analytics');
    expect(screen.queryByTestId('series-chart')).toBeNull();
  });

  it('lists linked posts that deep-link into the calendar drawer', async () => {
    hooks.state.campaign = {
      campaign: resource(campaign),
      posts: resource([{ id: 'e1', title: 'Waitlist teaser', channel: 'email', status: 'published', scheduled_at: null }] as CalendarEntry[]),
      copy: resource([] as CopyGeneration[]),
    };
    renderDetail();
    const link = await screen.findByRole('link', { name: /Waitlist teaser/ });
    expect(link).toHaveAttribute('href', '/marketing/calendar?entry=e1');
  });

  it('asks before completing a campaign and only then calls the API', async () => {
    api.listChannels.mockResolvedValue([]);
    api.updateCampaign.mockResolvedValue({ ...campaign, status: 'completed' });
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Complete' }));
    expect(api.updateCampaign).not.toHaveBeenCalled();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Completing a campaign is final');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Complete campaign' }));
    await waitFor(() => expect(api.updateCampaign).toHaveBeenCalledWith('c1', { status: 'completed' }));
  });
});

describe('Campaigns list', () => {
  it('links the name to the detail page and shows CTR / Conv and the period', () => {
    render(<MarketingCampaignsPage />);
    const links = screen.getAllByRole('link', { name: 'Waitlist push' });
    expect(links[0]).toHaveAttribute('href', '/marketing/campaigns/c1');
    expect(screen.getAllByText('5.0% / 10.0%').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Oct 20, 2026 to Nov 3, 2026/).length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: 'Campaigns' })).toBeInTheDocument(); // the phone card list
  });

  it('says "No data yet" for a campaign with zero recorded numbers', () => {
    const quiet = { ...campaign, metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0, click_through_rate: 0, conversion_rate: 0 } };
    hooks.state.campaigns = { campaigns: [quiet], status: 'ready', error: null, reload: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };
    render(<MarketingCampaignsPage />);
    expect(screen.getAllByText('No data yet').length).toBeGreaterThan(0);
  });

  it('confirms before deleting', async () => {
    render(<MarketingCampaignsPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(api.deleteCampaign).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('cannot be undone');
  });

  it('walks the PRD steps with a Content step before Review', async () => {
    api.listCalendarEntries.mockResolvedValue([]);
    render(<MarketingCampaignsPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ New campaign' }));
    fireEvent.change(screen.getByLabelText('Campaign name'), { target: { value: 'Q4 push' } });
    for (const title of ['Audience', 'Channels and budget', 'Content', 'Review']) {
      fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
      expect(screen.getByText(new RegExp(`of 5: ${title}`))).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Create and launch/ })).toBeInTheDocument();
  });
});

describe('AI Copy', () => {
  const generation = (over: Partial<CopyGeneration> = {}): CopyGeneration => ({
    id: 'g1',
    startup_id: 's1',
    campaign_id: null,
    kind: 'copy',
    status: 'ready',
    inputs: { channel: 'organic_social', platform: 'x', key_message: 'Settle the same day', campaign_id: null },
    output: { limit: 280, lengths: [19, 300], platform: 'x', variants: ['Settle today', 'x'.repeat(300)], over_limit: [1] },
    error: null,
    created_at: '2026-10-20T18:32:44Z',
    updated_at: '2026-10-20T18:32:44Z',
    ...over,
  } as CopyGeneration);

  it('shows n / limit per variant and flags the over-limit one in words', async () => {
    const g = generation();
    gen.run.mockResolvedValueOnce(g);
    render(<MarketingCopyPage />);
    fireEvent.change(screen.getByLabelText('Key message'), { target: { value: 'Settle the same day' } });
    fireEvent.change(screen.getByLabelText(/Platform/), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate copy' }));
    expect(await screen.findByText('19 / 280')).toBeInTheDocument();
    expect(screen.getByText(/20 over, the platform will reject it/)).toBeInTheDocument();
    expect(gen.run).toHaveBeenCalledWith(expect.objectContaining({ platform: 'x', key_message: 'Settle the same day' }));
  });

  it('"Use" creates a calendar draft from the variant and opens it', async () => {
    gen.run.mockResolvedValueOnce(generation());
    api.createCalendarEntry.mockResolvedValueOnce({ id: 'new-1' });
    render(<MarketingCopyPage />);
    fireEvent.change(screen.getByLabelText('Key message'), { target: { value: 'Settle the same day' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate copy' }));
    fireEvent.click((await screen.findAllByRole('button', { name: 'Use' }))[0]);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/marketing/calendar?entry=new-1'));
    expect(api.createCalendarEntry).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', scheduled_at: null, body: 'Settle today', channel: 'organic_social' }));
  });

  it('refines a variant with an instruction and shows the refinement', async () => {
    gen.run.mockResolvedValueOnce(generation());
    render(<MarketingCopyPage />);
    fireEvent.change(screen.getByLabelText('Key message'), { target: { value: 'Settle the same day' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate copy' }));
    fireEvent.click((await screen.findAllByRole('button', { name: 'Refine' }))[0]);
    gen.run.mockResolvedValueOnce(generation({
      id: 'g2',
      inputs: { channel: 'organic_social', platform: 'x', key_message: 'Settle the same day', refine: { instruction: 'Make it shorter', variant_index: 0, parent_generation_id: 'g1' } },
      output: { limit: 280, lengths: [12], platform: 'x', variants: ['Same day.'], over_limit: [] },
    }));
    fireEvent.change(screen.getByLabelText('How should it change?'), { target: { value: 'Make it shorter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Refine this variant' }));
    expect(await screen.findByText(/Refined: .Make it shorter./)).toBeInTheDocument();
    expect(gen.run).toHaveBeenLastCalledWith({ parentId: 'g1', variantIndex: 0, instruction: 'Make it shorter' });
    expect(screen.getByText('12 / 280')).toBeInTheDocument();
  });

  it('keeps the whole history on its own tab, labelling refinements', () => {
    hooks.state.history = {
      history: [
        generation(),
        generation({ id: 'g2', inputs: { key_message: 'Settle the same day', refine: { instruction: 'Make it shorter', variant_index: 0, parent_generation_id: 'g1' } } }),
      ],
      ...resource([]),
    };
    render(<MarketingCopyPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByRole('tabpanel', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByText(/Refinement: Make it shorter/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(2);
  });
});

describe('Segments rule builder', () => {
  it('saves only the attributes the server accepts, and shows them as chips', async () => {
    const create = vi.fn().mockResolvedValue({});
    hooks.state.segments = { segments: [], status: 'ready', error: null, reload: vi.fn(), create, update: vi.fn(), remove: vi.fn() };
    render(<MarketingSegmentsPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /New segment|Create your first segment/ })[0]);
    fireEvent.change(screen.getByLabelText('Segment name'), { target: { value: 'Lagos merchants' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: ' Lagos ' } });
    fireEvent.change(screen.getByLabelText('Found us through'), { target: { value: 'email' } });
    const tag = screen.getByLabelText(/Behaviour tags/);
    fireEvent.change(tag, { target: { value: 'trial' } });
    fireEvent.keyDown(tag, { key: 'Enter' });
    fireEvent.change(tag, { target: { value: 'trial' } }); // a duplicate is ignored
    fireEvent.keyDown(tag, { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Estimated size'), { target: { value: '1200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({
      name: 'Lagos merchants',
      est_size: 1200,
      persona_id: null,
      definition: { location: 'Lagos', channel_acquired: 'email', behaviour_tags: ['trial'] },
    });
  });

  it('caps tags at the server limit', () => {
    hooks.state.segments = { segments: [], status: 'ready', error: null, reload: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };
    render(<MarketingSegmentsPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /New segment|Create your first segment/ })[0]);
    const tag = screen.getByLabelText(/Behaviour tags/);
    for (const t of ['a', 'b', 'c', 'd']) {
      fireEvent.change(tag, { target: { value: t } });
      fireEvent.keyDown(tag, { key: 'Enter' });
    }
    expect(within(screen.getByRole('list', { name: 'Behaviour tags' })).getAllByRole('listitem')).toHaveLength(3);
    expect(tag).toBeDisabled();
  });

  it('renders old and unknown definition keys as chips and drops them with a note on edit', () => {
    const old = { id: 's1', name: 'Walk test merchants', est_size: 500, persona_id: null, definition: { description: 'Small merchants', favourite_colour: 'green' } } as unknown as Segment;
    hooks.state.segments = { segments: [old], status: 'ready', error: null, reload: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };
    render(<MarketingSegmentsPage />);
    expect(screen.getByText('Small merchants')).toBeInTheDocument();
    expect(screen.getByText('favourite_colour: green')).toBeInTheDocument();
    expect(screen.getByText(/\(your estimate\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText(/older fields \(description, favourite_colour\)/)).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });
});

describe('Content calendar', () => {
  it('uses the PRD empty state with "Plan my first week"', () => {
    render(<MarketingCalendarPage />);
    expect(screen.getByRole('heading', { name: 'An empty calendar is a silent brand.' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Plan my first week/ }).length).toBeGreaterThan(0);
  });

  it('states that published is a status only and offers month and week views', () => {
    render(<MarketingCalendarPage />);
    expect(screen.getByText(/Status only, not posted to a platform/)).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Calendar view' });
    expect(within(group).getByRole('button', { name: 'month' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(group).getByRole('button', { name: 'week' }));
    expect(screen.getByRole('group', { name: 'Week view' })).toBeInTheDocument();
  });

  it('opens the post drawer with Write with AI, an image slot, a campaign and the honest status note', () => {
    render(<MarketingCalendarPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ New post' }));
    const dialog = screen.getByRole('dialog', { name: 'New post' });
    expect(within(dialog).getByRole('button', { name: 'Write with AI' })).toBeInTheDocument();
    expect(within(dialog).getByTestId('media-slot')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Campaign')).toBeInTheDocument();
    expect(within(dialog).getByText(/Status only, not posted to a platform/)).toBeInTheDocument();
  });

  it('refuses to schedule a post into the past, since the server would mark it published at once', () => {
    render(<MarketingCalendarPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ New post' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Teaser' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'scheduled' } });
    fireEvent.change(screen.getByLabelText('Date and time'), { target: { value: '2020-01-01T09:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add post' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/marked published straight away/);
  });

  it('opens the drawer from a notification link (?entry=)', async () => {
    search = new URLSearchParams('entry=e1');
    const e = { id: 'e1', title: 'Waitlist teaser', channel: 'organic_social', status: 'published', body: 'Hi', media: null, campaign_id: null, scheduled_at: '2026-10-20T18:11:36Z', published_at: '2026-10-20T18:11:36Z' } as CalendarEntry;
    api.listCalendarEntries.mockResolvedValue([]);
    api.getCalendarEntry.mockResolvedValue(e);
    render(<MarketingCalendarPage />);
    expect(await screen.findByRole('dialog', { name: 'Edit post' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Waitlist teaser');
    expect(screen.getByText(/Marked published at/)).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe(''));
  });
});

describe('analytics helpers used by the page', () => {
  it('keeps the type contract for estimated CAC rows', () => {
    const a: MarketingAnalytics['cac_by_channel'][number] = { channel: 'email', spend: 17000, conversions: 11, cac: 1545, attributed_spend: 12000, attributed_conversions: 6, estimated: true };
    const r: RecordedMetric = { id: 'm1', ts: '2026-10-20', metric: 'visits', value: 999, channel: null, campaign_id: null, campaign_name: null, created_at: '2026-10-20T18:14:39Z' };
    expect(a.estimated && r.value).toBe(999);
  });
});
