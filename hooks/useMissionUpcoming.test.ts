import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMissionUpcoming, mapUpcoming, moveId, visibleOrder } from './useMissionUpcoming';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});
vi.mock('@/hooks/useMissionOpenCount', () => ({ announceMissionChanged: vi.fn() }));

const mocked = vi.mocked(apiClient);

const raw = (ids: string[]) => ({
  has_roadmap: true,
  mission_size: 2,
  days: [
    { date: '2026-10-19', rest_day: false, tasks: ids.slice(0, 2).map((id) => ({ roadmap_task_id: id, title: `T ${id}`, effort: 'small', milestone: null, carried_over: id === 'a' })) },
    { date: '2026-10-20', rest_day: false, tasks: ids.slice(2).map((id) => ({ roadmap_task_id: id, title: `T ${id}`, effort: 'large', milestone: { id: 'm', title: 'M', due_on: null } })) },
    { date: '2026-10-21', rest_day: false, tasks: [] },
    { date: '2026-10-24', rest_day: true, tasks: [] },
  ],
});

beforeEach(() => {
  mocked.mockReset();
});

describe('upcoming helpers', () => {
  it('maps the projection, including rest days, empty days and the carried-over tag', () => {
    const u = mapUpcoming(raw(['a', 'b', 'c']));
    expect(u.days.map((d) => [d.date, d.restDay, d.tasks.length])).toEqual([
      ['2026-10-19', false, 2],
      ['2026-10-20', false, 1],
      ['2026-10-21', false, 0],
      ['2026-10-24', true, 0],
    ]);
    expect(u.days[0].tasks[0].carriedOver).toBe(true);
    expect(u.days[1].tasks[0]).toMatchObject({ effort: 'Large', milestone: { id: 'm', title: 'M', dueOn: null } });
  });

  it('visibleOrder flattens the days in display order', () => {
    expect(visibleOrder(mapUpcoming(raw(['a', 'b', 'c'])).days)).toEqual(['a', 'b', 'c']);
  });

  it('moveId moves one item and ignores out-of-range moves', () => {
    expect(moveId(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveId(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    const same = ['a', 'b'];
    expect(moveId(same, 0, -1)).toBe(same);
    expect(moveId(same, 1, 2)).toBe(same);
  });
});

describe('useMissionUpcoming', () => {
  it('loads, then PUTs the whole visible order and shows the recomputed projection', async () => {
    mocked.mockImplementation(async (_url: string, opts?: { method?: string }) =>
      opts?.method === 'PUT' ? { data: raw(['c', 'a', 'b']) } : { data: raw(['a', 'b', 'c']) }
    );
    const { result } = renderHook(() => useMissionUpcoming());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok = false;
    await act(async () => {
      ok = await result.current.reorder(['c', 'a', 'b']);
    });
    expect(ok).toBe(true);
    expect(mocked).toHaveBeenCalledWith('/missions/upcoming/order', { method: 'PUT', body: JSON.stringify({ roadmap_task_ids: ['c', 'a', 'b'] }) });
    expect(visibleOrder(result.current.data!.days)).toEqual(['c', 'a', 'b']);
  });

  it('a rejected reorder (403/422) refetches server truth and resolves false', async () => {
    mocked.mockImplementation(async (_url: string, opts?: { method?: string }) => {
      if (opts?.method === 'PUT') throw new Error('403');
      return { data: raw(['a', 'b', 'c']) };
    });
    const { result } = renderHook(() => useMissionUpcoming());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok = true;
    await act(async () => {
      ok = await result.current.reorder(['c', 'b', 'a']);
    });
    expect(ok).toBe(false);
    expect(visibleOrder(result.current.data!.days)).toEqual(['a', 'b', 'c']);
  });

  it('surfaces a load failure', async () => {
    mocked.mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useMissionUpcoming());
    await waitFor(() => expect(result.current.error).toBe('down'));
    expect(result.current.data).toBeNull();
  });
});
