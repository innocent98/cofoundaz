import { describe, expect, it, vi, beforeEach } from 'vitest';
import { INVITE_ROLE_OPTIONS, InviteError, parseFieldErrors, sendInvitations, summarizeInvites } from './team';
import { ApiError } from './client';
import * as client from './client';

vi.mock('./client', async (orig) => ({ ...(await orig<typeof import('./client')>()), apiClient: vi.fn() }));

describe('team invitations api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps modal labels to API role values (Co-Founder is `founder`)', () => {
    const byLabel = Object.fromEntries(INVITE_ROLE_OPTIONS.map((o) => [o.label, o.value]));
    expect(byLabel).toEqual({
      'Co-Founder': 'founder',
      'Team Member': 'team_member',
      Mentor: 'mentor',
      Accountant: 'accountant',
      'Legal Advisor': 'legal_advisor',
      'Business Consultant': 'business_consultant',
    });
    expect(INVITE_ROLE_OPTIONS.find((o) => o.value === 'founder')?.hint).toBe('Co-Founders get full access.');
  });

  it('POSTs { invites } and returns created / skipped / undelivered', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({
      data: { created: ['throwaway-mentor@example.com'], skipped: ['throwaway-founder@example.com'], undelivered: [] },
      meta: null,
    });
    const rows = [{ email: 'throwaway-mentor@example.com', role: 'mentor' as const }];
    const res = await sendInvitations(rows);
    expect(client.apiClient).toHaveBeenCalledWith('/team/invitations', { method: 'POST', body: JSON.stringify({ invites: rows }) });
    expect(res).toEqual({ created: ['throwaway-mentor@example.com'], skipped: ['throwaway-founder@example.com'], undelivered: [] });
  });

  it('tolerates the older response without `undelivered`', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { created: ['a@example.com'], skipped: [] } });
    expect((await sendInvitations([{ email: 'a@example.com', role: 'mentor' }])).undelivered).toEqual([]);
  });

  it('422: per-row field errors from the live capture', async () => {
    const body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the highlighted fields.',
        field_errors: [
          { field: 'invites.0.email', message: 'value is not a valid email address: An email address must have an @-sign.' },
          { field: 'invites.0.role', message: "Input should be 'founder', 'team_member', 'mentor', 'accountant', 'legal_advisor' or 'business_consultant'" },
        ],
      },
    };
    vi.mocked(client.apiClient).mockRejectedValueOnce(new ApiError(422, 'Unprocessable Entity', body));
    const err = (await sendInvitations([{ email: 'x', role: 'mentor' }]).catch((e) => e)) as InviteError;
    expect(err).toBeInstanceOf(InviteError);
    expect(err.kind).toBe('validation');
    expect(err.message).toBe('Please check the highlighted fields.');
    expect(err.fieldErrors.map((f) => [f.row, f.field])).toEqual([[0, 'email'], [0, 'role']]);
  });

  it('403 non-founder, 429 daily cap (API message), 429 rate limit, and unknown failures', async () => {
    const run = async (e: unknown) => {
      vi.mocked(client.apiClient).mockRejectedValueOnce(e);
      return (await sendInvitations([{ email: 'a@example.com', role: 'mentor' }]).catch((x) => x)) as InviteError;
    };
    expect((await run(new ApiError(403, 'Forbidden', {}))).kind).toBe('forbidden');
    const daily = await run(
      new ApiError(429, 'Too Many', { error: { code: 'INVITE_LIMIT_REACHED', message: "You've sent a lot of invitations today. Try again tomorrow." } }),
    );
    expect(daily.kind).toBe('daily_limit');
    expect(daily.message).toBe("You've sent a lot of invitations today. Try again tomorrow.");
    expect((await run(new ApiError(429, 'Too Many', { error: { code: 'RATE_LIMITED' } }))).kind).toBe('rate_limit');
    expect((await run(new Error('network'))).kind).toBe('unknown');
  });

  it('parseFieldErrors ignores fields that are not invite rows', () => {
    expect(parseFieldErrors([{ field: 'body', message: 'x' }, { field: 'invites.2.email', message: 'bad' }])).toEqual([
      { row: 2, field: 'email', message: 'bad' },
    ]);
    expect(parseFieldErrors(undefined)).toEqual([]);
  });

  it('summarizeInvites names created and skipped counts', () => {
    expect(summarizeInvites({ created: ['a'], skipped: ['b'], undelivered: [] })).toBe(
      'Invited 1. Skipped 1 (already a member or already invited).',
    );
  });
});
