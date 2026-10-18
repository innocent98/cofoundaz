import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { backoffMs, MAX_BACKOFF_MS, openNotificationStream } from './stream';

class FakeSource {
  static instances: FakeSource[] = [];
  listeners = new Map<string, Array<(e: { data: string }) => void>>();
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) {
    FakeSource.instances.push(this);
  }
  addEventListener(name: string, fn: (e: { data: string }) => void) {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), fn]);
  }
  close() {
    this.closed = true;
  }
  emit(name: string, data: unknown) {
    this.listeners.get(name)?.forEach((fn) => fn({ data: JSON.stringify(data) }));
  }
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe('notification stream client', () => {
  beforeEach(() => {
    FakeSource.instances = [];
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  const open = (mintTicket = vi.fn().mockResolvedValue('t1'), onRevoked = vi.fn()) =>
    ({
      mintTicket,
      onRevoked,
      stream: openNotificationStream({
        mintTicket,
        onRevoked,
        createSource: (url) => new FakeSource(url) as unknown as EventSource,
      }),
    });

  it('mints a ticket and connects with it in the URL', async () => {
    open();
    await flush();
    expect(FakeSource.instances).toHaveLength(1);
    expect(FakeSource.instances[0].url).toBe('/api/v1/notifications/stream?ticket=t1');
  });

  it('delivers unread, notification.created and activity.created (live frame shape) to subscribers', async () => {
    const { stream } = open();
    const activity = vi.fn();
    const created = vi.fn();
    const unread = vi.fn();
    stream.subscribe('activity.created', activity);
    stream.subscribe('notification.created', created);
    stream.subscribe('unread', unread);
    await flush();
    const es = FakeSource.instances[0];
    es.emit('unread', { unread: 7 });
    es.emit('activity.created', { id: '77551c2e', summary: "Victor Founder added 'x' to today's mission", actor: { id: 'u', name: 'Victor Founder' } });
    es.emit('notification.created', { id: 'n1', type: 'dashboard.briefing.ready', title: 'Your daily AI briefing is ready' });
    expect(unread).toHaveBeenCalledWith({ unread: 7 });
    expect(activity).toHaveBeenCalledWith(expect.objectContaining({ id: '77551c2e' }));
    expect(created).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
  });

  it('unsubscribe stops delivery', async () => {
    const { stream } = open();
    const fn = vi.fn();
    const off = stream.subscribe('unread', fn);
    await flush();
    off();
    FakeSource.instances[0].emit('unread', { unread: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('revoked: emits, closes, calls onRevoked, and never reconnects', async () => {
    const { stream, onRevoked, mintTicket } = open();
    const revoked = vi.fn();
    stream.subscribe('revoked', revoked);
    await flush();
    const es = FakeSource.instances[0];
    es.emit('revoked', { reason: 'membership_inactive' });
    expect(revoked).toHaveBeenCalledWith({ reason: 'membership_inactive' });
    expect(onRevoked).toHaveBeenCalled();
    expect(es.closed).toBe(true);
    es.onerror?.();
    await vi.advanceTimersByTimeAsync(MAX_BACKOFF_MS);
    expect(mintTicket).toHaveBeenCalledTimes(1);
    expect(FakeSource.instances).toHaveLength(1);
  });

  it('an error closes the dead connection and reconnects with a FRESH ticket, then emits resync', async () => {
    const mintTicket = vi.fn().mockResolvedValueOnce('t1').mockResolvedValueOnce('t2');
    const { stream } = open(mintTicket);
    const resync = vi.fn();
    stream.subscribe('resync', resync);
    await flush();
    const first = FakeSource.instances[0];
    first.onopen?.();
    expect(resync).not.toHaveBeenCalled(); // the first connect is not a resync
    first.onerror?.();
    expect(first.closed).toBe(true);
    await vi.advanceTimersByTimeAsync(backoffMs(0));
    await flush();
    expect(FakeSource.instances).toHaveLength(2);
    expect(FakeSource.instances[1].url).toContain('ticket=t2');
    FakeSource.instances[1].onopen?.();
    expect(resync).toHaveBeenCalledTimes(1);
  });

  it('a failing ticket mint retries with backoff', async () => {
    const mintTicket = vi.fn().mockRejectedValueOnce(new Error('401')).mockResolvedValueOnce('t2');
    open(mintTicket);
    await flush();
    expect(FakeSource.instances).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(backoffMs(0));
    await flush();
    expect(FakeSource.instances).toHaveLength(1);
  });

  it('backoff grows and is capped', () => {
    expect(backoffMs(0)).toBe(1000);
    expect(backoffMs(3)).toBe(8000);
    expect(backoffMs(20)).toBe(MAX_BACKOFF_MS);
  });

  it('regaining tab focus emits resync (events are best-effort)', async () => {
    const { stream } = open();
    const resync = vi.fn();
    stream.subscribe('resync', resync);
    await flush();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(resync).toHaveBeenCalled();
  });

  it('close() closes the connection and stops reconnecting', async () => {
    const { stream, mintTicket } = open();
    await flush();
    const es = FakeSource.instances[0];
    stream.close();
    expect(es.closed).toBe(true);
    es.onerror?.();
    await vi.advanceTimersByTimeAsync(MAX_BACKOFF_MS);
    expect(mintTicket).toHaveBeenCalledTimes(1);
  });
});
