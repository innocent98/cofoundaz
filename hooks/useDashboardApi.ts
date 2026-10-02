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
  kpis: [
    {
      id: "revenue",
      metric: "revenue",
      label: "Monthly Revenue",
      value: "Coming Soon",
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/finance",
      hasData: false,
    },
    {
      id: "runway",
      metric: "runway",
      label: "Cash Runway",
      value: "Coming Soon",
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/finance",
      hasData: false,
    },
    {
      id: "pipeline",
      metric: "pipeline",
      label: "Pipeline Value",
      value: "Coming Soon",
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/sales",
      hasData: false,
    },
    {
      id: "ctr",
      metric: "ctr",
      label: "Campaign CTR",
      value: "Coming Soon",
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/marketing",
      hasData: false,
    },
    {
      id: "tasks",
      metric: "tasks_completed",
      label: "Tasks Done",
      value: "0",
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/dashboard",
      hasData: true,
    },
  ],
  risks: [],
  opportunities: [],
  risksStatus: "empty",
  opportunitiesStatus: "empty",
};

export function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v}`;
}

/**
 * Maps the raw KPIs payload into the 5 cards rendered on the dashboard.
 * Null-Safety & Honesty:
 * Financial KPIs (revenue, runway, pipeline_value, campaign_performance)
 * are rendered as "Coming Soon" when null/undefined, NEVER as "$0" or fabricated numbers.
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

  const formatMoney = (v: any) => (v === null || v === undefined ? "Coming Soon" : formatCurrency(Number(v)));
  const formatRunway = (v: any) => (v === null || v === undefined ? "Coming Soon" : `${v} mo`);
  const formatPlain = (v: any) => (v === null || v === undefined ? "Coming Soon" : String(v));

  const hasRevenue = k?.revenue !== null && k?.revenue !== undefined;
  const hasRunway = k?.runway !== null && k?.runway !== undefined;
  const hasPipeline = k?.pipeline_value !== null && k?.pipeline_value !== undefined;
  const hasCtr = k?.campaign_performance !== null && k?.campaign_performance !== undefined;

  let runwayAlert = false;
  if (hasRunway && typeof k?.runway === "number" && k.runway < 6) {
    runwayAlert = true;
  }

  return [
    {
      id: "revenue",
      metric: "revenue",
      label: "Monthly Revenue",
      value: formatMoney(k?.revenue),
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/finance",
      hasData: hasRevenue,
    },
    {
      id: "runway",
      metric: "runway",
      label: "Runway",
      value: formatRunway(k?.runway),
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/finance",
      hasData: hasRunway,
      isAlert: runwayAlert,
    },
    {
      id: "pipeline",
      metric: "pipeline",
      label: "Pipeline Value",
      value: formatMoney(k?.pipeline_value),
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/sales",
      hasData: hasPipeline,
    },
    {
      id: "ctr",
      metric: "ctr",
      label: "Campaign CTR",
      value: formatPlain(k?.campaign_performance),
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/marketing",
      hasData: hasCtr,
    },
    {
      id: "tasks",
      metric: "tasks_completed",
      label: "Tasks This Week",
      value: String(k?.tasks_done_this_week ?? 0),
      delta: "",
      trend: "flat",
      sparklineData: [],
      href: "/mission",
      hasData: true,
    },
  ];
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
          const ts = new Date(e.timestamp || Date.now()).getTime();
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
            verb: e.verb || "",
            entity: e.entity || "",
            timestamp: e.timestamp || new Date().toISOString(),
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
          const ts = new Date(incoming.timestamp).getTime();
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
