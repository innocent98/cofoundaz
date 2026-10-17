import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { RealtimeProvider } from './realtime-context';
import { useActivityFeed } from '@/hooks/useDashboardApi';
import * as dashboardApi from '@/lib/api/dashboard';
import * as streamModule from '@/lib/realtime/stream';

vi.mock('@/lib/api/dashboard', () => ({
  getDashboardSummary: vi.fn(),
  getDashboardActivity: vi.fn(),
  acceptBriefingAction: vi.fn(),
  isSectionError: () => false,
}));
vi.mock('@/lib/realtime/stream', async (orig) => ({ ...(await orig<typeof import('@/lib/realtime/stream')>()), openNotificationStream: vi.fn() }));

// The live `activity.created` frame from realtime-activity guide section 3.
const liveFrame = {
  id: '77551c2e-7ac1-4138-8aa6-da9ea674389d',
  action: 'mission.task.added',
  entity_type: 'mission_task',
  entity_id: '33cc724c-fbb9-4530-9451-031958871c2c',
  summary: "Victor Founder added 'Realtime check task' to today's mission",
  meta: null,
  actor: { id: '0a37c892-5def-4fef-af27-a822588d4171', name: 'Victor Founder' },
  created_at: new Date().toISOString(),
};

describe('Team activity goes live through RealtimeProvider', () => {
  let emit: (event: string, data: unknown) => void;
  let onRevoked: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('cf_token', 't');
    const handlers = new Map<string, Set<(d: unknown) => void>>();
    emit = (event, data) => handlers.get(event)?.forEach((h) => h(data));
    vi.mocked(streamModule.openNotificationStream).mockImplementation(((deps: { onRevoked?: () => void }) => {
      onRevoked = deps.onRevoked;
      return {
        subscribe: (event: string, h: (d: unknown) => void) => {
          if (!handlers.has(event)) handlers.set(event, new Set());
          handlers.get(event)!.add(h);
          return () => handlers.get(event)!.delete(h);
        },
        close: vi.fn(),
      };
    }) as unknown as typeof streamModule.openNotificationStream);
    vi.mocked(dashboardApi.getDashboardActivity).mockResolvedValue({ data: { items: [], next_cursor: null } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => <RealtimeProvider>{children}</RealtimeProvider>;

  it('prepends an activity.created row and ignores a duplicate id', async () => {
    const { result } = renderHook(() => useActivityFeed(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => emit('activity.created', liveFrame));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toMatchObject({ id: liveFrame.id, summary: liveFrame.summary, actor: 'Victor Founder' });
    act(() => emit('activity.created', liveFrame));
    expect(result.current.data).toHaveLength(1);
  });

  it('refetches page 1 on resync (events are best-effort)', async () => {
    const { result } = renderHook(() => useActivityFeed(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const calls = vi.mocked(dashboardApi.getDashboardActivity).mock.calls.length;
    act(() => emit('resync', null));
    await waitFor(() => expect(vi.mocked(dashboardApi.getDashboardActivity).mock.calls.length).toBe(calls + 1));
  });

  it('does not open a stream without a session', () => {
    localStorage.removeItem('cf_token');
    renderHook(() => useActivityFeed(), { wrapper });
    expect(streamModule.openNotificationStream).not.toHaveBeenCalled();
  });

  it('a revoked membership clears the workspace and sends the user to sign in', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { value: { assign }, configurable: true });
    localStorage.setItem('cf_workspace_id', 'ws');
    renderHook(() => useActivityFeed(), { wrapper });
    act(() => onRevoked?.());
    expect(localStorage.getItem('cf_workspace_id')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });
});
