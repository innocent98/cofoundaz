import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from './client';
import {
  aiFailureMessage,
  buyerTurnFailed,
  createCoachSession,
  endCoachSession,
  errorCodeOf,
  formatCycle,
  getAnalytics,
  getCallPrep,
  isCallPrepInProgress,
  isReplyInProgress,
  listCoachSessions,
  monthLabel,
  pendingBuyerTurn,
  postCoachMessage,
  presetRange,
  rangeError,
  requestCallPrep,
  sellerHasSpoken,
  setupOf,
  type CoachMessage,
} from './sales';

vi.mock('./client', () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      public statusText: string,
      public data: unknown
    ) {
      super(`API Error ${status}: ${statusText}`);
    }
  }
  return { apiClient: vi.fn(), ApiError, API_BASE: '/api/v1' };
});

const api = () => vi.mocked(clientModule.apiClient);
const ApiErr = clientModule.ApiError;
const ok = <T,>(data: T) => ({ data, meta: null });
const conflict = (code: string) => new ApiErr(409, 'Conflict', { error: { code, message: 'x', field_errors: [] } });
const msg = (role: 'user' | 'assistant', status: CoachMessage['status'], content = ''): CoachMessage => ({
  id: `${role}-${status}`,
  role,
  status,
  content,
  created_at: '2026-10-21T12:00:00Z',
});

beforeEach(() => vi.clearAllMocks());

describe('coach client: request shapes (paths and bodies from the live guide)', () => {
  it('POST /sales/coach/sessions sends the setup and returns the unwrapped session', async () => {
    api().mockResolvedValueOnce(ok({ id: 's1', status: 'active' }));
    const s = await createCoachSession({ deal_id: 'd1', persona: 'Skeptical CFO', difficulty: 'tough', message: 'Hi' });
    expect(s.id).toBe('s1');
    const [path, init] = api().mock.calls[0];
    expect(path).toBe('/sales/coach/sessions');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ deal_id: 'd1', persona: 'Skeptical CFO', difficulty: 'tough', message: 'Hi' });
  });

  it('posts a turn, ends a call, lists history with limit', async () => {
    api().mockResolvedValue(ok({}));
    await postCoachMessage('s 1', 'hello');
    await endCoachSession('s1');
    await listCoachSessions({ limit: 5 });
    expect(api().mock.calls.map((c) => c[0])).toEqual([
      '/sales/coach/sessions/s%201/messages',
      '/sales/coach/sessions/s1/end',
      '/sales/coach/sessions?limit=5',
    ]);
    expect(JSON.parse((api().mock.calls[0][1] as RequestInit).body as string)).toEqual({ content: 'hello' });
  });

  it('call prep: GET returns null for a deal with none, POST requests one', async () => {
    api().mockResolvedValueOnce(ok(null));
    expect(await getCallPrep('d1')).toBeNull();
    api().mockResolvedValueOnce(ok({ id: 'p1', status: 'generating' }));
    expect((await requestCallPrep('d1')).status).toBe('generating');
    expect(api().mock.calls.map((c) => c[0])).toEqual(['/sales/deals/d1/call-prep', '/sales/deals/d1/call-prep']);
    expect((api().mock.calls[1][1] as RequestInit).method).toBe('POST');
  });

  it('analytics sends only the range it was given', async () => {
    api().mockResolvedValue(ok({}));
    await getAnalytics({ from: '2026-09-22', to: '2026-10-21' });
    await getAnalytics();
    expect(api().mock.calls.map((c) => c[0])).toEqual(['/sales/analytics?from=2026-09-22&to=2026-10-21', '/sales/analytics']);
  });
});

describe('coach helpers', () => {
  it('Practice this again reuses the setup, deal or scenario, without an opening line', () => {
    expect(setupOf({ deal_id: 'd1', scenario: null, persona: 'CFO', difficulty: 'tough' })).toEqual({ deal_id: 'd1', persona: 'CFO', difficulty: 'tough' });
    expect(setupOf({ deal_id: null, scenario: 'Cold call', persona: 'Owner', difficulty: 'friendly' })).toEqual({
      scenario: 'Cold call',
      persona: 'Owner',
      difficulty: 'friendly',
    });
  });

  it('reads the buyer turn state from the thread', () => {
    expect(pendingBuyerTurn([msg('user', 'ready'), msg('assistant', 'generating')])?.status).toBe('generating');
    expect(pendingBuyerTurn([msg('user', 'ready'), msg('assistant', 'ready', 'hi')])).toBeNull();
    expect(pendingBuyerTurn(undefined)).toBeNull();
    expect(buyerTurnFailed([msg('user', 'ready'), msg('assistant', 'failed')])).toBe(true);
    expect(buyerTurnFailed([msg('user', 'ready')])).toBe(false);
    expect(sellerHasSpoken([msg('assistant', 'ready', 'hi')])).toBe(false);
    expect(sellerHasSpoken([msg('user', 'ready', 'hi')])).toBe(true);
  });

  it('recognises the two 409s by their code', () => {
    expect(isReplyInProgress(conflict('REPLY_IN_PROGRESS'))).toBe(true);
    expect(isReplyInProgress(conflict('SESSION_ENDED'))).toBe(false);
    expect(isCallPrepInProgress(conflict('CALL_PREP_IN_PROGRESS'))).toBe(true);
    expect(errorCodeOf(conflict('SCORING_IN_PROGRESS'))).toBe('SCORING_IN_PROGRESS');
    expect(errorCodeOf(new Error('x'))).toBeUndefined();
  });

  it('failure copy is honest about the budget, with the reset time', () => {
    expect(aiFailureMessage('over_budget', 'scorecard', '1:00 AM')).toContain('daily AI limit');
    expect(aiFailureMessage('over_budget', 'scorecard', '1:00 AM')).toContain('1:00 AM');
    expect(aiFailureMessage('deal_missing', 'call prep')).toContain('no longer exists');
    expect(aiFailureMessage('bad_output', 'scorecard')).toContain('could not read');
    expect(aiFailureMessage('generation_failed', 'reply')).toContain('could not write');
    for (const e of ['over_budget', 'deal_missing', 'bad_output', 'generation_failed', null]) {
      expect(aiFailureMessage(e, 'scorecard')).not.toMatch(/[–—]/);
    }
  });
});

describe('analytics helpers', () => {
  it('presetRange is inclusive of today, in UTC', () => {
    const now = new Date('2026-10-21T23:30:00Z');
    expect(presetRange(30, now)).toEqual({ from: '2026-09-22', to: '2026-10-21' });
    expect(presetRange(7, now)).toEqual({ from: '2026-10-15', to: '2026-10-21' });
    expect(presetRange(1, now)).toEqual({ from: '2026-10-21', to: '2026-10-21' });
  });

  it('rangeError mirrors the API rules', () => {
    expect(rangeError('2026-10-21', '2026-10-21')).toBeNull();
    expect(rangeError('2026-10-22', '2026-10-21')).toBe('The start date must be on or before the end date.');
    expect(rangeError('2025-10-21', '2026-10-21')).toBeNull(); // 366 days inclusive
    expect(rangeError('2025-10-20', '2026-10-21')).toBe('Pick a range of at most 366 days.');
    expect(rangeError('', '2026-10-21')).toBe('Pick a start and an end date.');
  });

  it('formats cycle length and months', () => {
    expect(formatCycle(null)).toBe('No won deals yet');
    expect(formatCycle(12)).toBe('12 days');
    expect(formatCycle(1)).toBe('1 day');
    expect(formatCycle(18.5)).toBe('18.5 days');
    expect(monthLabel('2026-10')).toBe('Oct');
    expect(monthLabel('2026-10', true)).toBe('Oct 2026');
  });
});
