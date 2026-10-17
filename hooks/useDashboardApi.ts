/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "@/lib/api/client";
import {
  getDashboardSummary,
  getDashboardActivity,
  isSectionError,
} from "@/lib/api/dashboard";
import type {
  DashboardSummaryResponse,
  AIBriefing,
  ActivityLogEntry,
  KPISnapshot,
  RiskItem,
  OpportunityItem,
  AIContentStatus,
} from "../types/dashboard";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cf_token");
}

function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cf_workspace_id");
}

export const DEFAULT_SUMMARY: DashboardSummaryResponse = {
  health: {
    score: 0,
    deltaWeekly: 0,
    status: "pending_assessment",
    summary: "Complete your kickoff assessment to see what’s driving your score.",
  },
  mission: null,
  briefing: {
    id: "b-1",
    date: new Date().toISOString(),
    agentBadge: "Co-Founder",
    status: "empty",
    content: "I’ll have your first briefing ready tomorrow morning once I’ve seen a full day of your workspace.",
    actions: [],
  },
  // No fabricated tiles: real tiles come from mapKpis(kpis.metrics).
  kpis: [],
  risks: [],
  opportunities: [],
  risksStatus: "empty",
  opportunitiesStatus: "empty",
};

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
  ): KPISnapshot => ({ id, metric, label, delta: "", trend: "flat", sparklineData: [], href, ...t });

  const tiles = [
    tile("revenue", "revenue", "Monthly Revenue", "/finance", revenueTile(metrics.revenue)),
    tile("runway", "runway", "Runway", "/finance", runwayTile(metrics.runway)),
    tile("pipeline", "pipeline", "Pipeline Value", "/sales", pipelineTile(metrics.pipeline)),
    tile("ctr", "ctr", "Campaign CTR", "/marketing", ctrTile(metrics.campaign_ctr)),
    {
      id: "tasks",
      metric: "tasks_completed" as const,
      label: "Tasks This Week",
      value: String(k?.tasks_done_this_week ?? 0),
      delta: "",
      trend: "flat" as const,
      sparklineData: [],
      href: "/mission",
      hasData: true,
    },
  ];
  return tiles;
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
      error: true,
      errorMessage: payload.mission.message || "Unable to load today's mission",
    };
  } else if (payload.mission) {
    const m = payload.mission;
    missionState = {
      streakDays: m.streak ?? 0,
      status: m.status,
      error: false,
      tasks: Array.isArray(m.tasks)
        ? m.tasks.map((t: any) => ({
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
      id: "briefing",
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
    let status: AIContentStatus = b.status || (b.message || b.content ? "ready" : "empty");
    if (!["empty", "generating", "ready"].includes(status)) {
      status = b.message || b.content ? "ready" : "empty";
    }
    const content = b.message || b.content || "";
    // If not generating and no message, it's empty
    if (!content && status !== "generating") {
      status = "empty";
    }

    briefingState = {
      id: b.id || "briefing",
      date: b.date || new Date().toISOString(),
      agentBadge: "Co-Founder",
      content,
      status,
      actions: Array.isArray(b.actions) ? b.actions : [],
      error: false,
    };
  }

  // 5. Risks Section Guard & AI Content Status
  let risksItems: RiskItem[] = [];
  let risksStatus: AIContentStatus = "empty";
  if (!isSectionError(payload.risks)) {
    if (Array.isArray(payload.risks)) {
      risksItems = payload.risks;
      risksStatus = payload.risks.length > 0 ? "ready" : "empty";
    } else if (payload.risks && typeof payload.risks === "object") {
      risksStatus = payload.risks.status || "empty";
      if (Array.isArray(payload.risks.items)) {
        risksItems = payload.risks.items;
      }
    }
  }

  // 6. Opportunities Section Guard & AI Content Status
  let opportunitiesItems: OpportunityItem[] = [];
  let opportunitiesStatus: AIContentStatus = "empty";
  if (!isSectionError(payload.opportunities)) {
    if (Array.isArray(payload.opportunities)) {
      opportunitiesItems = payload.opportunities;
      opportunitiesStatus = payload.opportunities.length > 0 ? "ready" : "empty";
    } else if (payload.opportunities && typeof payload.opportunities === "object") {
      opportunitiesStatus = payload.opportunities.status || "empty";
      if (Array.isArray(payload.opportunities.items)) {
        opportunitiesItems = payload.opportunities.items;
      }
    }
  }

  return {
    greeting: g,
    user: { first_name: g.first_name },
    startup: { name: g.startup_name },
    health: healthState,
    mission: missionState,
    briefing: briefingState,
    kpis: mapKpis(payload.kpis),
    calibration: calibrationState,
    risks: risksItems,
    opportunities: opportunitiesItems,
    risksStatus,
    opportunitiesStatus,
    raw: payload,
  };
}

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const delayedRefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredDelayedRefetchRef = useRef(false);
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

        // AI Daily Briefing Status States:
        // If briefing, risks, or opportunities are in "generating" state,
        // trigger a single delayed re-fetch shortly after load to catch the transition to "ready".
        const isGenerating =
          mapped.briefing?.status === "generating" ||
          mapped.risksStatus === "generating" ||
          mapped.opportunitiesStatus === "generating";

        if (isGenerating && !hasTriggeredDelayedRefetchRef.current) {
          hasTriggeredDelayedRefetchRef.current = true;
          if (delayedRefetchTimerRef.current) {
            clearTimeout(delayedRefetchTimerRef.current);
          }
          delayedRefetchTimerRef.current = setTimeout(() => {
            void refetchRef.current();
          }, 3500);
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

  return { data, loading, error, refetch, setData };
}

export function useAIBriefing() {
  const [data] = useState<AIBriefing | null>(null);
  const [loading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fallbackText =
    "I’ll have your first briefing ready tomorrow morning once I’ve seen a full day of your workspace.";

  const acceptAction = async (briefingId: string, index: number) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      return await apiClient(`/dashboard/briefing/${briefingId}/actions/${index}/accept`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to accept action:", err);
      throw err;
    }
  };

  return { data, loading, error, refetch: () => Promise.resolve(), acceptAction, fallbackText, setError };
}

export function useActivityFeed(workspaceId?: string) {
  const [data, setData] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fetchActivityRef = useRef<(cursor?: string) => Promise<void>>(async () => {});

  const activeWorkspace = workspaceId || getActiveWorkspaceId() || "default";

  const fetchActivity = useCallback(
    async (cursor?: string) => {
      try {
        if (!cursor) setLoading(true);
        setError(null);

        const res = await getDashboardActivity(cursor);
        const newItems = res.data?.items ?? [];

        const now = Date.now();
        const enriched: ActivityLogEntry[] = newItems.map((e: any) => {
          // The API field is `created_at` (not `timestamp`); falling back to the
          // wrong field made every row read "just now".
          const iso = e.created_at || e.timestamp || new Date().toISOString();
          const ts = new Date(iso).getTime();
          const diffSec = Math.floor((now - ts) / 1000);
          let relative = "";
          if (diffSec < 60) relative = "just now";
          else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
          else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
          else relative = `${Math.floor(diffSec / 86400)}d ago`;

          // Actor null-safety: Fallback to "System" if actor or actor.name is missing
          const actorName =
            e.actor?.name ||
            (typeof e.actor === "string" && e.actor.trim() ? e.actor : null) ||
            "System";

          return {
            id: String(e.id),
            actor: actorName,
            // The API hands us a ready sentence; prefer it over verb/entity
            // (which the API doesn't emit).
            summary: e.summary || "",
            action: e.action || "",
            verb: e.verb || "",
            entity: e.entity || "",
            timestamp: iso,
            relativeTime: relative,
            time: relative,
            actorDetails: typeof e.actor === "object" && e.actor !== null ? e.actor : null,
          } as ActivityLogEntry;
        });

        setData((prev) => (cursor ? [...prev, ...enriched] : enriched));
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

        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
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

  // WebSocket Subscription (disabled in dev / when hitting proxy)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = getAuthToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (!apiUrl || apiUrl.includes("localhost") || process.env.NODE_ENV === "development") {
      return;
    }
    const wsBaseUrl = apiUrl.replace(/^http/, "ws");

    const wsUrl = `${wsBaseUrl}/ws?workspace_id=${encodeURIComponent(
      activeWorkspace
    )}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (e) {
      console.warn("WebSocket initialization failed:", e);
      return;
    }

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: `workspace.${activeWorkspace}.activity`,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "activity_event" && payload.data) {
          const incoming = payload.data;
          const now = Date.now();
          const iso = incoming.created_at || incoming.timestamp || new Date().toISOString();
          const ts = new Date(iso).getTime();
          const diffSec = Math.floor((now - ts) / 1000);
          let relative = "";
          if (diffSec < 60) relative = "just now";
          else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
          else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
          else relative = `${Math.floor(diffSec / 86400)}d ago`;

          const actorName =
            incoming.actor?.name ||
            (typeof incoming.actor === "string" && incoming.actor.trim() ? incoming.actor : null) ||
            "System";

          const entry: ActivityLogEntry = {
            ...incoming,
            id: String(incoming.id),
            actor: actorName,
            summary: incoming.summary || "",
            timestamp: iso,
            relativeTime: relative,
            time: relative,
          };
          setData((prev) => {
            if (prev.find((item) => item.id === entry.id)) return prev;
            return [entry, ...prev];
          });
        }
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error:", err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [activeWorkspace]);

  return {
    data,
    setData,
    loading,
    error,
    fetchMore: () => fetchActivity(nextCursor ?? undefined),
    hasMore: Boolean(nextCursor),
    nextCursor,
    refetch: () => fetchActivity(undefined),
  };
}
