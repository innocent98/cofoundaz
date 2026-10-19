import { describe, expect, it, vi } from 'vitest';
import { waitForJob, type JobRecord } from './bb-jobs';

const noSleep = () => Promise.resolve();

describe('waitForJob', () => {
  it('polls until the job succeeds and returns its result', async () => {
    const seq: JobRecord<{ status: string }>[] = [
      { status: 'queued', result: null, error: null },
      { status: 'running', result: null, error: null },
      { status: 'succeeded', result: { status: 'ready' }, error: null },
    ];
    const fetchJob = vi.fn(async () => seq.shift()!);
    const out = await waitForJob('j1', { fetchJob, sleep: noSleep });
    expect(out).toEqual({ state: 'succeeded', result: { status: 'ready' } });
    expect(fetchJob).toHaveBeenCalledTimes(3);
  });

  it('returns failed with the job error', async () => {
    const out = await waitForJob('j1', {
      fetchJob: async () => ({ status: 'failed', result: null, error: 'boom' }),
      sleep: noSleep,
    });
    expect(out).toEqual({ state: 'failed', error: 'boom' });
  });

  it('survives transient fetch errors and times out honestly', async () => {
    let n = 0;
    const out = await waitForJob('j1', {
      fetchJob: async () => {
        n += 1;
        throw new Error('network');
      },
      sleep: noSleep,
      intervalMs: 1000,
      timeoutMs: 3000,
    });
    expect(out).toEqual({ state: 'timeout' });
    expect(n).toBeGreaterThan(1);
  });
});
