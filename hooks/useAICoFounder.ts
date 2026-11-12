import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '@/lib/api/client';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  actOnAction,
  cancelReply,
  createConversation,
  getConversation,
  postMessage,
  regenerateReply,
  sendFeedback,
  unarchiveConversations,
  type ActionVerb,
  type ChatConversation,
  type ChatMessage,
} from '@/lib/api/aiChat';

// AI Co-Founder chat (BE module 03, Pattern B, D-AI-2: polling + Cancel, no streaming).
// Sending a message returns a `generating` assistant turn; we then bound-poll
// GET /ai/conversations/{id} (~1.5s) until that turn leaves `generating`
// (`ready | failed | cancelled`). We never fabricate a reply: a failed or
// timed-out turn resolves to an honest "try again" with a Retry.
//
// Cap: live the worker's LLM call can retry and a real reply took 60s+, so 90s
// keeps the poll bounded without crying wolf.

export const POLL_MS = 1500;
export const TIMEOUT_MS = 90000;

export const REPLY_FAILED_COPY = "Couldn't reach your co-founder. Try again.";
export const REPLY_CANCELLED_COPY = 'Cancelled.';

function chatErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'AI chat is available to founders and team members only.';
    if (err.status === 404) return 'That conversation is no longer available.';
    if (err.status === 409) {
      const { message } = apiErrorInfo(err, '');
      return message || 'Your co-founder is still replying. Try again in a moment.';
    }
    if (err.status === 422) {
      const { message, code } = apiErrorInfo(err, '');
      if (code === 'VALIDATION_ERROR' && message && !/highlighted/i.test(message)) return message;
      return "That message can't be sent. Keep it under 8000 characters.";
    }
  }
  return "Couldn't send your message. Try again.";
}

const ACTION_ERROR_COPY: Record<string, string> = {
  ACTION_CHANGED: "This was edited since, so it can't be undone automatically.",
  ACTION_TARGET_GONE: 'The item this change points to no longer exists.',
};

function actionErrorMessage(err: unknown): string {
  const info = apiErrorInfo(err, "Couldn't update that action. Try again.");
  if (info.code && ACTION_ERROR_COPY[info.code]) return ACTION_ERROR_COPY[info.code];
  if (info.status === 403) return 'AI chat is available to founders and team members only.';
  return info.message;
}

export const isGeneratingTurn = (m: ChatMessage | undefined) =>
  !!m && m.role === 'assistant' && m.status === 'generating';

const isLocalId = (id: string) => id.startsWith('local-');

export interface ActiveConversationMeta {
  id: string;
  title: string | null;
  topic: ChatConversation['topic'];
  archived_at: string | null;
  pinned_agent_key: string | null;
}

const metaOf = (c: ChatConversation): ActiveConversationMeta => ({
  id: c.id,
  title: c.title,
  topic: c.topic ?? null,
  archived_at: c.archived_at ?? null,
  pinned_agent_key: c.pinned_agent_key ?? null,
});

export interface UseAICoFounderOptions {
  /** Called when the set of conversations may have changed (new chat, reply landed, unarchive). */
  onChanged?: () => void;
}

export function useAICoFounder({ onChanged }: UseAICoFounderOptions = {}) {
  const [active, setActive] = useState<ActiveConversationMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A specialist chosen from "Your bench" for the NEXT new conversation.
  const [newChatAgent, setNewChatAgent] = useState<string | null>(null);

  // Bumped whenever the thread changes under a running send/poll (new chat,
  // another conversation, cancel, unmount) so stale async work stops touching state.
  const runRef = useRef(0);
  const sendingRef = useRef(false);
  const localIdRef = useRef(0);
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });

  const activeConversationId = active?.id ?? null;
  const isArchived = !!active?.archived_at;

  // A reply is pending while the last turn is an assistant turn still `generating`
  // (the optimistic placeholder counts). The BE 409s a second send in that window.
  const isGenerating = isGeneratingTurn(messages[messages.length - 1]);

  useEffect(() => {
    return () => {
      runRef.current += 1;
    };
  }, []);

  // Bounded poll of the thread until the last assistant turn leaves `generating`.
  const pollReply = useCallback(async (id: string, run: number) => {
    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      if (run !== runRef.current) return;
      try {
        const conv = await getConversation(id);
        if (run !== runRef.current) return;
        if (!isGeneratingTurn(conv.messages[conv.messages.length - 1])) {
          setMessages(conv.messages);
          setActive(metaOf(conv));
          setError(null);
          onChangedRef.current?.();
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
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      const run = ++runRef.current;
      setActive((prev) => (prev?.id === id ? prev : null));
      setMessages([]);
      setError(null);
      setThreadLoading(true);
      try {
        const conv = await getConversation(id);
        if (run !== runRef.current) return;
        setActive(metaOf(conv));
        setMessages(conv.messages);
        if (isGeneratingTurn(conv.messages[conv.messages.length - 1])) {
          void pollReply(id, run);
        }
      } catch (err) {
        if (run !== runRef.current) return;
        setActive(null);
        setError(chatErrorMessage(err));
      } finally {
        if (run === runRef.current) setThreadLoading(false);
      }
    },
    [pollReply]
  );

  /** Clears the thread. With `agentKey`, the next conversation is pinned to that specialist. */
  const startNewChat = useCallback((agentKey?: string | null) => {
    runRef.current += 1;
    sendingRef.current = false;
    setActive(null);
    setMessages([]);
    setThreadLoading(false);
    setError(null);
    setNewChatAgent(typeof agentKey === 'string' && agentKey ? agentKey : null);
  }, []);

  // Re-sync the thread from the server and resume waiting if a reply is still running.
  const resync = useCallback(
    async (id: string, run: number) => {
      try {
        const conv = await getConversation(id);
        if (run !== runRef.current) return;
        setMessages(conv.messages);
        setActive(metaOf(conv));
        if (isGeneratingTurn(conv.messages[conv.messages.length - 1])) void pollReply(id, run);
      } catch {
        // keep the message list as it was; the error already explains
      }
    },
    [pollReply]
  );

  /**
   * Sends a message. Resolves `true` once the BE accepted it (the reply is then
   * polled in the background) or `false` if it was rejected, so the caller can
   * restore the draft. `error` carries the reason.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim();
      if (!text || isGenerating || threadLoading || isArchived || sendingRef.current) return false;
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
          const conv = await createConversation(text, newChatAgent ?? undefined);
          if (run !== runRef.current) return true;
          convId = conv.id;
          setActive(metaOf(conv));
          setMessages(conv.messages);
          setNewChatAgent(null);
          onChangedRef.current?.();
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
          await resync(activeConversationId, run);
        }
        return false;
      } finally {
        sendingRef.current = false;
      }
    },
    [activeConversationId, isGenerating, isArchived, threadLoading, messages, newChatAgent, pollReply, resync]
  );

  const replaceMessage = useCallback((next: ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === next.id ? { ...m, ...next } : m)));
  }, []);

  /** Cancel the reply that is generating (replaces "Stop generating", D-AI-2). */
  const cancel = useCallback(async () => {
    const last = messages[messages.length - 1];
    if (!activeConversationId || !isGeneratingTurn(last) || isLocalId(last.id)) return;
    const run = ++runRef.current; // stop the running poll
    try {
      replaceMessage(await cancelReply(activeConversationId, last.id));
      setError(null);
      onChangedRef.current?.();
    } catch (err) {
      // REPLY_NOT_RUNNING: it just finished; show the real state instead.
      setError(err instanceof ApiError && err.status === 409 ? null : chatErrorMessage(err));
      await resync(activeConversationId, run);
    }
  }, [messages, activeConversationId, replaceMessage, resync]);

  /** Retry / regenerate: answers the latest reply again (same message id). */
  const regenerate = useCallback(
    async (messageId: string) => {
      if (!activeConversationId || isGenerating || isLocalId(messageId)) return;
      const run = ++runRef.current;
      setError(null);
      try {
        const turn = await regenerateReply(activeConversationId, messageId);
        if (run !== runRef.current) return;
        replaceMessage({ ...turn, content: '', agent: null, actions: [], feedback: null });
        void pollReply(activeConversationId, run);
      } catch (err) {
        setError(chatErrorMessage(err));
        // 409 REPLY_IN_PROGRESS (our poll gave up first): pick the real state back up.
        if (err instanceof ApiError && err.status === 409) await resync(activeConversationId, run);
      }
    },
    [activeConversationId, isGenerating, replaceMessage, pollReply, resync]
  );

  /** Thumbs: clicking the current rating clears it. Optimistic, rolled back on error. */
  const setFeedback = useCallback(
    async (messageId: string, rating: 'up' | 'down') => {
      const current = messages.find((m) => m.id === messageId)?.feedback ?? null;
      const next = current === rating ? null : rating;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: next } : m)));
      try {
        const saved = await sendFeedback(messageId, next);
        replaceMessage({ ...saved });
      } catch (err) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: current } : m)));
        setError(apiErrorInfo(err, "Couldn't save your feedback. Try again.").message);
      }
    },
    [messages, replaceMessage]
  );

  /** Confirm / dismiss / undo a proposed action chip. Nothing changes until the founder confirms. */
  const runAction = useCallback(async (messageId: string, actionId: string, verb: ActionVerb) => {
    setError(null);
    try {
      const updated = await actOnAction(messageId, actionId, verb);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, actions: (m.actions ?? []).map((a) => (a.id === actionId ? updated : a)) }
            : m
        )
      );
    } catch (err) {
      setError(actionErrorMessage(err));
    }
  }, []);

  /** Archived chats are read-only until unarchived. */
  const unarchiveActive = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      await unarchiveConversations([activeConversationId]);
      setActive((prev) => (prev ? { ...prev, archived_at: null } : prev));
      onChangedRef.current?.();
    } catch (err) {
      setError(apiErrorInfo(err, "Couldn't unarchive that conversation. Try again.").message);
    }
  }, [activeConversationId]);

  return {
    activeConversationId,
    activeConversation: active,
    isArchived,
    newChatAgent,
    messages,
    threadLoading,
    isGenerating,
    error,
    selectConversation,
    startNewChat,
    sendMessage,
    cancel,
    regenerate,
    setFeedback,
    runAction,
    unarchiveActive,
  };
}
