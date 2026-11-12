import { useState, useCallback, useEffect } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  actOnSuggestion,
  listAgents,
  listSuggestions,
  type AIAgentEntry,
  type AISuggestionCard,
  type SuggestionVerb,
} from '@/lib/api/aiChat';

/** GET /ai/suggestions: cards aggregated from what the app already generates (D-AI-3). */
export function useAISuggestions() {
  const [items, setItems] = useState<AISuggestionCard[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listSuggestions();
      setItems(data.items);
      setEnabled(data.enabled);
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, "Couldn't load your suggestions.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void refresh(); });
  }, [refresh]);

  /** Resolves the updated card (so "Do it" can navigate), or null on failure. */
  const act = useCallback(async (id: string, verb: SuggestionVerb, days?: number) => {
    setActionError(null);
    try {
      const updated = await actOnSuggestion(id, verb, days);
      setItems((prev) => prev.filter((s) => s.id !== id));
      return updated;
    } catch (err) {
      setActionError(apiErrorInfo(err, "Couldn't update that suggestion. Try again.").message);
      return null;
    }
  }, []);

  return { items, enabled, loading, error, actionError, refresh, act };
}

/** GET /ai/agents: the bench, with `available` per agent. */
export function useAIAgents() {
  const [agents, setAgents] = useState<AIAgentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAgents(await listAgents());
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, "Couldn't load your bench.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void refresh(); });
  }, [refresh]);

  return { agents, loading, error, refresh };
}
