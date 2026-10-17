import { API_BASE, apiClient } from '@/lib/api/client';

// Client for the notifications SSE stream (BE guide: notifications-realtime +
// realtime-activity). One connection carries `unread`, `notification.created`,
// `activity.created` and `revoked`. A ticket is single use, so every (re)connect
// mints a fresh one. EventSource reconnects by itself, but only with the dead
// ticket, so we close it on error and reconnect with our own backoff.

export type StreamEvent = 'unread' | 'notification.created' | 'activity.created' | 'revoked';
/** Synthetic event: the stream reconnected or the tab regained focus; refetch what you show. */
export type ResyncEvent = 'resync';
export type StreamEventName = StreamEvent | ResyncEvent;

const STREAM_EVENTS: StreamEvent[] = ['unread', 'notification.created', 'activity.created', 'revoked'];

export const MAX_BACKOFF_MS = 30_000;

export function backoffMs(attempt: number): number {
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt);
}

export interface NotificationStream {
  subscribe(event: StreamEventName, handler: (data: unknown) => void): () => void;
  close(): void;
}

interface StreamDeps {
  mintTicket?: () => Promise<string>;
  createSource?: (url: string) => EventSource;
  onRevoked?: () => void;
}

async function defaultMintTicket(): Promise<string> {
  const res = await apiClient<{ data?: { ticket?: string } }>('/notifications/stream-ticket', { method: 'POST' });
  const ticket = res?.data?.ticket;
  if (!ticket) throw new Error('No stream ticket');
  return ticket;
}

export function openNotificationStream(deps: StreamDeps = {}): NotificationStream {
  const mintTicket = deps.mintTicket ?? defaultMintTicket;
  const createSource = deps.createSource ?? ((url: string) => new EventSource(url));
  const listeners = new Map<StreamEventName, Set<(data: unknown) => void>>();

  let closed = false;
  let source: EventSource | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let hasConnectedBefore = false;

  const emit = (event: StreamEventName, data: unknown) => {
    listeners.get(event)?.forEach((h) => h(data));
  };

  const scheduleReconnect = () => {
    if (closed || timer) return;
    timer = setTimeout(() => {
      timer = null;
      void connect();
    }, backoffMs(attempt++));
  };

  async function connect() {
    if (closed) return;
    let ticket: string;
    try {
      ticket = await mintTicket();
    } catch {
      scheduleReconnect();
      return;
    }
    if (closed) return;

    const es = createSource(`${API_BASE}/notifications/stream?ticket=${encodeURIComponent(ticket)}`);
    source = es;

    es.onopen = () => {
      attempt = 0;
      // Nothing is replayed after a gap: tell consumers to refetch.
      if (hasConnectedBefore) emit('resync', null);
      hasConnectedBefore = true;
    };

    for (const name of STREAM_EVENTS) {
      es.addEventListener(name, (e) => {
        let data: unknown = null;
        try {
          data = JSON.parse((e as MessageEvent<string>).data);
        } catch {
          return;
        }
        if (name === 'revoked') {
          closed = true;
          es.close();
          emit('revoked', data);
          deps.onRevoked?.();
          return;
        }
        emit(name, data);
      });
    }

    es.onerror = () => {
      es.close();
      if (source === es) source = null;
      scheduleReconnect();
    };
  }

  const onVisible = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') emit('resync', null);
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

  void connect();

  return {
    subscribe(event, handler) {
      let set = listeners.get(event);
      if (!set) listeners.set(event, (set = new Set()));
      set.add(handler);
      return () => {
        set.delete(handler);
      };
    },
    close() {
      closed = true;
      if (timer) clearTimeout(timer);
      source?.close();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
      listeners.clear();
    },
  };
}
