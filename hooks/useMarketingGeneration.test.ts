import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { failureMessage, pollGeneration, useMarketingGeneration } from './useMarketingGeneration';
import type { GenerationStatus } from '@/lib/api/marketing';

type G = { id: string; status: GenerationStatus; error: string | null };
const gen = (status: GenerationStatus, error: string | null = null): G => ({ id: 'g1', status, error });

afterEach(() => {
  vi.useRealTimers();
});

describe('pollGeneration', () => {
  const sleep = () => Promise.resolve();

  it('stops as soon as the generation is ready', async () => {
    const get = vi.fn().mockResolvedValueOnce(gen('generating')).mockResolvedValueOnce(gen('ready'));
    const out = await pollGeneration(get, { sleep });
    expect(out).toEqual({ kind: 'done', generation: gen('ready') });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('treats failed as terminal', async () => {
    const out = await pollGeneration(() => Promise.resolve(gen('failed', 'over_budget')), { sleep });
    expect(out.kind).toBe('done');
  });

  it('times out honestly instead of polling forever', async () => {
    let t = 0;
    const out = await pollGeneration(() => Promise.resolve(gen('generating')), {
      sleep: async (ms) => {
        t += ms;
      },
      now: () => t,
      timeoutMs: 20_000,
    });
    expect(out).toEqual({ kind: 'timeout' });
  });

  it('backs off between polls up to the cap', async () => {
    const waits: number[] = [];
    let t = 0;
    await pollGeneration(() => Promise.resolve(gen('generating')), {
      sleep: async (ms) => {
        waits.push(ms);
        t += ms;
      },
      now: () => t,
      timeoutMs: 30_000,
      intervalMs: 1000,
      maxIntervalMs: 3000,
    });
    expect(waits.slice(0, 4)).toEqual([1000, 1500, 2250, 3000]);
    expect(Math.max(...waits)).toBe(3000);
  });

  it('tolerates a transient error but gives up after three in a row', async () => {
    const boom = new Error('network');
    const flaky = vi.fn().mockRejectedValueOnce(boom).mockResolvedValueOnce(gen('ready'));
    expect((await pollGeneration(flaky, { sleep })).kind).toBe('done');

    const dead = vi.fn().mockRejectedValue(boom);
    await expect(pollGeneration(dead, { sleep })).rejects.toBe(boom);
    expect(dead).toHaveBeenCalledTimes(3);
  });

  it('stops when cancelled', async () => {
    const get = vi.fn();
    const out = await pollGeneration(get, { sleep, isCancelled: () => true });
    expect(out).toEqual({ kind: 'cancelled' });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('failureMessage', () => {
  it('explains over_budget as a quiet degrade, not an error code', () => {
    expect(failureMessage('over_budget')).toMatch(/budget/i);
    expect(failureMessage('over_budget')).not.toMatch(/over_budget/);
  });
});

describe('useMarketingGeneration', () => {
  it('goes idle -> generating -> ready and returns the generation', async () => {
    vi.useFakeTimers();
    const start = vi.fn().mockResolvedValue({ id: 'g1', status: 'generating' });
    const get = vi.fn().mockResolvedValueOnce(gen('generating')).mockResolvedValue(gen('ready'));
    const { result } = renderHook(() => useMarketingGeneration<{ a: number }, G>(start, get));
    expect(result.current.phase).toBe('idle');

    let promise!: Promise<G | null>;
    act(() => {
      promise = result.current.run({ a: 1 });
    });
    expect(result.current.phase).toBe('generating');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    const value = await promise;
    expect(value?.status).toBe('ready');
    expect(result.current.phase).toBe('ready');
    expect(start).toHaveBeenCalledWith({ a: 1 });
    expect(get).toHaveBeenCalledWith('g1');
  });

  it('lands in failed with a friendly over_budget message', async () => {
    vi.useFakeTimers();
    const start = vi.fn().mockResolvedValue({ id: 'g1', status: 'generating' });
    const get = vi.fn().mockResolvedValue(gen('failed', 'over_budget'));
    const { result } = renderHook(() => useMarketingGeneration<void, G>(start, get));
    let promise!: Promise<G | null>;
    act(() => {
      promise = result.current.run();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(await promise).toBeNull();
    expect(result.current.phase).toBe('failed');
    expect(result.current.error).toMatch(/budget/i);
  });

  it('lands in timeout after the bounded window', async () => {
    vi.useFakeTimers();
    const start = vi.fn().mockResolvedValue({ id: 'g1', status: 'generating' });
    const get = vi.fn().mockResolvedValue(gen('generating'));
    const { result } = renderHook(() => useMarketingGeneration<void, G>(start, get));
    let promise!: Promise<G | null>;
    act(() => {
      promise = result.current.run();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });
    await promise;
    expect(result.current.phase).toBe('timeout');
    expect(result.current.error).toMatch(/longer than expected/);
  });

  it('shows the API message when the POST itself is rejected', async () => {
    const start = vi.fn().mockRejectedValue(new Error('Please check the highlighted fields.'));
    const { result } = renderHook(() => useMarketingGeneration<void, G>(start, vi.fn()));
    await act(async () => {
      await result.current.run();
    });
    expect(result.current.phase).toBe('failed');
    expect(result.current.error).toBe('Please check the highlighted fields.');
  });
});
