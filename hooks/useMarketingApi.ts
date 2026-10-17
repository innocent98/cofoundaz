'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/lib/api/marketing';
import { isForbiddenError, marketingErrorMessage } from '@/lib/api/marketing';
import type {
  AnalyticsRange,
  CalendarEntry,
  CalendarEntryInput,
  CalendarEntryPatch,
  Campaign,
  CampaignInput,
  CampaignPatch,
  ChannelKey,
  ChannelStatus,
  ChecklistKey,
  CopyGeneration,
  ContentGapGeneration,
  Keyword,
  KeywordInput,
  KeywordPatch,
  MarketingAnalytics,
  MarketingChannel,
  MarketingOverview,
  Positioning,
  PositioningInput,
  Segment,
  SegmentInput,
  SegmentPatch,
  TrackedPage,
} from '@/lib/api/marketing';

// Marketing Hub data hooks. Every list/read exposes the same four honest states
// (loading / ready / error / forbidden) so pages never render sample rows. Mutations
// call the real endpoint and then refresh; they throw the ApiError so callers can
// show the API's own message.

export type LoadStatus = 'loading' | 'ready' | 'error' | 'forbidden';

export interface Resource<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
  reload: () => void;
}

interface ResourceState<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
}

/**
 * Load `fetcher()` on mount and whenever the (memoised) fetcher identity changes.
 * `reload()` refreshes quietly: stale data stays visible, no loading flash.
 */
export function useResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({ data: null, status: 'loading', error: null });
  const reqId = useRef(0);

  const run = useCallback(
    async (showLoading: boolean) => {
      const id = ++reqId.current;
      if (showLoading) setState((s) => ({ ...s, status: 'loading', error: null }));
      try {
        const data = await fetcher();
        if (id === reqId.current) setState({ data, status: 'ready', error: null });
      } catch (err) {
        if (id !== reqId.current) return;
        setState((s) => ({
          data: s.data,
          status: isForbiddenError(err) ? 'forbidden' : 'error',
          error: marketingErrorMessage(err, 'Could not load this data.'),
        }));
      }
    },
    [fetcher]
  );

  const invalidate = useCallback(() => {
    reqId.current++;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void run(true);
    });
    return invalidate;
  }, [run, invalidate]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const reload = useCallback(() => {
    void run(stateRef.current.data === null);
  }, [run]);

  return { data: state.data, status: state.status, error: state.error, reload };
}

/** Run a mutation then refresh the view. Errors propagate to the caller. */
function afterMutation<A extends unknown[], R>(reload: () => void, fn: (...args: A) => Promise<R>) {
  return async (...args: A): Promise<R> => {
    const result = await fn(...args);
    reload();
    return result;
  };
}

// ---------------------------------------------------------------- overview

export function useMarketingOverview() {
  const res = useResource<MarketingOverview>(api.getOverview);
  return { overview: res.data, ...res };
}

// ---------------------------------------------------------------- calendar

export function monthRange(month: Date): { from: string; to: string } {
  const from = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Entries scheduled inside `month` (grid) plus unscheduled drafts (backlog). */
export function useCalendar(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const { from, to } = useMemo(() => monthRange(new Date(year, monthIndex, 1)), [year, monthIndex]);
  const grid = useResource<CalendarEntry[]>(useCallback(() => api.listCalendarEntries({ from, to }), [from, to]));
  const drafts = useResource<CalendarEntry[]>(
    useCallback(() => api.listCalendarEntries({ status: 'draft' }), [])
  );

  const reloadGrid = grid.reload;
  const reloadDrafts = drafts.reload;
  const reloadAll = useCallback(() => {
    reloadGrid();
    reloadDrafts();
  }, [reloadGrid, reloadDrafts]);

  const backlog = useMemo(() => (drafts.data ?? []).filter((e) => e.scheduled_at === null), [drafts.data]);

  const status: LoadStatus =
    grid.status === 'forbidden' || drafts.status === 'forbidden'
      ? 'forbidden'
      : grid.status === 'error'
        ? 'error'
        : grid.status;

  return {
    entries: grid.data ?? [],
    backlog,
    status,
    error: grid.error ?? drafts.error,
    reload: reloadAll,
    create: afterMutation(reloadAll, (b: CalendarEntryInput) => api.createCalendarEntry(b)),
    update: afterMutation(reloadAll, (id: string, b: CalendarEntryPatch) => api.updateCalendarEntry(id, b)),
    remove: afterMutation(reloadAll, (id: string) => api.deleteCalendarEntry(id)),
  };
}

// ---------------------------------------------------------------- channels

export function useChannels() {
  const res = useResource<MarketingChannel[]>(api.listChannels);
  return {
    channels: res.data ?? [],
    ...res,
    // GET /channels lazy-seeds the 8 rows, so by the time this list rendered a PATCH is safe.
    setStatus: afterMutation(res.reload, (key: ChannelKey, status: ChannelStatus) =>
      api.updateChannel(key, { status })
    ),
    setNotes: afterMutation(res.reload, (key: ChannelKey, notes: string | null) =>
      api.updateChannel(key, { notes })
    ),
  };
}

// ---------------------------------------------------------------- segments + campaigns

export function useSegments() {
  const res = useResource<Segment[]>(api.listSegments);
  return {
    segments: res.data ?? [],
    ...res,
    create: afterMutation(res.reload, (b: SegmentInput) => api.createSegment(b)),
    update: afterMutation(res.reload, (id: string, b: SegmentPatch) => api.updateSegment(id, b)),
    remove: afterMutation(res.reload, (id: string) => api.deleteSegment(id)),
  };
}

export function useCampaigns() {
  const res = useResource<Campaign[]>(api.listCampaigns);
  return {
    campaigns: res.data ?? [],
    ...res,
    create: afterMutation(res.reload, (b: CampaignInput) => api.createCampaign(b)),
    update: afterMutation(res.reload, (id: string, b: CampaignPatch) => api.updateCampaign(id, b)),
    remove: afterMutation(res.reload, (id: string) => api.deleteCampaign(id)),
  };
}

// ---------------------------------------------------------------- copy history

export function useCopyHistory() {
  const res = useResource<CopyGeneration[]>(api.listCopyGenerations);
  return { history: res.data ?? [], ...res };
}

// ---------------------------------------------------------------- SEO

export function useKeywords() {
  const res = useResource<Keyword[]>(api.listKeywords);
  return {
    keywords: res.data ?? [],
    ...res,
    create: afterMutation(res.reload, (b: KeywordInput) => api.createKeyword(b)),
    update: afterMutation(res.reload, (id: string, b: KeywordPatch) => api.updateKeyword(id, b)),
    remove: afterMutation(res.reload, (id: string) => api.deleteKeyword(id)),
  };
}

export function useTrackedPages() {
  const res = useResource<TrackedPage[]>(api.listTrackedPages);
  return {
    pages: res.data ?? [],
    ...res,
    create: afterMutation(res.reload, (url: string) => api.createTrackedPage(url)),
    toggle: afterMutation(res.reload, (id: string, key: ChecklistKey, value: boolean) =>
      api.updateTrackedPage(id, { [key]: value })
    ),
    remove: afterMutation(res.reload, (id: string) => api.deleteTrackedPage(id)),
  };
}

export function usePositioning() {
  const res = useResource<Positioning>(api.getPositioning);
  return {
    positioning: res.data,
    ...res,
    save: afterMutation(res.reload, (b: PositioningInput) => api.savePositioning(b)),
  };
}

export function useContentGapHistory() {
  const res = useResource<ContentGapGeneration[]>(api.listContentGaps);
  return { history: res.data ?? [], ...res };
}

// ---------------------------------------------------------------- analytics

export function useAnalytics(range: AnalyticsRange) {
  const fetcher = useCallback(() => api.getAnalytics(range), [range]);
  const res = useResource<MarketingAnalytics>(fetcher);
  return { analytics: res.data, ...res };
}
