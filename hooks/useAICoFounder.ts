import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  AIConversation, 
  AIMessage, 
  AISuggestion, 
  AIMemoryFact,
  AgentKey 
} from '@/types/ai';

const DEFAULT_CONVERSATIONS: AIConversation[] = [
  {
    id: 'conv-1',
    title: 'Q3 Runway & Burn Analysis',
    topic: 'Finance',
    lastMessageAt: '10m ago',
    agentsInvolved: ['finance', 'cofounder'],
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'How long is our runway at the current burn rate?',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'assistant',
        agentKey: 'finance',
        agentBadge: 'Finance Advisor via Co-Founder',
        content:
          'Based on your cash balance of $142,000 and an average monthly burn of $28,400, your projected runway is 5.0 months. You should consider initiating fundraising talks or trimming SaaS tool expenses.',
        reasoningSummary:
          'Pulled balance from connected Stripe & Mercury ledgers. Evaluated trailing 3-month operating expenditure.',
        sources: [
          { id: 'src-1', label: 'August Financial Ledger', url: '/app/finance' },
          { id: 'src-2', label: 'Runway Forecast Model', url: '/app/finance' },
        ],
        actionChips: [
          { id: 'act-1', label: 'Draft budget plan', action: 'draft_budget', artifactTitle: 'Q4 Budget Plan' },
          { id: 'act-2', label: 'Add runway task', action: 'add_task', artifactTitle: 'Runway Review Task' },
        ],
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Contractor IP & NDA Review',
    topic: 'Legal',
    lastMessageAt: '2h ago',
    agentsInvolved: ['legal'],
    messages: [],
  },
];

export function useAICoFounder() {
  const [conversations, setConversations] = useState<AIConversation[]>(DEFAULT_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-1');
  const [messages, setMessages] = useState<AIMessage[]>(DEFAULT_CONVERSATIONS[0].messages || []);
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

      const initialAssistantMessage: AIMessage = {
        id: assistantMsgId,
        conversationId: currentConvId,
        role: 'assistant',
        agentKey: preselectedAgent || 'cofounder',
        agentBadge: preselectedAgent === 'finance'
          ? 'Finance Advisor via Co-Founder'
          : preselectedAgent === 'legal'
          ? 'Legal Advisor via Co-Founder'
          : 'AI Co-Founder',
        content: '',
        reasoningSummary: 'Synthesized your startup profile, current runway, and roadmap priorities.',
        sources: [
          { id: 'src-1', label: 'Company Overview', url: '/app/dashboard' },
        ],
        actionChips: [
          { id: `act-${Date.now()}`, label: 'Add as task', action: 'add_task', artifactTitle: 'Action Item' },
        ],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);

      if (!activeConversationId) {
        setActiveConversationId(currentConvId);
        const newConv: AIConversation = {
          id: currentConvId,
          title: content.slice(0, 32) + (content.length > 32 ? '...' : ''),
          topic: 'General',
          lastMessageAt: 'Just now',
          agentsInvolved: [preselectedAgent || 'cofounder'],
          messages: [userMessage, initialAssistantMessage],
        };
        setConversations((prev) => [newConv, ...prev]);
      }

      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const responseText = `Here is my assessment regarding "${content}":\n\nI have reviewed your active stage, traction targets, and connected workspace data. Let's move forward by breaking this down into concrete next steps.`;
        const words = responseText.split(' ');

        for (let i = 0; i < words.length; i++) {
          if (controller.signal.aborted) break;
          await new Promise((res) => setTimeout(res, 40));

          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.id === assistantMsgId) {
              copy[copy.length - 1] = {
                ...last,
                content: (last.content + ' ' + words[i]).trim(),
              };
            }
            return copy;
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Streaming error:', err);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
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
      const res = await fetch('/api/v1/ai/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { fetchSuggestions(); }); }, [fetchSuggestions]);

  const handleSuggestion = useCallback(async (id: string, action: 'accept' | 'dismiss' | 'snooze') => {
    try {
      await fetch(`/api/v1/ai/suggestions/${id}/${action}`, { method: 'POST' });
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
      const res = await fetch('/api/v1/ai/memory');
      const data = await res.json();
      setMemory(data.memory || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { fetchMemory(); }); }, [fetchMemory]);

  const forgetMemoryFact = useCallback(async (id: string) => {
    try {
      await fetch(`/api/v1/ai/memory/${id}`, { method: 'DELETE' });
      setMemory((prev) => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const clearAllMemory = useCallback(async () => {
    try {
      await fetch('/api/v1/ai/memory', { method: 'DELETE' });
      setMemory([]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return { memory, loading, forgetMemoryFact, clearAllMemory };
}

export type { AIMessage, AIConversation } from '../types/ai';
