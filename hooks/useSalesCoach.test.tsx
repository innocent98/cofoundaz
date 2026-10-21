import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/sales';
import { useCallPrep, useRolePlay } from './useSalesCoach';

vi.mock('@/lib/api/sales', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/sales')>('@/lib/api/sales');
  return {
    ...actual,
    createCoachSession: vi.fn(),
    getCoachSession: vi.fn(),
    postCoachMessage: vi.fn(),
    endCoachSession: vi.fn(),
    getCallPrep: vi.fn(),
    requestCallPrep: vi.fn(),
  };
});
vi.mock('@/lib/api/members', () => ({ listMembers: vi.fn().mockResolvedValue([]), memberLabel: () => '' }));

const m = (role: 'user' | 'assistant', status: api.CoachMessage['status'], content = '', id = `${role}-${content || status}`): api.CoachMessage => ({
  id,
  role,
  status,
  content,
  created_at: '2026-10-21T12:00:00Z',
});
const session = (over: Partial<api.CoachSession> = {}): api.CoachSession => ({
  id: 's1',
  mode: 'roleplay',
  deal_id: 'd1',
  deal_name: 'Acme',
  scenario: null,
  persona: 'CFO',
  difficulty: 'neutral',
  status: 'active',
  scorecard: null,
  scorecard_error: null,
  created_at: '2026-10-21T12:00:00Z',
  ended_at: null,
  messages: [],
  ...over,
});

// Advance the 1.5 s poll timer and let the awaited fetch settle.
const tick = async (ms = 1500) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe('useRolePlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('start with an opening line polls until the buyer turn is ready', async () => {
    const generating = session({ messages: [m('user', 'ready', 'Hi'), m('assistant', 'generating', '', 'b1')] });
    const ready = session({ messages: [m('user', 'ready', 'Hi'), m('assistant', 'ready', 'Go on.', 'b1')] });
    vi.mocked(api.createCoachSession).mockResolvedValue(generating);
    vi.mocked(api.getCoachSession).mockResolvedValueOnce(generating).mockResolvedValue(ready);
    const { result } = renderHook(() => useRolePlay());

    await act(async () => {
      await result.current.start({ deal_id: 'd1', persona: 'CFO', difficulty: 'neutral', message: 'Hi' });
    });
    expect(result.current.replying).toBe(true);
    await tick();
    expect(result.current.replying).toBe(true); // still generating
    await tick();
    expect(result.current.replying).toBe(false);
    expect(result.current.session?.messages?.at(-1)?.content).toBe('Go on.');
  });

  it('send appends the seller turn and the pending buyer turn, then follows the reply', async () => {
    vi.mocked(api.createCoachSession).mockResolvedValue(session());
    const { result } = renderHook(() => useRolePlay());
    await act(async () => {
      await result.current.start({ deal_id: 'd1', persona: 'CFO', difficulty: 'neutral' });
    });
    vi.mocked(api.postCoachMessage).mockResolvedValue(m('assistant', 'generating', '', 'b2'));
    vi.mocked(api.getCoachSession).mockResolvedValue(
      session({ messages: [m('user', 'ready', 'Hello', 'u1'), m('assistant', 'ready', 'Hi there', 'b2')] })
    );
    let accepted = false;
    await act(async () => {
      accepted = await result.current.send('Hello');
    });
    expect(accepted).toBe(true);
    expect(result.current.session?.messages?.map((x) => x.role)).toEqual(['user', 'assistant']);
    expect(result.current.replying).toBe(true);
    await tick();
    expect(result.current.replying).toBe(false);
    expect(result.current.session?.messages?.at(-1)?.content).toBe('Hi there');
  });

  it('a 409 while the buyer is replying keeps the seller text and says to wait', async () => {
    vi.mocked(api.createCoachSession).mockResolvedValue(session());
    const { result } = renderHook(() => useRolePlay());
    await act(async () => {
      await result.current.start({ deal_id: 'd1', persona: 'CFO', difficulty: 'neutral' });
    });
    const { ApiError } = await import('@/lib/api/client');
    vi.mocked(api.postCoachMessage).mockRejectedValue(
      new ApiError(409, 'Conflict', { error: { code: 'REPLY_IN_PROGRESS', message: 'The buyer is still replying. Please wait.', field_errors: [] } })
    );
    vi.mocked(api.getCoachSession).mockResolvedValue(session());
    let accepted = true;
    await act(async () => {
      accepted = await result.current.send('Hello');
    });
    expect(accepted).toBe(false);
    expect(result.current.error).toBe('The buyer is still replying. Please wait.');
  });

  it('end moves to scoring and polls until the scorecard lands', async () => {
    vi.mocked(api.createCoachSession).mockResolvedValue(session({ messages: [m('user', 'ready', 'Hi'), m('assistant', 'ready', 'Hello')] }));
    const { result } = renderHook(() => useRolePlay());
    await act(async () => {
      await result.current.start({ deal_id: 'd1', persona: 'CFO', difficulty: 'neutral' });
    });
    const card: api.Scorecard = { scores: { discovery: 6, objection_handling: 7, next_step_close: 4 }, overall: 5.7, feedback: ['Ask about timing.'] };
    vi.mocked(api.endCoachSession).mockResolvedValue(session({ status: 'scoring' }));
    vi.mocked(api.getCoachSession).mockResolvedValue(session({ status: 'ended', scorecard: card }));
    await act(async () => {
      await result.current.end();
    });
    expect(result.current.session?.status).toBe('scoring');
    await tick();
    expect(result.current.session?.status).toBe('ended');
    expect(result.current.session?.scorecard?.overall).toBe(5.7);
  });

  it('gives up after the bounded wait and offers Check again instead of spinning', async () => {
    const generating = session({ messages: [m('user', 'ready', 'Hi'), m('assistant', 'generating', '', 'b1')] });
    vi.mocked(api.createCoachSession).mockResolvedValue(generating);
    vi.mocked(api.getCoachSession).mockResolvedValue(generating);
    const { result } = renderHook(() => useRolePlay());
    await act(async () => {
      await result.current.start({ deal_id: 'd1', persona: 'CFO', difficulty: 'neutral', message: 'Hi' });
    });
    await tick(95_000);
    expect(result.current.slow).toBe(true);
    expect(result.current.replying).toBe(false);
  });

  it('reset cancels a running poll', async () => {
    const generating = session({ messages: [m('user', 'ready', 'Hi'), m('assistant', 'generating', '', 'b1')] });
    vi.mocked(api.createCoachSession).mockResolvedValue(generating);
    vi.mocked(api.getCoachSession).mockResolvedValue(generating);
    const { result } = renderHook(() => useRolePlay());
    await act(async () => {
      await result.current.start({ deal_id: 'd1', persona: 'CFO', difficulty: 'neutral', message: 'Hi' });
    });
    act(() => result.current.reset());
    const calls = vi.mocked(api.getCoachSession).mock.calls.length;
    await tick(10_000);
    expect(vi.mocked(api.getCoachSession).mock.calls.length).toBe(calls);
    expect(result.current.session).toBeNull();
  });
});

describe('useCallPrep', () => {
  const prep = (over: Partial<api.CallPrep> = {}): api.CallPrep => ({
    id: 'p1',
    deal_id: 'd1',
    status: 'generating',
    output: null,
    error: null,
    created_at: '2026-10-21T12:00:00Z',
    ...over,
  });
  beforeEach(() => vi.clearAllMocks());

  it('a deal with no prep loads null, generate polls to ready', async () => {
    vi.mocked(api.getCallPrep).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useCallPrep('d1'));
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    expect(result.current.prep).toBeNull();

    vi.mocked(api.requestCallPrep).mockResolvedValue(prep());
    const output = { context: 'c', call_goal: 'g', objections: [{ objection: 'o', response: 'r' }], discovery_questions: ['q'] };
    vi.mocked(api.getCallPrep).mockResolvedValue(prep({ status: 'ready', output }));
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.generating).toBe(true);
    await waitFor(() => expect(result.current.prep?.status).toBe('ready'), { timeout: 4000 });
    expect(result.current.prep?.output?.call_goal).toBe('g');
    expect(result.current.generating).toBe(false);
  });

  it('a 409 CALL_PREP_IN_PROGRESS follows the prep already being written', async () => {
    vi.mocked(api.getCallPrep).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useCallPrep('d1'));
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    const { ApiError } = await import('@/lib/api/client');
    vi.mocked(api.requestCallPrep).mockRejectedValue(
      new ApiError(409, 'Conflict', { error: { code: 'CALL_PREP_IN_PROGRESS', message: 'x', field_errors: [] } })
    );
    vi.mocked(api.getCallPrep).mockResolvedValue(prep({ status: 'failed', error: 'over_budget' }));
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.prep?.status).toBe('failed'), { timeout: 4000 });
  });
});
