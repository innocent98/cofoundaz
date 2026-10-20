import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DashboardPage from './page';
import { mapSummary } from '@/hooks/useDashboardApi';

const push = vi.fn();
const openAiDrawer = vi.fn();
const refetch = vi.fn();
let role = 'founder';
let summary: { data: ReturnType<typeof mapSummary> | null; loading: boolean; error: Error | null } = { data: null, loading: true, error: null };

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/dashboard' }));
vi.mock('@/components/ai-drawer-context', () => ({ useAiDrawer: () => ({ openAiDrawer }) }));
vi.mock('@/components/workspace-context', () => ({
  useWorkspace: () => ({ me: null, workspaceId: 's', workspaceName: 'NovaPay', role, loading: false }),
}));
vi.mock('@/components/dashboardnavbar', () => ({
  DashboardNavbar: ({ onInvite }: { onInvite: () => void }) => <button onClick={onInvite}>+ Invite</button>,
}));
vi.mock('@/components/team/invite-modal', () => ({
  InviteModal: ({ open }: { open: boolean }) => (open ? <div role="dialog">Invite dialog</div> : null),
}));
vi.mock('@/hooks/useMissionOpenCount', () => ({ announceMissionChanged: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: vi.fn().mockResolvedValue({}) }));
vi.mock('@/hooks/useDashboardApi', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useDashboardApi')>()),
  useDashboardSummary: () => ({ ...summary, refetch }),
  useActivityFeed: () => ({ data: [], loading: false, error: null, refetch: vi.fn() }),
  useAIBriefing: () => ({ acceptAction: vi.fn().mockResolvedValue({ action_index: 0, kind: 'task', href: null, mission_task: null }) }),
}));

const payload = (over: Record<string, unknown> = {}) => ({
  greeting: { salutation: 'Good evening', first_name: 'Victor', startup_name: 'NovaPay' },
  health: { status: 'ok', score: 93, delta_7d: 3, summary: 'Your Health Score is 93.' },
  mission: { streak: 0, status: 'pending', empty_reason: null, tasks: [{ id: 't1', title: 'Interview customers', status: 'todo', order: 0 }] },
  upcoming: [{ id: 'm1', title: 'Write your problem statement', due_on: '2026-10-24', milestone_id: 'm1' }],
  kpis: { tasks_done_this_week: 0, metrics: {} },
  calibration: { assessment_complete: true },
  briefing: {
    status: 'ready',
    id: 'b1',
    message: 'NovaPay is at the idea stage.',
    actions: [{ index: 0, label: 'Interview 3 customers', kind: 'task', href: '/validation', accepted: false, mission_task_id: null }],
  },
  risks: { status: 'ready', items: [{ index: 0, severity: 'high', text: 'Runway is short.', href: '/finance' }] },
  opportunities: { status: 'ready', items: [{ index: 0, text: 'Add a task.', href: '/validation' }] },
  ...over,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    role = 'founder';
    summary = { data: mapSummary(payload()), loading: false, error: null };
  });

  it('first paint is skeletons: no fake name, no Health 0, no default copy', () => {
    summary = { data: null, loading: true, error: null };
    render(<DashboardPage />);
    expect(screen.queryByText(/Founder/)).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText(/kickoff assessment/)).toBeNull();
    expect(screen.queryByText(/your workspace/)).toBeNull();
    expect(screen.getByRole('status', { name: 'Loading your dashboard' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Loading Startup Health' })).toBeTruthy();
    expect(screen.getByRole('status', { name: "Loading Today's Mission" })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Loading your AI Briefing' })).toBeTruthy();
    expect(screen.getAllByRole('status', { name: 'Loading KPI' })).toHaveLength(5);
  });

  it('renders the real greeting and every card', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Good (morning|afternoon|evening), Victor\.$/);
    expect(screen.getByText("Here's where NovaPay stands today.")).toBeTruthy();
    expect(screen.getByText('Startup Health')).toBeTruthy();
    expect(screen.getByText('Interview customers')).toBeTruthy();
    expect(screen.getByText('NovaPay is at the idea stage.')).toBeTruthy();
    expect(screen.getByText('Runway is short.')).toBeTruthy();
    expect(screen.getByText('Add a task.')).toBeTruthy();
    expect(screen.getByText('Due Oct 24, 2026')).toBeTruthy();
  });

  it('an empty first_name never renders "Good evening, ."', () => {
    summary = { data: mapSummary(payload({ greeting: { salutation: 'Good evening', first_name: '', startup_name: 'NovaPay' } })), loading: false, error: null };
    render(<DashboardPage />);
    const h1 = screen.getByRole('heading', { level: 1 }).textContent ?? '';
    expect(h1).toMatch(/^Good (morning|afternoon|evening)\.$/);
    expect(h1).not.toContain(', .');
  });

  it('calibration banner appears when the assessment is not complete and links to it', () => {
    summary = { data: mapSummary(payload({ calibration: { assessment_complete: false } })), loading: false, error: null };
    render(<DashboardPage />);
    expect(screen.getByText(/running on defaults/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Complete assessment' }).getAttribute('href')).toBe('/assessment');
  });

  it('no calibration banner once the assessment is done', () => {
    render(<DashboardPage />);
    expect(screen.queryByText(/running on defaults/)).toBeNull();
  });

  it('restricted roles: briefing, risks and opportunities cards are hidden', () => {
    summary = {
      data: mapSummary(
        payload({
          briefing: { status: 'restricted', message: null, id: null, actions: [] },
          risks: { status: 'restricted', message: null, items: [] },
          opportunities: { status: 'restricted', message: null, items: [] },
        }),
      ),
      loading: false,
      error: null,
    };
    render(<DashboardPage />);
    expect(screen.queryByText('Your AI Briefing')).toBeNull();
    expect(screen.queryByText('Risks')).toBeNull();
    expect(screen.queryByText('Opportunities')).toBeNull();
    expect(screen.getByText('Startup Health')).toBeTruthy();
  });

  it('mission_status restricted: no Mission card, no "no roadmap" empty state, no Tasks tile, no "Go to mission" link', () => {
    role = 'mentor';
    summary = {
      data: mapSummary(
        payload({
          mission: null,
          mission_status: 'restricted',
          kpis: { tasks_done_this_week: 3, metrics: {} },
          briefing: { status: 'restricted', message: null, id: null, actions: [] },
          risks: { status: 'restricted', message: null, items: [] },
          opportunities: { status: 'restricted', message: null, items: [] },
        }),
      ),
      loading: false,
      error: null,
    };
    render(<DashboardPage />);
    expect(screen.queryByText("Today's Mission")).toBeNull();
    expect(screen.queryByText(/kickoff assessment/)).toBeNull();
    expect(screen.queryByText('Tasks This Week')).toBeNull();
    expect(screen.queryByRole('link', { name: /Go to mission/ })).toBeNull();
    expect(screen.getByText('Startup Health')).toBeTruthy();
  });

  it('mission_status ok with mission null is still the no-roadmap empty state', () => {
    summary = { data: mapSummary(payload({ mission: null, mission_status: 'ok' })), loading: false, error: null };
    render(<DashboardPage />);
    expect(screen.getByText(/kickoff assessment/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Go to mission/ })).toBeTruthy();
  });

  it('an older API without mission_status still hides the card for a role that cannot open the mission', () => {
    role = 'business_consultant';
    summary = { data: mapSummary(payload({ mission: null })), loading: false, error: null };
    render(<DashboardPage />);
    expect(screen.queryByText("Today's Mission")).toBeNull();
    expect(screen.queryByText(/kickoff assessment/)).toBeNull();
  });

  it('a failed summary errors every summary card on its own with the PRD copy and a working Retry', () => {
    summary = { data: null, loading: false, error: new Error('500') };
    render(<DashboardPage />);
    expect(screen.getAllByText('Couldn’t load this.').length).toBeGreaterThanOrEqual(6);
    expect(screen.queryByText('Unable to load dashboard')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading Startup Health' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('Tell me more opens the AI drawer seeded with the briefing as context', () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByText('Tell me more'));
    expect(openAiDrawer).toHaveBeenCalledTimes(1);
    const arg = openAiDrawer.mock.calls[0][0] as { seed: string };
    expect(arg.seed).toContain("Tell me more about today's briefing.");
    expect(arg.seed).toContain('NovaPay is at the idea stage.');
  });

  it('Do it saves the action and refetches the summary', async () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Do it: Interview 3 customers' }));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('ticking a mission task completes it on the server (PATCH) and refetches; toast on success', async () => {
    const { apiClient } = await import('@/lib/api/client');
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete task: Interview customers' }));
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith('/missions/tasks/t1', { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) }));
    expect(await screen.findByText('Nice. Mission progress saved.')).toBeTruthy();
    expect(refetch).toHaveBeenCalled();
  });

  it('a failed completion says so instead of pretending it saved', async () => {
    const { apiClient } = await import('@/lib/api/client');
    vi.mocked(apiClient).mockRejectedValueOnce(new Error('x'));
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete task: Interview customers' }));
    expect(await screen.findByText('Couldn’t save that. Try again.')).toBeTruthy();
    expect(screen.queryByText('Nice. Mission progress saved.')).toBeNull();
  });

  it('+ Invite opens the invite modal', () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Invite' }));
    expect(screen.getByRole('dialog').textContent).toBe('Invite dialog');
  });

  it('mission weekend-off copy replaces the old wrong "complete your kickoff assessment" message', () => {
    summary = {
      data: mapSummary(payload({ mission: { streak: 0, status: 'pending', tasks: [], empty_reason: 'weekend_off' } })),
      loading: false,
      error: null,
    };
    render(<DashboardPage />);
    expect(screen.getByText('Weekends off. Rest is a strategy too.')).toBeTruthy();
    expect(screen.queryByText(/kickoff assessment/)).toBeNull();
  });
});
