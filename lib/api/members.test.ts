import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import * as client from './client';
import { listMembers } from './members';
import { listMembers as listMentionable } from './comments';

vi.mock('./client', async (orig) => ({ ...(await orig<typeof import('./client')>()), apiClient: vi.fn() }));

const forbidden = () =>
  new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: "You don't have permission to do that.", field_errors: [] } });

describe.each([
  ['members', listMembers],
  ['comments', listMentionable],
])('listMembers (%s)', (_name, fn) => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the members for a founder or team member', async () => {
    const row = { user_id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'founder' };
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: [row] });
    expect(await fn()).toEqual([row]);
  });

  it('treats 403 (mentor, consultant, accountant, investor, legal advisor) as an empty list, not an error', async () => {
    vi.mocked(client.apiClient).mockRejectedValueOnce(forbidden());
    expect(await fn()).toEqual([]);
  });

  it('still throws on other failures', async () => {
    vi.mocked(client.apiClient).mockRejectedValueOnce(new ApiError(500, 'Server Error', null));
    await expect(fn()).rejects.toBeInstanceOf(ApiError);
  });
});
