import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { announceMissionChanged, countOpenTasks, useMissionOpenCount } from './useMissionOpenCount';
import * as client from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiClient: vi.fn() }));

const today = (statuses: string[]) => ({ data: { status: 'pending', tasks: statuses.map((status) => ({ status })) } });

describe('Today\'s Mission sidebar badge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts only open (todo) tasks', () => {
    expect(countOpenTasks(today(['todo', 'done', 'todo', 'snoozed', 'rejected']))).toBe(2);
    expect(countOpenTasks({ data: { status: 'no_roadmap' } })).toBe(0);
    expect(countOpenTasks(null)).toBe(0);
  });

  it('loads the count, and re-reads on a route change and when the mission changes', async () => {
    vi.mocked(client.apiClient).mockResolvedValue(today(['todo', 'todo']));
    const { result, rerender } = renderHook(({ route }) => useMissionOpenCount(true, route), { initialProps: { route: '/dashboard' } });
    await waitFor(() => expect(result.current).toBe(2));
    vi.mocked(client.apiClient).mockResolvedValue(today(['todo']));
    rerender({ route: '/roadmap' });
    await waitFor(() => expect(result.current).toBe(1));
    vi.mocked(client.apiClient).mockResolvedValue(today([]));
    act(() => announceMissionChanged());
    await waitFor(() => expect(result.current).toBe(0));
  });

  it('a failed read hides the badge instead of inventing a number', async () => {
    vi.mocked(client.apiClient).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMissionOpenCount(true, '/dashboard'));
    await waitFor(() => expect(client.apiClient).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });

  it('roles without a mission never call the API', () => {
    const { result } = renderHook(() => useMissionOpenCount(false, '/dashboard'));
    expect(result.current).toBe(0);
    expect(client.apiClient).not.toHaveBeenCalled();
  });
});
