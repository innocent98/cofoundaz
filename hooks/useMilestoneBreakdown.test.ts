import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMilestoneBreakdown } from './useMilestoneBreakdown';
import * as api from '@/lib/api/breakdown';

vi.mock('@/lib/api/breakdown', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/breakdown')>()),
  startBreakdown: vi.fn(),
  pollBreakdown: vi.fn(),
}));

async function run(result: { current: ReturnType<typeof useMilestoneBreakdown> }) {
  let p: Promise<void> | undefined;
  act(() => {
    p = result.current.run('m1');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2100);
    await p;
  });
}

describe('useMilestoneBreakdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(api.pollBreakdown).mockReset();
    vi.mocked(api.startBreakdown).mockResolvedValue({ kind: 'started', jobId: 'j1' });
  });
  afterEach(() => vi.useRealTimers());

  it('refetches, reports the count and highlights the created tasks when the job is ready', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    vi.mocked(api.pollBreakdown).mockResolvedValue({ kind: 'ready', createdTaskIds: ['t1', 't2'] });
    const { result } = renderHook(() => useMilestoneBreakdown(onChanged));
    await run(result);
    expect(onChanged).toHaveBeenCalledOnce();
    expect(result.current.states.m1).toEqual({ phase: 'done', message: 'Added 2 tasks.' });
    expect([...result.current.highlighted]).toEqual(['t1', 't2']);
  });

  it('shows the in-progress message on a 409 and never polls', async () => {
    vi.mocked(api.startBreakdown).mockResolvedValue({ kind: 'in_progress' });
    const { result } = renderHook(() => useMilestoneBreakdown(vi.fn()));
    await run(result);
    expect(result.current.states.m1).toEqual({ phase: 'error', message: "I'm already breaking this milestone down." });
    expect(api.pollBreakdown).not.toHaveBeenCalled();
  });

  it('says the daily limit was hit for over_budget and fails honestly for failed', async () => {
    vi.mocked(api.pollBreakdown).mockResolvedValueOnce({ kind: 'over_budget' });
    const { result } = renderHook(() => useMilestoneBreakdown(vi.fn()));
    await run(result);
    expect(result.current.states.m1).toEqual({ phase: 'error', message: 'AI is at its daily limit, try again tomorrow.' });

    vi.mocked(api.pollBreakdown).mockResolvedValueOnce({ kind: 'failed' });
    await run(result);
    expect(result.current.states.m1).toEqual({ phase: 'error', message: "Couldn't break this down. Try again." });
  });

  it('keeps polling until the job finishes, then gives up with an honest message after a minute', async () => {
    vi.mocked(api.pollBreakdown).mockResolvedValue(null);
    const { result } = renderHook(() => useMilestoneBreakdown(vi.fn()));
    let p: Promise<void> | undefined;
    act(() => {
      p = result.current.run('m1');
    });
    expect(result.current.states.m1).toEqual({ phase: 'working' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(62_000);
      await p;
    });
    expect(result.current.states.m1).toEqual({ phase: 'error', message: 'Taking longer than usual, check back shortly.' });
  });
});
