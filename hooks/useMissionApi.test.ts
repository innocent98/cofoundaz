import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMissionApi } from './useMissionApi';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});
vi.mock('@/hooks/useMissionOpenCount', () => ({ announceMissionChanged: vi.fn() }));

const mocked = vi.mocked(apiClient);

const milestone = { id: 'm1', title: 'Validate demand', due_on: '2026-11-01' };
const rawTask = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  roadmap_task_id: 'r1',
  title: 'Run 10 customer interviews',
  reason: "From your 'Validate demand' milestone.",
  effort: 'medium',
  status: 'todo',
  order: 0,
  completed_at: null,
  reject_reason: null,
  milestone,
  ...over,
});
const settings = { mission_size: 3, delivery_time: '06:00:00', weekend_missions: false };

function route(today: unknown, extra: Record<string, unknown> = {}) {
  mocked.mockImplementation(async (url: string, opts?: { method?: string }) => {
    const key = `${opts?.method ?? 'GET'} ${url}`;
    if (key in extra) return extra[key];
    if (url === '/missions/today') return { data: today };
    if (url === '/missions/settings') return { data: settings };
    return { data: {} };
  });
}

beforeEach(() => {
  mocked.mockReset();
});

describe('useMissionApi', () => {
  it('maps milestone, reason, empty_reason and assigned_to_me from /missions/today', async () => {
    route({
      status: 'pending',
      streak: 2,
      mission_date: '2026-10-19',
      tasks: [rawTask()],
      empty_reason: null,
      assigned_to_me: [{ roadmap_task_id: 'r9', title: 'Ship the pitch', effort: 'small', milestone, carried_over: false }],
    });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.state).toBe('pending');
    expect(result.current.todayTasks[0].milestone).toEqual({ id: 'm1', title: 'Validate demand', dueOn: '2026-11-01' });
    expect(result.current.todayTasks[0].reason).toContain('Validate demand');
    expect(result.current.assigned).toEqual([
      { roadmapTaskId: 'r9', title: 'Ship the pitch', effort: 'Small', milestone: { id: 'm1', title: 'Validate demand', dueOn: '2026-11-01' } },
    ]);
  });

  it('exposes the empty reason on a task-less day', async () => {
    route({ status: 'pending', tasks: [], empty_reason: 'weekend_off', assigned_to_me: [] });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.state).toBe('empty');
    expect(result.current.emptyReason).toBe('weekend_off');
  });

  it('a server-complete day with a task added afterwards is not "all completed"', async () => {
    route({ status: 'complete', tasks: [rawTask({ status: 'done' }), rawTask({ id: 't2', status: 'todo', order: 1 })] });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.state).toBe('complete');
    expect(result.current.allCompleted).toBe(false);
  });

  it('is all completed once nothing is left open', async () => {
    route({ status: 'complete', tasks: [rawTask({ status: 'done' }), rawTask({ id: 't2', status: 'rejected', order: 1 })] });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.allCompleted).toBe(true);
  });

  it('reports no_roadmap and builds one on demand, then refetches', async () => {
    let generated = false;
    mocked.mockImplementation(async (url: string, opts?: { method?: string }) => {
      if (url === '/roadmap/generate') {
        expect(opts?.method).toBe('POST');
        generated = true;
        return { data: { status: 'succeeded' } };
      }
      if (url === '/missions/settings') return { data: settings };
      return { data: generated ? { status: 'pending', tasks: [rawTask()] } : { status: 'no_roadmap', assigned_to_me: [] } };
    });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.state).toBe('no_roadmap'));
    let ok = false;
    await act(async () => {
      ok = await result.current.generateRoadmap();
    });
    expect(ok).toBe(true);
    expect(result.current.state).toBe('pending');
    expect(result.current.generating).toBe(false);
  });

  it('a failed load is an error state, never a fake empty mission', async () => {
    mocked.mockImplementation(async (url: string) => {
      if (url === '/missions/settings') return { data: settings };
      throw new Error('boom');
    });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.state).toBe('error');
  });

  it('rejects with the exact reason string and snoozes via PATCH', async () => {
    route({ status: 'pending', tasks: [rawTask()] });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      result.current.rejectTask('t1', "Doesn't apply");
    });
    expect(mocked).toHaveBeenCalledWith('/missions/tasks/t1', { method: 'PATCH', body: JSON.stringify({ action: 'reject', reject_reason: "Doesn't apply" }) });
    await act(async () => {
      result.current.snoozeTask('t1');
    });
    expect(mocked).toHaveBeenCalledWith('/missions/tasks/t1', { method: 'PATCH', body: JSON.stringify({ action: 'snooze' }) });
  });

  it('settings stay null until the server answers (no invented defaults) and persist via PATCH', async () => {
    route({ status: 'pending', tasks: [rawTask()] }, {
      'PATCH /missions/settings': { data: { mission_size: 2, delivery_time: '07:00:00', weekend_missions: true } },
    });
    const { result } = renderHook(() => useMissionApi());
    expect(result.current.settings).toBeNull();
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    expect(result.current.settings).toEqual({ missionSize: 3, deliveryTime: '06:00 AM', weekendsOff: true });
    await act(async () => {
      await result.current.updateSettings({ missionSize: 2, deliveryTime: '07:00 AM', weekendsOff: false });
    });
    expect(mocked).toHaveBeenCalledWith('/missions/settings', {
      method: 'PATCH',
      body: JSON.stringify({ mission_size: 2, delivery_time: '07:00:00', weekend_missions: true }),
    });
    expect(result.current.settings).toEqual({ missionSize: 2, deliveryTime: '07:00 AM', weekendsOff: false });
  });

  it('a failed settings save reverts to the server values and resolves false', async () => {
    mocked.mockImplementation(async (url: string, opts?: { method?: string }) => {
      if (opts?.method === 'PATCH') throw new Error('nope');
      if (url === '/missions/settings') return { data: settings };
      return { data: { status: 'pending', tasks: [rawTask()] } };
    });
    const { result } = renderHook(() => useMissionApi());
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    let ok = true;
    await act(async () => {
      ok = await result.current.updateSettings({ missionSize: 1 });
    });
    expect(ok).toBe(false);
    expect(result.current.settings?.missionSize).toBe(3);
  });
});
