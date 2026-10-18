import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMissionCompleted, groupByDay, mapCompleted } from './useMissionCompleted';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});

vi.mock('@/hooks/useMissionOpenCount', () => ({ announceMissionChanged: vi.fn() }));

const mocked = vi.mocked(apiClient);
const item = (id: string, day: string) => ({ id, title: `Task ${id}`, completed_at: `${day}T09:00:00+00:00`, mission_date: day, milestone: null });

beforeEach(() => {
  mocked.mockReset();
});

describe('groupByDay', () => {
  it('groups a newest-first list by mission day, keeping order', () => {
    const groups = groupByDay(mapCompleted([item('1', '2026-10-18'), item('2', '2026-10-18'), item('3', '2026-10-17')]));
    expect(groups.map((g) => [g.date, g.items.map((i) => i.id)])).toEqual([
      ['2026-10-18', ['1', '2']],
      ['2026-10-17', ['3']],
    ]);
  });
});

describe('useMissionCompleted', () => {
  it('loads a page, then Load more follows next_cursor and appends', async () => {
    mocked.mockImplementation(async (url: string) => {
      if (url.includes('cursor=c1')) return { data: { items: [item('3', '2026-10-17')], next_cursor: null } };
      return { data: { items: [item('1', '2026-10-18'), item('2', '2026-10-18')], next_cursor: 'c1' } };
    });
    const { result } = renderHook(() => useMissionCompleted());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items.map((i) => i.id)).toEqual(['1', '2', '3']);
    expect(result.current.hasMore).toBe(false);
    expect(mocked.mock.calls[1][0]).toContain('cursor=c1');
  });

  it('shows an error instead of an empty log when the load fails', async () => {
    mocked.mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useMissionCompleted());
    await waitFor(() => expect(result.current.error).toBe('down'));
    expect(result.current.items).toEqual([]);
  });
});
