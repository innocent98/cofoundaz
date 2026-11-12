import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import {
  createConversation,
  getConversation,
  listConversations,
  postMessage,
  type ChatConversationSummary,
  type ChatMessage,
} from '@/lib/api/aiChat';
import type { AISuggestion, AIMemoryFact } from '@/types/ai';

// AI Co-Founder chat (BE module 03, Pattern B). Sending a message returns a
// `generating` assistant turn; we then bound-poll GET /ai/conversations/{id}
// (~1.5s) until that turn is `ready` or `failed`. We never fabricate a reply: a
// failed or timed-out turn resolves to an honest "try again".
//
// Cap: the guide suggests ~30s, but live the worker's LLM call can retry (an
// empty completion is retried) and a real reply took 60s+, so a 30s cap showed
// "couldn't reach" for a reply that then landed. 90s keeps the poll bounded
// without crying wolf.

export const POLL_MS = 1500;
export const TIMEOUT_MS = 90000;

export const REPLY_FAILED_COPY = "Couldn't reach your co-founder. Try again.";

function chatErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'AI chat is available to founders and team members only.';
    if (err.status === 404) return 'That conversation is no longer available.';
    if (err.status === 409) return 'Your co-founder is still replying. Try again in a moment.';
    if (err.status === 422) return "That message can't be sent. Keep it under 8000 characters.";
  }
  return "Couldn't send your message. Try again.";
}

const isGeneratingTurn = (m: ChatMessage | undefined) =>
  !!m && m.role === 'assistant' && m.status === 'generating';

export interface UseAICoFounderOptions {
  /** Load the caller's conversation list on mount (the /ai page and history). */
  withList?: boolean;
}

export function useAICoFounder({ withList = false }: UseAICoFounderOptions = {}) {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(withList);
  const [conversationsError, setConversationsError] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bumped whenever the thread changes under a running send/poll (new chat,
  // another conversation, unmount) so stale async work stops touching state.
  const runRef = useRef(0);
  const sendingRef = useRef(false);
  const localIdRef = useRef(0);

  // A reply is pending while the last turn is an assistant turn still `generating`
  // (the optimistic placeholder counts). The BE 409s a second send in that window.
  const isGenerating = isGeneratingTurn(messages[messages.length - 1]);

  const refreshConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      setConversations(await listConversations());
      setConversationsError(false);
    } catch {
      setConversationsError(true);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (withList) queueMicrotask(() => { void refreshConversations(); });
  }, [withList, refreshConversations]);

  useEffect(() => {
    return () => {
      runRef.current += 1;
    };
  }, []);

  const touchConversation = useCallback((conv: ChatConversationSummary) => {
    setConversations((prev) => [
      { id: conv.id, title: conv.title, created_at: conv.created_at, updated_at: conv.updated_at },
      ...prev.filter((c) => c.id !== conv.id),
    ]);
  }, []);

  // Bounded poll of the thread until the last assistant turn leaves `generating`.
  const pollReply = useCallback(
    async (id: string, run: number) => {
      const deadline = Date.now() + TIMEOUT_MS;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (run !== runRef.current) return;
        try {
          const conv = await getConversation(id);
          if (run !== runRef.current) return;
          if (!isGeneratingTurn(conv.messages[conv.messages.length - 1])) {
            setMessages(conv.messages);
            setError(null);
            touchConversation(conv);
            return;
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) break;
          // transient error: keep polling until the deadline
        }
      }
      if (run !== runRef.current) return;
      // Honest timeout: mark the pending turn failed rather than spin forever.
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && isGeneratingTurn(m) ? { ...m, status: 'failed' as const } : m
        )
      );
    },
    [touchConversation]
  );

  const selectConversation = useCallback(
    async (id: string) => {
      const run = ++runRef.current;
      setActiveConversationId(id);
      setMessages([]);
      setError(null);
      setThreadLoading(true);
      try {
        const conv = await getConversation(id);
        if (run !== runRef.current) return;
        setMessages(conv.messages);
        if (isGeneratingTurn(conv.messages[conv.messages.length - 1])) {
          void pollReply(id, run);
        }
      } catch (err) {
        if (run !== runRef.current) return;
        setActiveConversationId(null);
        setError(chatErrorMessage(err));
      } finally {
        if (run === runRef.current) setThreadLoading(false);
      }
    },
    [pollReply]
  );

  const startNewChat = useCallback(() => {
    runRef.current += 1;
    sendingRef.current = false;
    setActiveConversationId(null);
    setMessages([]);
    setThreadLoading(false);
    setError(null);
  }, []);

  /**
   * Sends a message. Resolves `true` once the BE accepted it (the reply is then
   * polled in the background) or `false` if it was rejected, so the caller can
   * restore the draft. `error` carries the reason.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim();
      if (!text || isGenerating || threadLoading || sendingRef.current) return false;
      sendingRef.current = true;
      setError(null);

      const run = ++runRef.current;
      const n = ++localIdRef.current;
      const now = new Date().toISOString();
      const userTurn: ChatMessage = {
        id: `local-user-${n}`, role: 'user', status: 'ready', content: text, created_at: now,
      };
      const pending: ChatMessage = {
        id: `local-assistant-${n}`, role: 'assistant', status: 'generating', content: '', created_at: now,
      };
      const before = messages;
      setMessages([...before, userTurn, pending]);

      try {
        let convId = activeConversationId;
        if (!convId) {
          const conv = await createConversation(text);
          if (run !== runRef.current) return true;
          convId = conv.id;
          setActiveConversationId(conv.id);
          setMessages(conv.messages);
          touchConversation(conv);
        } else {
          const assistantTurn = await postMessage(convId, text);
          if (run !== runRef.current) return true;
          setMessages((prev) => prev.map((m) => (m.id === pending.id ? assistantTurn : m)));
        }
        void pollReply(convId, run);
        return true;
      } catch (err) {
        if (run !== runRef.current) return false;
        // Not accepted: drop the optimistic turns so nothing unsent looks sent.
        setMessages(before);
        setError(chatErrorMessage(err));
        if (err instanceof ApiError && err.status === 409 && activeConversationId) {
          // The previous reply is still generating server-side (e.g. our own poll
          // gave up first): re-sync from the server and resume waiting on it.
          try {
            const conv = await getConversation(activeConversationId);
            if (run === runRef.current) {
              setMessages(conv.messages);
              if (isGeneratingTurn(conv.messages[conv.messages.length - 1])) {
                void pollReply(activeConversationId, run);
              }
            }
          } catch {
            // keep the message list as it was; the error above already explains
          }
        }
        return false;
      } finally {
        sendingRef.current = false;
      }
    },
    [activeConversationId, isGenerating, threadLoading, messages, pollReply, touchConversation]
  );

  return {
    conversations,
    conversationsLoading,
    conversationsError,
    refreshConversations,
    activeConversationId,
    messages,
    threadLoading,
    isGenerating,
    error,
    selectConversation,
    startNewChat,
    sendMessage,
  };
}

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<{ suggestions?: AISuggestion[]; data?: { suggestions?: AISuggestion[] } }>('/ai/suggestions');
      setSuggestions(data.data?.suggestions ?? data.suggestions ?? []);
    } catch {
      // AI suggestions backend is not wired yet — show an honest empty list.
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { fetchSuggestions(); }); }, [fetchSuggestions]);

  const handleSuggestion = useCallback(async (id: string, action: 'accept' | 'dismiss' | 'snooze') => {
    try {
      await apiClient(`/ai/suggestions/${id}/${action}`, { method: 'POST' });
      setSuggestions((prev) => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  return { suggestions, loading, handleSuggestion };
}

export function useAIMemory() {
  const [memory, setMemory] = useState<AIMemoryFact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<{ memory?: AIMemoryFact[]; data?: { memory?: AIMemoryFact[] } }>('/ai/memory');
      setMemory(data.data?.memory ?? data.memory ?? []);
    } catch {
      // AI memory backend is not wired yet — show an honest empty list.
      setMemory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { fetchMemory(); }); }, [fetchMemory]);

  const forgetMemoryFact = useCallback(async (id: string) => {
    try {
      await apiClient(`/ai/memory/${id}`, { method: 'DELETE' });
      setMemory((prev) => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const clearAllMemory = useCallback(async () => {
    try {
      await apiClient('/ai/memory', { method: 'DELETE' });
      setMemory([]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return { memory, loading, forgetMemoryFact, clearAllMemory };
}

