/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "@/lib/api/client";
import {
  getDashboardSummary,
  getDashboardActivity,
  acceptBriefingAction,
  isSectionError,
} from "@/lib/api/dashboard";
import { useRealtimeEvent } from "@/components/realtime-context";
import type {
  DashboardSummaryResponse,
  AIBriefing,
  ActivityLogEntry,
  BriefingAction,
  KPISnapshot,
  RiskItem,
  OpportunityItem,
  UpcomingItem,
  AIContentStatus,
  MissionEmptyState,
} from "../types/dashboard";

export function formatCurrency(v: number): string {
  if (v < 0) return `-${formatCurrency(-v)}`;
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v}`;
}

/** Backend money is minor units (kobo); convert to naira before formatting. */
export function formatMinor(minor: number): string {
  return formatCurrency(minor / 100);
}

const COMING_SOON = "Coming Soon";

type TrendKind = "money" | "months" | "points" | "count";

interface RawTrend {
  delta?: number | null;
  series?: Array<{ period?: string; value?: number }>;
}

function signed(n: number, body: string): string {
  return `${n > 0 ? "+" : "-"}${body}`;
}

/**
 * Week-over-week chip and sparkline values from a tile's `trend` (BE guide 7a).
 * `delta` is null during a workspace's first week: no chip then, never "+0".
 * Units follow the tile: revenue is minor units; runway months and CTR percent
 * are floats; tasks an int. Higher is better for every tile.
 */
export function trendFields(
  kind: TrendKind,
  trend: RawTrend | undefined | null,
): Pick<KPISnapshot, "deltaLabel" | "deltaDirection" | "series"> {
  const values = (trend?.series ?? []).map((p) => p.value).filter((v): v is number => typeof v === "number");
  const series = values.length >= 2 ? values : [];
  const d = trend?.delta;
  if (typeof d !== "number") return { deltaLabel: null, deltaDirection: "flat", series };

  let body: string;
  let magnitude = Math.abs(d);
  switch (kind) {
    case "money":
      body = formatMinor(magnitude);
      break;
    case "months":
      magnitude = Math.round(magnitude * 10) / 10;
      body = `${magnitude} mo`;
      break;
    case "points":
      magnitude = Math.round(magnitude * 10) / 10;
      body = `${magnitude} pts`;
      break;
    default:
      body = String(magnitude);
  }
  if (magnitude === 0) return { deltaLabel: "No change vs last week", deltaDirection: "flat", series };
  return {
    deltaLabel: `${signed(d, body)} vs last week`,
    deltaDirection: d > 0 ? "up" : "down",
    series,
  };
}

type MetricTile = Pick<KPISnapshot, "value" | "hasData" | "status" | "hidden" | "cta" | "hint" | "isAlert" | "error">;

function comingSoon(): MetricTile {
  return { value: COMING_SOON, hasData: false };
}

/**
 * Shared handling for every non-"ok" status. Returns null when the status is
 * "ok" (or a status the caller formats itself), so the caller renders the value.
 */
function baseState(m: any, cta: KPISnapshot["cta"]): MetricTile | null {
  if (m === null || typeof m !== "object") return comingSoon();
  if (isSectionError(m)) return { value: "Unavailable", hasData: false, error: true };
  switch (m.status) {
    case "restricted":
      return { value: "", hasData: false, status: "restricted", hidden: true };
    case "no_data":
      return { value: "No data yet", hasData: false, status: "no_data", cta };
    case "not_built":
      return { ...comingSoon(), status: "not_built" };
    case "ok":
    case "not_burning":
    case "out_of_cash":
      return null;
    default:
      return comingSoon();
  }
}

function revenueTile(m: any): MetricTile {
  const base = baseState(m, { label: "Open Finance", href: "/finance" });
  if (base) return base;
  if (m.status !== "ok" || typeof m.value_minor !== "number") return comingSoon();
  return {
    value: formatMinor(m.value_minor),
    hasData: true,
    status: "ok",
    hint: "Avg. monthly money in, last 3 months",
  };
}

function runwayTile(m: any): MetricTile {
  const base = baseState(m, { label: "Open Finance", href: "/finance" });
  if (base) return base;
  if (m.status === "out_of_cash") {
    return { value: "Out of cash", hasData: true, status: "out_of_cash", isAlert: true };
  }
  if (m.status === "not_burning") {
    return { value: "Not burning", hasData: true, status: "not_burning", hint: "Break-even or profitable" };
  }
  if (typeof m.months !== "number") return comingSoon();
  return { value: `${m.months} mo`, hasData: true, status: "ok", isAlert: m.is_low === true };
}

function pipelineTile(m: any): MetricTile {
  const base = baseState(m, { label: "Open Sales", href: "/sales" });
  if (base) return base;
  if (typeof m.value_minor !== "number") return comingSoon();
  return { value: formatMinor(m.value_minor), hasData: true, status: "ok" };
}

function ctrTile(m: any): MetricTile {
  const base = baseState(m, { label: "Open Marketing", href: "/marketing" });
  if (base) return base;
  if (typeof m.ctr_percent !== "number") return comingSoon();
  return { value: `${m.ctr_percent}%`, hasData: true, status: "ok", hint: "Last 30 days" };
}

/**
 * Maps the raw KPIs payload into the cards rendered on the dashboard.
 * Reads `kpis.metrics.*` (the legacy scalar keys are always null) and renders
 * an honest state for every backend status:
 * ok -> value, no_data -> empty state + CTA, restricted -> tile hidden,
 * not_built -> "Coming Soon", per-tile { error: true } -> Unavailable + Retry.
 * Never renders "₦0" for missing data.
 */
export function mapKpis(k: any): KPISnapshot[] {
  if (isSectionError(k)) {
    return [
      { id: "revenue", metric: "revenue", label: "Monthly Revenue", value: "Unavailable", delta: "", trend: "flat", sparklineData: [], href: "/finance", hasData: false, error: true },
      { id: "runway", metric: "runway", label: "Runway", value: "Unavailable", delta: "", trend: "flat", sparklineData: [], href: "/finance", hasData: false, error: true },
      { id: "pipeline", metric: "pipeline", label: "Pipeline Value", value: "Unavailable", delta: "", trend: "flat", sparklineData: [], href: "/sales", hasData: false, error: true },
      { id: "ctr", metric: "ctr", label: "Campaign CTR", value: "Unavailable", delta: "", trend: "flat", sparklineData: [], href: "/marketing", hasData: false, error: true },
      { id: "tasks", metric: "tasks_completed", label: "Tasks This Week", value: "Unavailable", delta: "", trend: "flat", sparklineData: [], href: "/mission", hasData: false, error: true },
    ];
  }

  const metrics = k?.metrics ?? {};
  const tile = (
    id: string,
    metric: KPISnapshot["metric"],
    label: string,
    href: string,
    t: MetricTile,
    trend?: Pick<KPISnapshot, "deltaLabel" | "deltaDirection" | "series">,
  ): KPISnapshot => ({ id, metric, label, delta: "", trend: "flat", sparklineData: [], href, ...t, ...trend });

  // Restricted / not_built / error tiles carry no `trend` key (history would leak the value).
  const withTrend = (m: any, kind: TrendKind) =>
    m && typeof m === "object" && !isSectionError(m) && m.trend ? trendFields(kind, m.trend) : undefined;

  const tiles = [
    tile("revenue", "revenue", "Monthly Revenue", "/finance", revenueTile(metrics.revenue), withTrend(metrics.revenue, "money")),
    tile("runway", "runway", "Runway", "/finance", runwayTile(metrics.runway), withTrend(metrics.runway, "months")),
    tile("pipeline", "pipeline", "Pipeline Value", "/sales", pipelineTile(metrics.pipeline)),
    tile("ctr", "ctr", "Campaign CTR", "/marketing", ctrTile(metrics.campaign_ctr), withTrend(metrics.campaign_ctr, "points")),
    tile(
      "tasks",
      "tasks_completed",
      "Tasks This Week",
      "/mission",
      { value: String(k?.tasks_done_this_week ?? 0), hasData: true },
      k?.tasks_trend ? trendFields("count", k.tasks_trend) : undefined,
    ),
  ];
  return tiles;
}

const AI_STATUSES: AIContentStatus[] = ["empty", "generating", "ready", "restricted"];

function coerceStatus(raw: unknown, hasContent: boolean): AIContentStatus {
  if (typeof raw === "string" && (AI_STATUSES as string[]).includes(raw)) return raw as AIContentStatus;
  return hasContent ? "ready" : "empty";
}

function coerceSeverity(raw: unknown): RiskItem["severity"] {
  return raw === "high" || raw === "medium" || raw === "low" ? raw : "medium";
}

function mapActions(raw: unknown): BriefingAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a: any, i: number) => ({
    index: typeof a.index === "number" ? a.index : i,
    label: String(a.label ?? ""),
    kind: a.kind === "navigate" ? "navigate" : "task",
    href: typeof a.href === "string" ? a.href : null,
    accepted: a.accepted === true,
    missionTaskId: typeof a.mission_task_id === "string" ? a.mission_task_id : null,
  }));
}

function mapRisks(raw: any): { items: RiskItem[]; status: AIContentStatus } {
  if (!raw || typeof raw !== "object" || isSectionError(raw)) return { items: [], status: "empty" };
  const items: RiskItem[] = (Array.isArray(raw.items) ? raw.items : []).map((r: any, i: number) => ({
    id: String(r.index ?? i),
    severity: coerceSeverity(r.severity),
    description: String(r.text ?? ""),
    moduleLink: typeof r.href === "string" ? r.href : null,
  }));
  return { items, status: coerceStatus(raw.status, items.length > 0) };
}

function mapOpportunities(raw: any): { items: OpportunityItem[]; status: AIContentStatus } {
  if (!raw || typeof raw !== "object" || isSectionError(raw)) return { items: [], status: "empty" };
  const items: OpportunityItem[] = (Array.isArray(raw.items) ? raw.items : []).map((o: any, i: number) => ({
    id: String(o.index ?? i),
    description: String(o.text ?? ""),
    moduleLink: typeof o.href === "string" ? o.href : null,
  }));
  return { items, status: coerceStatus(raw.status, items.length > 0) };
}

/** The upcoming section is a list (live) or `{ items }`; a section error or anything else is "no items". */
function mapUpcoming(raw: any): { items: UpcomingItem[]; error: boolean } {
  if (isSectionError(raw)) return { items: [], error: true };
  const list: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
  return {
    error: false,
    items: list.map((u, i) => ({
      id: String(u.id ?? u.milestone_id ?? i),
      title: String(u.title ?? ""),
      dueOn: typeof u.due_on === "string" ? u.due_on : null,
    })),
  };
}

function mapEmptyReason(raw: unknown): MissionEmptyState {
  return raw === "weekend_off" || raw === "all_caught_up" ? raw : null;
}

/**
 * Normalizes the backend dashboard summary payload into the UI representation.
 * Resilient Section Handling:
 * Guards against sections returning { error: true } (health, mission, calibration, etc.)
 * rather than throwing or crashing the entire page widget.
 */
export function mapSummary(payload: any): DashboardSummaryResponse {
  const g = payload.greeting || {};

  // 1. Health Section Guard
  let healthState: DashboardSummaryResponse["health"];
  if (isSectionError(payload.health)) {
    healthState = {
      score: 0,
      deltaWeekly: 0,
      error: true,
      errorMessage: payload.health.message || "Unable to load health metrics",
    };
  } else {
    const h = payload.health || {};
    healthState = {
      score: h.score ?? 0,
      deltaWeekly: h.delta_7d ?? 0,
      status: h.status,
      band: h.band,
      summary: h.summary,
      error: false,
    };
  }

  // 2. Mission Section Guard
  let missionState: DashboardSummaryResponse["mission"] = null;
  if (payload.mission === null) {
    missionState = null;
  } else if (isSectionError(payload.mission)) {
    missionState = {
      streakDays: 0,
      status: "error",
      tasks: [],
      emptyReason: null,
      error: true,
      errorMessage: payload.mission.message || "Unable to load today's mission",
    };
  } else if (payload.mission) {
    const m = payload.mission;
    missionState = {
      streakDays: m.streak ?? 0,
      status: m.status,
      emptyReason: mapEmptyReason(m.empty_reason),
      error: false,
      // Snoozed / rejected tasks have left today's mission; only open and done ones are shown.
      tasks: Array.isArray(m.tasks)
        ? m.tasks.filter((t: any) => !t.status || t.status === "todo" || t.status === "done").map((t: any) => ({
            id: String(t.id),
            title: t.title,
            reason: t.reason ?? "",
            order: t.order ?? 0,
            completed: t.status === "done" || Boolean(t.completed),
            completedAt: t.completed_at ?? undefined,
          }))
        : [],
    };
  }

  // 3. Calibration Section Guard
  let calibrationState = payload.calibration;
  if (isSectionError(payload.calibration)) {
    calibrationState = {
      error: true,
      errorMessage: payload.calibration.message || "Unable to load calibration",
    };
  }

  // 4. Briefing Section Guard & AI Content Status
  let briefingState: AIBriefing;
  if (isSectionError(payload.briefing)) {
    briefingState = {
      id: null,
      date: new Date().toISOString(),
      agentBadge: "Co-Founder",
      content: "",
      status: "empty",
      actions: [],
      error: true,
      errorMessage: payload.briefing.message || "Unable to generate briefing",
    };
  } else {
    const b = payload.briefing || {};
    const content = b.message || b.content || "";
    let status = coerceStatus(b.status, Boolean(content));
    // If not generating or restricted and there is no message, it's empty
    if (!content && status !== "generating" && status !== "restricted") status = "empty";

    briefingState = {
      id: typeof b.id === "string" ? b.id : null,
      date: b.date || new Date().toISOString(),
      agentBadge: "Co-Founder",
      content,
      status,
      actions: mapActions(b.actions),
      error: false,
    };
  }

  // 5 + 6. Risks and Opportunities (rows: severity + text + href)
  const risks = mapRisks(payload.risks);
  const opportunities = mapOpportunities(payload.opportunities);
  const upcoming = mapUpcoming(payload.upcoming);

  return {
    greeting: g,
    user: { first_name: g.first_name },
    startup: { name: g.startup_name },
    health: healthState,
    mission: missionState,
    missionStatus: payload.mission_status === "restricted" ? "restricted" : "ok",
    briefing: briefingState,
    kpis: mapKpis(payload.kpis),
    calibration: calibrationState,
    risks: risks.items,
    opportunities: opportunities.items,
    risksStatus: risks.status,
    opportunitiesStatus: opportunities.status,
    upcoming: upcoming.items,
    upcomingError: upcoming.error,
    briefingRestricted: briefingState.status === "restricted",
    raw: payload,
  };
}

/** Re-poll cadence while the AI blocks are still being written (they finish in seconds to a minute). */
export const GENERATING_POLL_MS = 3500;
export const GENERATING_POLL_MAX = 8;

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const delayedRefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const generatingPollsRef = useRef(0);
  const refetchRef = useRef<() => Promise<void>>(async () => {});

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardSummary();

      // Unwrap envelope: { data: { ... } } or raw response
      const payload = res?.data || res;

      if (payload && typeof payload === "object") {
        const mapped = mapSummary(payload);
        setData(mapped);

        // While the briefing, risks or opportunities are "generating", re-fetch on a
        // short timer (bounded) to catch the transition to "ready".
        const isGenerating =
          mapped.briefing?.status === "generating" ||
          mapped.risksStatus === "generating" ||
          mapped.opportunitiesStatus === "generating";

        if (delayedRefetchTimerRef.current) {
          clearTimeout(delayedRefetchTimerRef.current);
          delayedRefetchTimerRef.current = null;
        }
        if (isGenerating && generatingPollsRef.current < GENERATING_POLL_MAX) {
          generatingPollsRef.current += 1;
          delayedRefetchTimerRef.current = setTimeout(() => {
            void refetchRef.current();
          }, GENERATING_POLL_MS);
        } else if (!isGenerating) {
          generatingPollsRef.current = 0;
        }
      } else {
        setData(null);
        setError(new Error("Unable to load dashboard summary: Invalid response format"));
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn("Dashboard summary unauthorized or forbidden:", err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    queueMicrotask(() => {
      void refetch();
    });

    return () => {
      if (delayedRefetchTimerRef.current) {
        clearTimeout(delayedRefetchTimerRef.current);
      }
    };
  }, [refetch]);

  // Briefing-ready / threshold notifications and reconnects mean the summary may have changed.
  useRealtimeEvent("resync", () => {
    void refetchRef.current();
  });

  return { data, loading, error, refetch, setData };
}

/** Why a Do it click failed, in the PRD's honest-and-actionable voice. */
export function briefingActionErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const code = (err.data as { error?: { code?: string } } | null)?.error?.code;
    if (code === "BRIEFING_STALE") return "That briefing is from an earlier day. Showing today's briefing.";
    if (code === "BRIEFING_NOT_READY") return "Your briefing is still being written. Try again in a moment.";
    if (err.status === 403) return "Only founders and team members can act on the briefing.";
  }
  return "Couldn't do that. Try again.";
}

export function useAIBriefing() {
  return { acceptAction: acceptBriefingAction };
}

function relativeFrom(iso: string, now = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/**
 * One activity item, as returned by GET /dashboard/activity and pushed as
 * `activity.created`, into the row the card renders. `actor` can be null
 * (system action) and `actor.name` can be null (member without a profile name).
 */
export function toActivityEntry(e: any, now = Date.now()): ActivityLogEntry {
  // The API field is `created_at` (not `timestamp`); falling back to the
  // wrong field made every row read "just now".
  const iso = e.created_at || e.timestamp || new Date(now).toISOString();
  const actorName =
    e.actor?.name || (typeof e.actor === "string" && e.actor.trim() ? e.actor : null) || null;
  const relative = relativeFrom(iso, now);
  return {
    id: String(e.id),
    actor: actorName ?? (e.actor ? "A teammate" : "System"),
    summary: e.summary || "",
    action: e.action || "",
    verb: e.verb || "",
    entity: e.entity || "",
    timestamp: iso,
    relativeTime: relative,
    time: relative,
    actorDetails: typeof e.actor === "object" && e.actor !== null ? e.actor : null,
  } as ActivityLogEntry;
}

/** Prepends a pushed row, ignoring one we already have (our own actions echo back). */
export function prependActivity(prev: ActivityLogEntry[], entry: ActivityLogEntry): ActivityLogEntry[] {
  return prev.some((x) => x.id === entry.id) ? prev : [entry, ...prev];
}

/** Appends an older page, skipping rows already shown (live prepends can overlap the page boundary). */
export function appendActivity(prev: ActivityLogEntry[], older: ActivityLogEntry[]): ActivityLogEntry[] {
  const seen = new Set(prev.map((x) => x.id));
  const fresh: ActivityLogEntry[] = [];
  for (const e of older) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    fresh.push(e);
  }
  return fresh.length ? [...prev, ...fresh] : prev;
}

export function useActivityFeed() {
  const [data, setData] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const fetchActivityRef = useRef<(cursor?: string) => Promise<void>>(async () => {});

  const fetchActivity = useCallback(
    async (cursor?: string) => {
      try {
        if (cursor) {
          setLoadingMore(true);
          setMoreError(false);
        } else {
          setLoading(true);
          setError(null);
        }

        const res = await getDashboardActivity(cursor);
        const now = Date.now();
        const enriched = (res.data?.items ?? []).map((e: any) => toActivityEntry(e, now));

        setData((prev) => (cursor ? appendActivity(prev, enriched) : enriched));
        setNextCursor(res.data?.next_cursor ?? null);
      } catch (err) {
        // Keyset pagination 422 recovery:
        // A malformed or expired cursor returns 422; reset to page 1 gracefully.
        if (cursor && err instanceof ApiError && err.status === 422) {
          console.warn("Activity feed cursor expired or malformed (422), resetting to first page.");
          setNextCursor(null);
          void fetchActivityRef.current(undefined);
          return;
        }

        // A failed load-more keeps the rows already shown and offers an inline retry.
        if (cursor) setMoreError(true);
        else setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchActivityRef.current = fetchActivity;
  }, [fetchActivity]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchActivity();
    });
  }, [fetchActivity]);

  // Live: `activity.created` on the notifications stream (D-DASH-2). Events are
  // best-effort, so a reconnect or the tab regaining focus refetches page 1.
  useRealtimeEvent("activity.created", (payload) => {
    if (!payload || typeof payload !== "object" || !("id" in payload)) return;
    const entry = toActivityEntry(payload);
    setData((prev) => prependActivity(prev, entry));
  });
  useRealtimeEvent("resync", () => {
    void fetchActivityRef.current(undefined);
  });

  return {
    data,
    setData,
    loading,
    error,
    fetchMore: () => {
      if (!nextCursor || loadingMore) return Promise.resolve();
      return fetchActivity(nextCursor);
    },
    loadingMore,
    moreError,
    hasMore: Boolean(nextCursor),
    nextCursor,
    refetch: () => fetchActivity(undefined),
  };
}
