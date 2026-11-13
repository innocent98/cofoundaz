'use client';

import React, { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, MessagesSquare, X, Archive } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAICoFounder } from '@/hooks/useAICoFounder';
import { useAIConversationList } from '@/hooks/useAIConversationList';
import { useAIAgents, useAISuggestions } from '@/hooks/useAIBench';
import { ChatMessage } from '@/components/ai/chat-message';
import { ConversationList } from '@/components/ai/conversation-list';
import { ModalDialog } from '@/components/modal-dialog';
import { COMPOSER_PLACEHOLDER, EMPTY_BODY, EMPTY_TITLE, STARTER_PROMPTS } from '@/lib/ai-copy';
import { TOPICS } from '@/lib/api/aiChat';

function ChatViewContent() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('c');
  const requestedAgent = searchParams.get('agent');

  const list = useAIConversationList();
  const { refresh: refreshList, archive } = list;
  const {
    activeConversationId: activeConvId,
    activeConversation,
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
  } = useAICoFounder({ onChanged: () => { void refreshList(); } });

  const { agents } = useAIAgents();
  const { items: suggestions } = useAISuggestions();

  const [chatInput, setChatInput] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Deep links: ?c=<id> opens that conversation; ?agent=<key> starts a new chat
  // pinned to that specialist ("Ask {agent}" on the bench). Each is applied once.
  const openedFromUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (requestedConversationId && openedFromUrlRef.current !== requestedConversationId) {
      openedFromUrlRef.current = requestedConversationId;
      queueMicrotask(() => { void selectConversation(requestedConversationId); });
    }
  }, [requestedConversationId, selectConversation]);

  const agentAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedConversationId && requestedAgent && agentAppliedRef.current !== requestedAgent) {
      agentAppliedRef.current = requestedAgent;
      queueMicrotask(() => startNewChat(requestedAgent));
    }
  }, [requestedConversationId, requestedAgent, startNewChat]);

  const agentName = (key: string | null | undefined) =>
    key ? agents.find((a) => a.key === key)?.name ?? null : null;
  const pinnedName = agentName(activeConversation?.pinned_agent_key ?? newChatAgent);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating || threadLoading || isArchived) return;
    setChatInput('');
    const accepted = await sendMessage(text);
    if (!accepted) setChatInput(text);
  };

  const newChat = () => {
    startNewChat();
    setChatInput('');
    setSheetOpen(false);
  };
  const pick = (id: string) => {
    setSheetOpen(false);
    void selectConversation(id);
  };

  const archiveActive = async () => {
    if (!activeConvId) return;
    if (await archive([activeConvId])) {
      toast.success('Conversation archived.');
      startNewChat();
    }
  };

  const lastIdx = messages.length - 1;
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.status === 'ready');
  const sources = lastAssistant?.sources ?? [];
  const agentsInChat = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of messages) if (m.agent?.key) seen.set(m.agent.key, m.agent.name);
    return [...seen.entries()];
  }, [messages]);
  const lastTurn = messages[lastIdx];
  const cancellable = isGenerating && !!lastTurn && !lastTurn.id.startsWith('local-');
  const topicLabel = TOPICS.find((t) => t.key === activeConversation?.topic)?.label;

  return (
    <div className="flex min-h-[28rem] h-[calc(100dvh-15rem)] md:h-[calc(100dvh-13.5rem)]">
      {/* Left panel: conversations (lg and up) */}
      <div className="w-[280px] shrink-0 bg-white hidden lg:flex flex-col pr-4">
        <ConversationList list={list} activeId={activeConvId} onSelect={pick} onNew={newChat} />
      </div>

      {/* Center: thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0 px-4 md:px-6 xl:px-10 lg:border-l border-line-soft">
        <div className="py-3 border-b border-line-soft flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink truncate">
              {activeConvId ? activeConversation?.title ?? 'Chat' : 'New chat'}
            </h2>
            <p className="text-xs text-ink-muted truncate">
              {pinnedName ? `Pinned to ${pinnedName}` : 'Co-Founder'}
              {topicLabel ? ` · ${topicLabel}` : ''}
              {isArchived ? ' · Archived' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeConvId && !isArchived && (
              <button
                type="button"
                onClick={archiveActive}
                aria-label="Archive conversation"
                className="flex items-center gap-1 text-xs font-semibold text-ink border border-line-soft px-3 py-1.5 rounded-card hover:bg-surface-faint cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Archive</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="lg:hidden flex items-center gap-1 text-xs font-semibold text-ink border border-line-soft px-3 py-1.5 rounded-card hover:bg-surface-faint cursor-pointer"
            >
              <MessagesSquare className="w-3.5 h-3.5" />
              Conversations
            </button>
          </div>
        </div>

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-6 space-y-6">
          {threadLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted" role="status">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading conversation...
            </div>
          )}

          {!threadLoading && messages.length === 0 && (
            <div className="flex flex-col h-full items-center justify-center text-center max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-accent-600 mb-4" />
              <h3 className="font-bold text-xl text-ink mb-2">{EMPTY_TITLE}</h3>
              <p className="text-sm text-ink-muted mb-8 leading-relaxed">{EMPTY_BODY}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {STARTER_PROMPTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSendMessage(s)}
                    className="text-xs font-medium text-ink bg-white border border-line-soft px-4 py-3 rounded-modal hover:border-neutral-xd0d0c8 hover:bg-surface-faint transition-all cursor-pointer text-left shadow-card"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isLatest={i === lastIdx}
              busy={isGenerating}
              handlers={{ onRegenerate: regenerate, onFeedback: setFeedback, onAction: runAction }}
            />
          ))}
        </div>

        <div className="pb-4 pt-2">
          {error && (
            <p role="alert" className="mb-2 text-xs font-medium text-danger-700">
              {error}
            </p>
          )}

          {isArchived ? (
            <div className="flex items-center justify-between gap-3 rounded-modal border border-line-soft bg-surface-faint px-4 py-3 text-xs text-ink-muted">
              <span>This conversation is archived. Unarchive it to continue.</span>
              <button
                type="button"
                onClick={() => { void unarchiveActive(); }}
                className="shrink-0 font-semibold text-brand-700 hover:underline cursor-pointer"
              >
                Unarchive
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(chatInput);
              }}
              className="flex items-center bg-neutral-xf9f9f8 border border-line-soft rounded-modal px-2 py-2 focus-within:ring-2 focus-within:ring-accent-600 focus-within:border-transparent transition-all"
            >
              <div className="flex flex-col w-full px-2 relative">
                <textarea
                  autoFocus
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(chatInput);
                    }
                  }}
                  placeholder={isGenerating ? 'Your co-founder is replying...' : COMPOSER_PLACEHOLDER}
                  aria-label="Message your AI co-founder"
                  className="w-full bg-transparent text-sm outline-none text-ink placeholder-ink-subtle py-2 resize-none h-[44px] max-h-[160px]"
                />
                <div className="flex items-center justify-end gap-2 mt-1">
                  {isGenerating && (
                    <button
                      type="button"
                      onClick={() => { void cancel(); }}
                      disabled={!cancellable}
                      className="flex items-center gap-1 font-semibold text-xs px-3 py-1.5 rounded-card border border-line-soft text-ink hover:bg-surface-faint disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isGenerating || threadLoading}
                    className={`font-semibold text-xs px-4 py-1.5 rounded-card shadow-card transition-colors flex items-center justify-center min-w-[64px] ${
                      chatInput.trim() && !isGenerating && !threadLoading
                        ? 'bg-accent-600 hover:bg-accent-700 text-white cursor-pointer'
                        : 'bg-line-soft text-ink-subtle cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right panel: context (xl and up) */}
      <div className="w-[320px] shrink-0 border-l border-line-soft bg-white hidden xl:flex flex-col pl-6">
        <div className="flex-1 overflow-y-auto pt-4 pb-6 space-y-8">
          <section aria-label="Suggested actions">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">Suggested actions</p>
            <div className="space-y-2">
              {suggestions.slice(0, 2).map((s) => (
                <Link
                  key={s.id}
                  href="/ai/suggestions"
                  className="block p-3 bg-surface-faint rounded-modal border border-line-soft hover:border-neutral-xd0d0c8 transition-colors"
                >
                  <p className="text-xs font-semibold text-ink">{s.title}</p>
                </Link>
              ))}
              {suggestions.length === 0 ? (
                <p className="text-xs text-ink-subtle italic">No active suggestions.</p>
              ) : (
                <Link href="/ai/suggestions" className="text-xs font-semibold text-brand-700 hover:underline">
                  See all
                </Link>
              )}
            </div>
          </section>

          <section aria-label="Sources I used">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">Sources I used</p>
            {sources.length === 0 ? (
              <p className="text-xs text-ink-subtle italic">Nothing yet. Sources appear after a reply.</p>
            ) : (
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li key={s.key} className="text-xs text-ink-muted">{s.label}</li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Agents in this chat">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">Agents in this chat</p>
            {agentsInChat.length === 0 ? (
              <p className="text-xs text-ink-subtle italic">I&apos;ll bring in the right specialist.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {agentsInChat.map(([key, name]) => (
                  <li key={key} className="rounded-full border border-line-soft bg-surface-faint px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">About this chat</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Your co-founder answers using your workspace context. Conversations are private to you,
              even from your teammates.
            </p>
          </div>
        </div>
      </div>

      {/* Conversations sheet (below lg) */}
      {sheetOpen && (
        <ModalDialog
          label="Conversations"
          onClose={() => setSheetOpen(false)}
          overlayClassName="fixed inset-0 z-[60] bg-black/40 flex justify-start"
          className="h-full w-[88%] max-w-sm bg-white p-4 flex flex-col outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-ink">Conversations</h3>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Close conversations"
              className="p-1.5 rounded-card text-neutral-400 hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ConversationList list={list} activeId={activeConvId} onSelect={pick} onNew={newChat} />
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

export default function ChatViewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-ink-muted">Loading AI co-founder...</div>}>
      <ChatViewContent />
    </Suspense>
  );
}
