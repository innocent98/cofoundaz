import { describe, expect, it, vi, beforeEach } from 'vitest';
import { groupResults, searchAll, type SearchResult } from './search';
import * as client from './client';

vi.mock('./client', () => ({ apiClient: vi.fn() }));

const r = (over: Partial<SearchResult>): SearchResult => ({
  type: 'page',
  group: 'Pages',
  id: '/x',
  title: 'X',
  subtitle: null,
  href: '/x',
  ...over,
});

describe('search api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups by `group` in arrival order', () => {
    const groups = groupResults([
      r({ id: '1', group: 'Pages' }),
      r({ id: '2', group: 'Roadmap', type: 'milestone' }),
      r({ id: '3', group: 'Pages' }),
      r({ id: '4', group: 'Roadmap', type: 'roadmap_task' }),
    ]);
    expect(groups.map((g) => [g.group, g.results.map((x) => x.id)])).toEqual([
      ['Pages', ['1', '3']],
      ['Roadmap', ['2', '4']],
    ]);
  });

  it('GET /search?q= with the query encoded, passing the abort signal; unwraps data.results', async () => {
    const live = {
      data: {
        query: 'problem',
        results: [{ type: 'milestone', group: 'Roadmap', id: '9797', title: 'Write your problem statement', subtitle: 'Milestone · due 2026-10-24', href: '/roadmap/milestones' }],
      },
      meta: null,
    };
    vi.mocked(client.apiClient).mockResolvedValueOnce(live);
    const controller = new AbortController();
    const results = await searchAll('a&b problem', controller.signal);
    expect(client.apiClient).toHaveBeenCalledWith('/search?q=a%26b%20problem', { signal: controller.signal });
    expect(results).toEqual(live.data.results);
  });

  it('an empty result set is []', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { query: 'zz', results: [] }, meta: null });
    expect(await searchAll('zz')).toEqual([]);
  });

  it('never sends more than 200 characters (the API 422s above that)', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { results: [] } });
    await searchAll('a'.repeat(300));
    const url = vi.mocked(client.apiClient).mock.calls[0][0] as string;
    expect(url.replace('/search?q=', '')).toHaveLength(200);
  });
});
