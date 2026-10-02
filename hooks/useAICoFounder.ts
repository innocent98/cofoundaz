import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type {
  AIConversation, 
  AIMessage, 
  AISuggestion, 
  AIMemoryFact,
  AgentKey 
} from '@/types/ai';

// The AI Co-Founder chat has no backend yet — `ai.py` exposes only `GET /ai/status`
// (token budget), with no chat/conversation endpoint. We therefore start with no
// fabricated conversation history and never invent an answer (see `sendMessage`).
const DEFAULT_CONVERSATIONS: AIConversation[] = [];

const UNAVAILABLE_REPLY =
  "The AI Co-Founder isn't connected yet, so I can't actually answer this. " +
  "Chat and the specialist advisors are coming once the AI backend is wired up. " +
  "Nothing you type here is sent anywhere yet.";

export function useAICoFounder() {
  const [conversations, setConversations] = useState<AIConversation[]>(DEFAULT_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    const found = conversations.find((c) => c.id === id);
    setMessages(found?.messages || []);
  }, [conversations]);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string, preselectedAgent?: AgentKey) => {
      if (!content.trim() || isStreaming) return;

      const userMsgId = `usr-${Date.now()}`;
      const assistantMsgId = `ast-${Date.now()}`;
      const currentConvId = activeConversationId || `conv-${Date.now()}`;

      const userMessage: AIMessage = {
        id: userMsgId,
        conversationId: currentConvId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      // Honest reply: the backend AI isn't wired, so we never fabricate an
      // answer, reasoning, sources, or action chips.
      const assistantMessage: AIMessage = {
        id: assistantMsgId,
        conversationId: currentConvId,
        role: 'assistant',
        agentKey: preselectedAgent || 'cofounder',
        agentBadge: 'AI Co-Founder',
        content: UNAVAILABLE_REPLY,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      if (!activeConversationId) {
        setActiveConversationId(currentConvId);
        const newConv: AIConversation = {
          id: currentConvId,
          title: content.slice(0, 32) + (content.length > 32 ? '...' : ''),
          topic: 'General',
          lastMessageAt: new Date().toISOString(),
          agentsInvolved: [preselectedAgent || 'cofounder'],
          messages: [userMessage, assistantMessage],
        };
        setConversations((prev) => [newConv, ...prev]);
      }
    },
    [activeConversationId, isStreaming]
  );
  
  const executeAction = useCallback(async (messageId: string, actionKey: string) => {
    setMessages((prev) => prev.map((msg) => {
      if (msg.id === messageId && msg.actionChips) {
        return {
          ...msg,
          actionChips: msg.actionChips.map(chip => 
            chip.action === actionKey ? { ...chip, executed: true, artifactTitle: chip.artifactTitle || 'Action Item' } : chip
          )
        };
      }
      return msg;
    }));
    return { success: true };
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    selectConversation,
    startNewChat,
    sendMessage,
    stopGenerating,
    executeAction
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

export type { AIMessage, AIConversation } from '../types/ai';
