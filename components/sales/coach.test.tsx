import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/sales';
import { CallPrepPanel, RolePlayPanel, type AiLimit } from './coach';
import { WinLossDonut, pctOf, winLossSlices } from './analytics-charts';

vi.mock('@/lib/api/sales', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/sales')>('@/lib/api/sales');
  return { ...actual, listAllDeals: vi.fn(), listCoachSessions: vi.fn(), getCallPrep: vi.fn(), requestCallPrep: vi.fn() };
});
vi.mock('@/lib/api/members', () => ({ listMembers: vi.fn().mockResolvedValue([]), memberLabel: () => '' }));
// recharts needs layout; the donut's legend and aria summary are what we assert.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});

const limit: AiLimit = { overBudget: false, resetsAt: '1:00 AM' };
const deal = { id: 'd1', name: 'Kolo pilot', account_name: 'Kolo Co-op' } as api.Deal;

function rp(over: Record<string, unknown> = {}) {
  return {
    session: null,
    busy: null,
    error: null,
    slow: false,
    replying: false,
    start: vi.fn().mockResolvedValue(true),
    open: vi.fn(),
    send: vi.fn().mockResolvedValue(true),
    end: vi.fn(),
    checkAgain: vi.fn(),
    reset: vi.fn(),
    ...over,
  } as unknown as Parameters<typeof RolePlayPanel>[0]['rp'];
}
const session = (over: Partial<api.CoachSession> = {}): api.CoachSession => ({
  id: 's1',
  mode: 'roleplay',
  deal_id: 'd1',
  deal_name: 'Kolo pilot',
  scenario: null,
  persona: 'Skeptical CFO',
  difficulty: 'tough',
  status: 'active',
  scorecard: null,
  scorecard_error: null,
  created_at: '2026-10-21T12:00:00Z',
  ended_at: null,
  messages: [],
  ...over,
});
const msg = (role: 'user' | 'assistant', status: api.CoachMessage['status'], content: string, id: string): api.CoachMessage => ({
  id,
  role,
  status,
  content,
  created_at: '2026-10-21T12:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listAllDeals).mockResolvedValue([deal]);
  vi.mocked(api.listCoachSessions).mockResolvedValue([]);
});

describe('role-play setup', () => {
  it('needs a deal or a scenario, then starts with the chosen setup', async () => {
    const r = rp();
    render(<RolePlayPanel rp={r} limit={limit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start role-play' }));
    expect(screen.getByText('Pick a deal or describe a scenario.')).toBeTruthy();
    expect(r.start).not.toHaveBeenCalled();

    await waitFor(() => expect(screen.getByRole('option', { name: 'Kolo pilot (Kolo Co-op)' })).toBeTruthy());
    await userEvent.selectOptions(screen.getByLabelText('Practise on a deal'), 'd1');
    await userEvent.click(screen.getByRole('radio', { name: 'Tough' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start role-play' }));
    expect(r.start).toHaveBeenCalledWith({ deal_id: 'd1', persona: 'Skeptical CFO', difficulty: 'tough' });
  });

  it('a scenario with a trimmed opening line is sent as typed', async () => {
    const r = rp();
    render(<RolePlayPanel rp={r} limit={limit} />);
    await userEvent.type(screen.getByLabelText('Describe the call'), ' Bakery cold call ');
    await userEvent.click(screen.getByRole('button', { name: 'Procurement lead' }));
    await userEvent.type(screen.getByLabelText('Your opening line (optional)'), 'Hello');
    await userEvent.click(screen.getByRole('button', { name: 'Start role-play' }));
    expect(r.start).toHaveBeenCalledWith({ scenario: 'Bakery cold call', persona: 'Procurement lead', difficulty: 'neutral', message: 'Hello' });
  });

  it('says the daily limit is used up and will not start', async () => {
    render(<RolePlayPanel rp={rp()} limit={{ overBudget: true, resetsAt: '1:00 AM' }} />);
    expect(screen.getByText(/Daily AI limit used up/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Start role-play' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('lists recent calls with their score and reopens one', async () => {
    vi.mocked(api.listCoachSessions).mockResolvedValue([
      session({ id: 'old', status: 'ended', scorecard: { scores: { discovery: 6, objection_handling: 7, next_step_close: 4 }, overall: 5.7, feedback: [] } }),
    ]);
    const r = rp();
    render(<RolePlayPanel rp={r} limit={limit} />);
    const row = await screen.findByRole('button', { name: /Kolo pilot/ });
    expect(row.textContent).toContain('5.7/10');
    await userEvent.click(row);
    expect(r.open).toHaveBeenCalledWith('old');
  });
});

describe('role-play chat', () => {
  it('labels the buyer, disables input and End session while it replies', () => {
    const s = session({ messages: [msg('user', 'ready', 'Hi', 'u1'), msg('assistant', 'generating', '', 'b1')] });
    render(<RolePlayPanel rp={rp({ session: s, replying: true })} limit={limit} />);
    expect(screen.getByText('The buyer is replying...')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'End session' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Your response to the buyer') as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText('Practice call')).toBeTruthy();
  });

  it('sends on Enter, clears the input only when accepted, and ends the call', async () => {
    const r = rp({ session: session({ messages: [msg('user', 'ready', 'Hi', 'u1'), msg('assistant', 'ready', 'Go on', 'b1')] }) });
    render(<RolePlayPanel rp={r} limit={limit} />);
    const input = screen.getByLabelText('Your response to the buyer') as HTMLInputElement;
    await userEvent.type(input, 'Tell me more{Enter}');
    expect(r.send).toHaveBeenCalledWith('Tell me more');
    await waitFor(() => expect(input.value).toBe(''));
    await userEvent.click(screen.getByRole('button', { name: 'End session' }));
    expect(r.end).toHaveBeenCalled();
  });

  it('keeps the typed text when the API refuses the turn', async () => {
    const r = rp({ session: session({ messages: [msg('user', 'ready', 'Hi', 'u1'), msg('assistant', 'ready', 'Go on', 'b1')] }), send: vi.fn().mockResolvedValue(false) });
    render(<RolePlayPanel rp={r} limit={limit} />);
    const input = screen.getByLabelText('Your response to the buyer') as HTMLInputElement;
    await userEvent.type(input, 'Tell me more{Enter}');
    expect(input.value).toBe('Tell me more');
  });

  it('End session stays disabled until the seller has said something', () => {
    render(<RolePlayPanel rp={rp({ session: session() })} limit={limit} />);
    expect((screen.getByRole('button', { name: 'End session' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Say hello to the buyer/)).toBeTruthy();
  });

  it('a failed buyer turn is not a dead session: it says so and the input stays usable', () => {
    const s = session({ messages: [msg('user', 'ready', 'Hi', 'u1'), msg('assistant', 'failed', '', 'b1')] });
    render(<RolePlayPanel rp={rp({ session: s })} limit={limit} />);
    expect(screen.getByText("The buyer couldn't reply. Try sending again.")).toBeTruthy();
    expect((screen.getByLabelText('Your response to the buyer') as HTMLInputElement).disabled).toBe(false);
  });

  it('a slow reply offers Check again', async () => {
    const s = session({ messages: [msg('user', 'ready', 'Hi', 'u1'), msg('assistant', 'generating', '', 'b1')] });
    const r = rp({ session: s, slow: true });
    render(<RolePlayPanel rp={r} limit={limit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(r.checkAgain).toHaveBeenCalled();
  });
});

describe('role-play scoring and scorecard', () => {
  it('shows Scoring your call while the scorecard is written', () => {
    render(<RolePlayPanel rp={rp({ session: session({ status: 'scoring' }) })} limit={limit} />);
    expect(screen.getByText('Scoring your call')).toBeTruthy();
  });

  it('renders the three scores out of 10, the feedback, and Practice this again with the same setup', async () => {
    const card: api.Scorecard = {
      scores: { discovery: 6, objection_handling: 8, next_step_close: 3 },
      overall: 5.7,
      feedback: ['Ask what a missed payout costs them.', 'Name a date for the next step.'],
    };
    const s = session({ status: 'ended', scorecard: card, messages: [msg('user', 'ready', 'Hi', 'u1')] });
    const r = rp({ session: s });
    render(<RolePlayPanel rp={r} limit={limit} />);
    expect(screen.getByText('6/10')).toBeTruthy();
    expect(screen.getByText('8/10')).toBeTruthy();
    expect(screen.getByText('3/10')).toBeTruthy();
    expect(screen.getByText('Overall 5.7/10')).toBeTruthy();
    expect(screen.getByText('Name a date for the next step.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Practice this again' }));
    expect(r.start).toHaveBeenCalledWith({ deal_id: 'd1', persona: 'Skeptical CFO', difficulty: 'tough' });
  });

  it('a failed scorecard is honest about the budget and Try again ends the call again', async () => {
    const r = rp({ session: session({ status: 'ended', scorecard_error: 'over_budget' }) });
    render(<RolePlayPanel rp={r} limit={limit} />);
    expect(screen.getByText("We couldn't score this call")).toBeTruthy();
    expect(screen.getByText(/daily AI limit/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(r.end).toHaveBeenCalled();
  });
});

describe('call prep', () => {
  const output: api.CallPrepOutput = {
    context: 'Proposal sent last week.',
    call_goal: 'Agree a pilot start date.',
    objections: [{ objection: 'Riders will not trust an app.', response: 'Lead with the licensed partner bank.' }],
    discovery_questions: ['How do riders save today?', 'What does a missed payout cost?', 'Who signs off?'],
  };
  const prepRow = (over: Partial<api.CallPrep> = {}): api.CallPrep => ({
    id: 'p1',
    deal_id: 'd1',
    status: 'ready',
    output,
    error: null,
    created_at: '2026-10-21T12:00:00Z',
    ...over,
  });

  it('has an honest empty state when there are no deals', async () => {
    vi.mocked(api.listAllDeals).mockResolvedValue([]);
    render(<CallPrepPanel dealId="" onDealChange={vi.fn()} limit={limit} />);
    expect(await screen.findByText('No deals to prep for yet')).toBeTruthy();
  });

  it('generate for a deal with no prep, then shows the brief', async () => {
    vi.mocked(api.getCallPrep).mockResolvedValue(null);
    vi.mocked(api.requestCallPrep).mockResolvedValue(prepRow({ status: 'generating', output: null }));
    render(<CallPrepPanel dealId="d1" onDealChange={vi.fn()} limit={limit} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Generate call prep' }));
    expect(api.requestCallPrep).toHaveBeenCalledWith('d1');
    expect(await screen.findByText('Writing your call prep...')).toBeTruthy();
  });

  it('renders context, objections with responses, the goal and 3 questions, and can regenerate', async () => {
    vi.mocked(api.getCallPrep).mockResolvedValue(prepRow());
    vi.mocked(api.requestCallPrep).mockResolvedValue(prepRow({ id: 'p2', status: 'generating', output: null }));
    render(<CallPrepPanel dealId="d1" onDealChange={vi.fn()} limit={limit} />);
    expect(await screen.findByText('Proposal sent last week.')).toBeTruthy();
    expect(screen.getByText('Riders will not trust an app.')).toBeTruthy();
    expect(screen.getByText(/Lead with the licensed partner bank/)).toBeTruthy();
    expect(screen.getByText('Agree a pilot start date.')).toBeTruthy();
    expect(screen.getAllByRole('listitem').filter((li) => li.textContent?.includes('?')).length).toBeGreaterThanOrEqual(3);
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(api.requestCallPrep).toHaveBeenCalledWith('d1');
  });

  it('a failed prep over budget says so and offers no retry while the limit holds', async () => {
    vi.mocked(api.getCallPrep).mockResolvedValue(prepRow({ status: 'failed', output: null, error: 'over_budget' }));
    render(<CallPrepPanel dealId="d1" onDealChange={vi.fn()} limit={{ overBudget: true, resetsAt: '1:00 AM' }} />);
    expect((await screen.findAllByText(/daily AI limit/)).length).toBeGreaterThan(0);
    expect((screen.getByRole('button', { name: 'Try again' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('win/loss donut', () => {
  const wl: api.SalesAnalytics['win_loss'] = {
    won: 2,
    lost: 2,
    win_rate_pct: 50,
    loss_reasons: [
      { reason: 'price', count: 1, value_minor: 9000000 },
      { reason: 'timing', count: 1, value_minor: 0 },
    ],
  };

  it('slices are Won plus each loss reason, shares of every closed deal', () => {
    expect(winLossSlices(wl).map((s) => [s.label, s.count])).toEqual([['Won', 2], ['Lost: Price', 1], ['Lost: Timing', 1]]);
    expect(pctOf(1, 4)).toBe('25%');
    expect(pctOf(0, 0)).toBe('0%');
  });

  it('renders an accessible summary and a legend with percentages and lost value', () => {
    render(<WinLossDonut winLoss={wl} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Won 2 (50%)');
    expect(screen.getByText('Lost: Price')).toBeTruthy();
    expect(screen.getByText('₦90,000.00 lost')).toBeTruthy();
    expect(screen.getByText('50%', { selector: 'span.text-2xl' })).toBeTruthy();
  });

  it('says so when nothing closed in the period', () => {
    render(<WinLossDonut winLoss={{ won: 0, lost: 0, win_rate_pct: null, loss_reasons: [] }} />);
    expect(screen.getByText('No deals were closed in this period.')).toBeTruthy();
  });
});
