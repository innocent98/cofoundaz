/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, ApiError } from "@/lib/api/client";
import type {
  DashboardSummaryResponse,
  AIBriefing,
  ActivityFeedResponse,
  ActivityLogEntry,
} from "../types/dashboard";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cf_token");
}

function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cf_workspace_id");
}

const DEFAULT_SUMMARY: DashboardSummaryResponse = {
  health: {
    score: 72,
    deltaWeekly: 4,
  },
  mission: {
    streakDays: 3,
    tasks: [
      {
        id: "1",
        title: "Complete initial customer discovery interviews",
        reason: "Validates core problem hypothesis",
        order: 1,
        completed: false,
      },
      {
        id: "2",
        title: "Review startup legal checklist",
        reason: "Ensures IP assignment compliance",
        order: 2,
        completed: false,
      },
    ],
  },
  briefing: {
    id: "b-1",
    date: new Date().toISOString(),
    agentBadge: "Co-Founder",
    content: "Good morning! Focus on validating your primary customer persona and completing discovery interviews today.",
    actions: [
      { index: 0, label: "View interview templates" },
      { index: 1, label: "Update hypothesis deck" },
    ],
  },
  kpis: [
    {
      id: "k-1",
      metric: "revenue",
      label: "Monthly Revenue",
      value: "$0",
      delta: "+0%",
      trend: "flat",
      sparklineData: [0, 0, 0, 0, 0],
      href: "/finance",
    },
    {
      id: "k-2",
      metric: "runway",
      label: "Cash Runway",
      value: "12 mo",
      delta: "Stable",
      trend: "flat",
      sparklineData: [12, 12, 12, 12, 12],
      href: "/finance",
    },
    {
      id: "k-3",
      metric: "tasks_completed",
      label: "Tasks Done",
      value: "8 / 12",
      delta: "+2 this wk",
      trend: "up",
      sparklineData: [2, 4, 5, 6, 8],
      href: "/dashboard",
    },
  ],
  risks: [],
  opportunities: [],
};

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<any>("/dashboard/summary");

      // Unwrap envelope: { data: { ... } } or raw response
      const payload = res?.data || res;

      if (payload && (payload.health || payload.kpis || payload.mission)) {
        setData({
          health: payload.health ?? DEFAULT_SUMMARY.health,
          mission: payload.mission ?? DEFAULT_SUMMARY.mission,
          briefing: payload.briefing ?? DEFAULT_SUMMARY.briefing,
          kpis: payload.kpis ?? DEFAULT_SUMMARY.kpis,
          risks: payload.risks ?? [],
          opportunities: payload.opportunities ?? [],
        });
      } else {
        // Safe fallback if staging returns partial or empty body
        setData(DEFAULT_SUMMARY);
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn("Dashboard summary unauthorized or forbidden:", err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      // Keep dashboard functional even if network/auth issues occur
      setData(DEFAULT_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}

export function useAIBriefing() {
  const [data, setData] = useState<AIBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<any>("/dashboard/briefing/today");
      const payload = res?.data || res;
      setData(payload ?? null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn("Briefing unauthorized:", err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchBriefing();
    });
  }, [fetchBriefing]);

  const acceptAction = async (briefingId: string, index: number) => {
    try {
      return await apiClient(`/dashboard/briefing/${briefingId}/actions/${index}/accept`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to accept action:", err);
      throw err;
    }
  };

  const fallbackText =
    "I'll have your first briefing ready tomorrow morning once I've seen a full day of your workspace.";

  return { data, loading, error, refetch: fetchBriefing, acceptAction, fallbackText };
}

export function useActivityFeed(workspaceId?: string) {
  const [data, setData] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const activeWorkspace = workspaceId || getActiveWorkspaceId() || "default";

  const fetchActivity = useCallback(
    async (cursor?: string) => {
      try {
        if (!cursor) setLoading(true);
        setError(null);

        const endpoint = cursor
          ? `/dashboard/activity?cursor=${encodeURIComponent(cursor)}`
          : "/dashboard/activity";

        const res = await apiClient<any>(endpoint);

        let newItems: any[] = [];
        if (Array.isArray(res?.data)) {
          newItems = res.data;
        } else if (Array.isArray(res)) {
          newItems = res;
        }

        if (newItems.length === 0 && !cursor) {
          newItems = [
            {
              id: "1",
              actor: "Amara Okafor",
              verb: "completed",
              entity: "the mission task “Interview 3 gig workers”",
              timestamp: new Date(Date.now() - 7200000).toISOString(),
            },
            {
              id: "2",
              actor: "Tayo",
              verb: "returned",
              entity: "your NDA with 2 comments",
              timestamp: new Date(Date.now() - 18000000).toISOString(),
            },
            {
              id: "3",
              actor: "Your AI Co-Founder",
              verb: "drafted",
              entity: "your Lean Canvas",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
            },
          ];
        }

        const now = Date.now();
        const enriched: ActivityLogEntry[] = newItems.map((e: any) => {
          const ts = new Date(e.timestamp || Date.now()).getTime();
          const diffSec = Math.floor((now - ts) / 1000);
          let relative = "";
          if (diffSec < 60) relative = "just now";
          else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
          else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
          else relative = `${Math.floor(diffSec / 86400)}d ago`;

          return { ...e, relativeTime: relative } as ActivityLogEntry;
        });

        setData((prev) => (cursor ? [...prev, ...enriched] : enriched));
        setNextCursor(res?.meta?.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchActivity();
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

          const entry: ActivityLogEntry = { ...incoming, relativeTime: relative };
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
    hasMore: !!nextCursor,
  };
}
