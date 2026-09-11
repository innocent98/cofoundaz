import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  DashboardSummaryResponse, 
  AIBriefing, 
  ActivityFeedResponse, 
  ActivityLogEntry 
} from '../types/dashboard';

// Replace with actual token/workspace id from auth context
const MOCK_TOKEN = 'mock-jwt-token';
const MOCK_WORKSPACE_ID = 'ws_12345';

const getHeaders = () => ({
  'Authorization': `Bearer ${MOCK_TOKEN}`,
  'X-Workspace-Id': MOCK_WORKSPACE_ID,
  'Content-Type': 'application/json'
});

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/dashboard/summary', { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.warn('Failed to fetch dashboard summary, falling back to null');
        setData(null);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
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
      const res = await fetch('/api/v1/dashboard/briefing/today', { headers: getHeaders() });
      if (!res.ok) {
        console.warn(`Failed to fetch AI briefing (status ${res.status}), falling back to null`);
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const acceptAction = async (briefingId: string, index: number) => {
    try {
      const res = await fetch(`/api/v1/dashboard/briefing/${briefingId}/actions/${index}/accept`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to accept action');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fallbackText = "I'll have your first briefing ready tomorrow morning once I've seen a full day of your workspace.";

  return { data, loading, error, refetch: fetchBriefing, acceptAction, fallbackText };
}

export function useActivityFeed(workspaceId: string) {
  const [data, setData] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchActivity = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) setLoading(true);
      setError(null);
      const url = new URL('/api/v1/dashboard/activity', window.location.origin);
      if (cursor) url.searchParams.append('cursor', cursor);
      
      const res = await fetch(url.toString(), { headers: getHeaders() });
      let json: any = null;
      if (res.ok) {
        json = await res.json();
      } else {
        console.warn('Failed to fetch activity feed, falling back to mock data');
      }
      
      // Normalize data list
      let newItems = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      
      // Fallback if empty
      if (newItems.length === 0) {
        newItems = [
          { id: '1', actor: 'Amara Okafor', verb: 'completed', entity: 'the mission task “Interview 3 gig workers”', timestamp: new Date(Date.now() - 7200000).toISOString(), relativeTime: '2h ago' },
          { id: '2', actor: 'Tayo', verb: 'returned', entity: 'your NDA with 2 comments', timestamp: new Date(Date.now() - 18000000).toISOString(), relativeTime: '5h ago' },
          { id: '3', actor: 'Your AI Co-Founder', verb: 'drafted', entity: 'your Lean Canvas', timestamp: new Date(Date.now() - 86400000).toISOString(), relativeTime: 'Yesterday' }
        ];
      }

      // Attach relative time to each entry
      const now = Date.now();
      const enriched = newItems.map((e: any) => {
        const ts = new Date(e.timestamp || Date.now()).getTime();
        const diffSec = Math.floor((now - ts) / 1000);
        let relative = '';
        if (diffSec < 60) relative = 'just now';
        else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
        else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
        else relative = `${Math.floor(diffSec / 86400)}d ago`;
        return { ...e, relativeTime: relative } as ActivityLogEntry;
      });
      
      setData((prev) => (cursor ? [...prev, ...enriched] : enriched));
      setNextCursor(json?.meta?.nextCursor ?? null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // WebSocket Sync
  useEffect(() => {
    if (!workspaceId) return;
    if (typeof window === 'undefined') return;

    // Use a robust wss url
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to workspace events
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: `workspace.${workspaceId}.activity`
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'activity_event' && payload.data) {
          const incoming = payload.data as ActivityLogEntry;
          // Compute relative time
          const now = Date.now();
          const ts = new Date(incoming.timestamp).getTime();
          const diffSec = Math.floor((now - ts) / 1000);
          let relative = '';
          if (diffSec < 60) relative = 'just now';
          else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
          else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
          else relative = `${Math.floor(diffSec / 86400)}d ago`;
          const entry = { ...incoming, relativeTime: relative };
          setData(prev => {
            // dedupe by id
            if (prev.find(item => item.id === entry.id)) return prev;
            return [entry, ...prev];
          });
        }
      } catch (err) {
        console.error('WebSocket message parsing error', err);
      }
    };

    ws.onerror = (error) => {
      console.warn('WebSocket error', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [workspaceId]);

  return { data, setData, loading, error, fetchMore: () => fetchActivity(nextCursor ?? undefined), hasMore: !!nextCursor };
}
