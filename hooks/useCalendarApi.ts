'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calendarApi,
  calendarErrorMessage,
  type CalendarEvent,
  type Feed,
  type Meeting,
  type MilestonesResponse,
  type ReminderRules,
  type SyncStatus,
} from '@/lib/api/calendar';
import { feedRange, type CalendarView } from '@/lib/calendar-format';

export interface Loaded<T> {
  data: T | null;
  loading: boolean;
  /** The server's sentence, or null. `status` lets a page tell 403/404 from a failure. */
  error: string | null;
  status: number | null;
  reload: () => void;
  setData: (next: T | null) => void;
}

/** Load once per `key` change, drop stale responses, expose reload. */
function useLoaded<T>(load: (() => Promise<T>) | null, key: string): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(load !== null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const enabled = load !== null;

  useEffect(() => {
    const fn = loadRef.current;
    if (!fn) return;
    let live = true;
    // Reloads keep showing the previous data (no flash); only a first load blanks the page.
    setLoading(true);
    fn().then(
      (d) => {
        if (!live) return;
        setData(d);
        setError(null);
        setStatus(null);
        setLoading(false);
      },
      (e: unknown) => {
        if (!live) return;
        setError(calendarErrorMessage(e, 'Could not load the calendar.'));
        setStatus((e as { status?: number })?.status ?? null);
        setLoading(false);
      },
    );
    return () => {
      live = false;
    };
  }, [key, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, status, reload, setData };
}

export function useCalendarFeed(view: CalendarView, anchor: Date, enabled = true): Loaded<Feed> {
  const { from, to } = feedRange(view, anchor);
  // Layers are filtered on the client: one fetch per range, so the legend counts stay whole and toggling is instant.
  return useLoaded(enabled ? () => calendarApi.feed(from, to) : null, `${from}|${to}|${enabled}`);
}

export function useMilestones(): Loaded<MilestonesResponse> {
  return useLoaded(() => calendarApi.milestones(), 'milestones');
}

export function useMeetings(when: 'upcoming' | 'past' | 'all'): Loaded<{ meetings: Meeting[] }> {
  return useLoaded(() => calendarApi.meetings(when), `meetings|${when}`);
}

export function useReminderRules(): Loaded<ReminderRules> {
  return useLoaded(() => calendarApi.reminderRules(), 'reminders');
}

export function useSyncStatus(): Loaded<SyncStatus> {
  return useLoaded(() => calendarApi.syncStatus(), 'sync');
}

/** One event, fetched when `id` is set. */
export function useEvent(id: string | null): Loaded<CalendarEvent> {
  return useLoaded(id ? () => calendarApi.getEvent(id) : null, `event|${id}`);
}

const POLL_MS = 2500;
const POLL_GIVE_UP_MS = 60_000;

/** One meeting; while its summary is queued, polls every 2.5 s and gives up after 60 s. */
export function useMeeting(id: string | null) {
  const loaded = useLoaded(id ? () => calendarApi.getMeeting(id) : null, `meeting|${id}`);
  const { data, reload } = loaded;
  const [timedOut, setTimedOut] = useState(false);
  const queued = data?.assistant_state === 'queued';

  useEffect(() => {
    if (!queued) return;
    const started = Date.now();
    const t = setInterval(() => {
      if (Date.now() - started > POLL_GIVE_UP_MS) {
        clearInterval(t);
        setTimedOut(true);
        return;
      }
      reload();
    }, POLL_MS);
    return () => {
      clearInterval(t);
      setTimedOut(false);
    };
  }, [queued, reload]);

  return { ...loaded, timedOut };
}

/** Anchor "today" at local midnight, stable across renders. */
export function useToday(): Date {
  const [today] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  });
  return today;
}
