'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { openNotificationStream, type StreamEventName } from '@/lib/realtime/stream';

type Handler = (data: unknown) => void;
type Subscribe = (event: StreamEventName, handler: Handler) => () => void;

const RealtimeContext = createContext<Subscribe | null>(null);

/**
 * Holds the single notifications stream for the authenticated shell and fans its
 * events out to subscribers (bell, sidebar badge, Team activity). Subscribers
 * register synchronously on mount; the stream itself opens in an effect.
 */
function createRegistry() {
  const handlers = new Map<StreamEventName, Set<Handler>>();
  const subscribe: Subscribe = (event, handler) => {
    let set = handlers.get(event);
    if (!set) handlers.set(event, (set = new Set()));
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  };
  const emit = (event: StreamEventName, data: unknown) => handlers.get(event)?.forEach((h) => h(data));
  return { subscribe, emit };
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [registry] = useState(createRegistry);

  useEffect(() => {
    if (!localStorage.getItem('cf_token')) return;
    const stream = openNotificationStream({
      onRevoked: () => {
        // Membership is gone: never reconnect, send the user back to sign in.
        try {
          localStorage.removeItem('cf_workspace_id');
        } catch {
          /* ignore storage errors */
        }
        window.location.assign('/login');
      },
    });
    const names: StreamEventName[] = ['unread', 'notification.created', 'activity.created', 'revoked', 'resync'];
    const offs = names.map((n) => stream.subscribe(n, (data) => registry.emit(n, data)));
    return () => {
      offs.forEach((off) => off());
      stream.close();
    };
  }, [registry]);

  return <RealtimeContext.Provider value={registry.subscribe}>{children}</RealtimeContext.Provider>;
}

/** Subscribe to a stream event for the lifetime of the component. A no-op outside the provider. */
export function useRealtimeEvent(event: StreamEventName, handler: Handler) {
  const subscribe = useContext(RealtimeContext);
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!subscribe) return;
    return subscribe(event, (data) => latest.current(data));
  }, [subscribe, event]);
}
