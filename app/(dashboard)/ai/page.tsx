'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Search, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAICoFounder, useAISuggestions } from '../../../hooks/useAICoFounder';
import { ChatMessageContent } from '@/components/ai/chat-message-content';

const STARTER_PROMPTS = [
  'What should I focus on this week?',
  'Poke holes in my business model',
  'What is my biggest risk right now?',
  'Help me prepare for my next investor conversation',
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ChatViewContent() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('c');

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    refreshConversations,
    activeConversationId: activeConvId,
    messages,
    threadLoading,
    isGenerating,
    error,
    selectConversation,
    startNewChat,
    sendMessage,
  } = useAICoFounder({ withList: true });

  const [searchQuery, setSearchQuery] = useState('');
  const { suggestions } = useAISuggestions();

  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Deep link (?c=<id>), e.g. from the history page: open that conversation once.
  const openedFromUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (requestedConversationId && openedFromUrlRef.current !== requestedConversationId) {
      openedFromUrlRef.current = requestedConversationId;
      queueMicrotask(() => { void selectConversation(requestedConversationId); });
    }
  }, [requestedConversationId, selectConversation]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating || threadLoading) return;
    setChatInput('');
    const accepted = await sendMessage(text);
    // Not accepted (e.g. a network error): put the draft back so nothing is lost.
    if (!accepted) setChatInput(text);
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title ?? 'New conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeTitle = conversations.find((c) => c.id === activeConvId)?.title ?? 'Chat';

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-140px)]">
      
      {/* Left Panel: Conversation List (280px) */}
      <div className="w-[280px] shrink-0 bg-white flex flex-col hidden lg:flex">
        <div className="pr-4 pb-4 space-y-4">
          <button
            onClick={() => {
              startNewChat();
              setChatInput('');
            }}
            className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm py-2.5 rounded-card transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="w-full bg-transparent text-xs text-ink placeholder-ink-subtle pl-8 pr-3 py-1.5 focus:outline-none"
            />
          </div>

        </div>
        
        <div className="flex-1 overflow-y-auto pr-4 mt-2">
          {conversationsLoading ? (
            <p className="text-xs text-center text-ink-subtle py-4" role="status">Loading conversations...</p>
          ) : conversationsError ? (
            <div className="text-xs text-center text-ink-muted py-4 space-y-2">
              <p>Couldn&apos;t load your conversations.</p>
              <button
                type="button"
                onClick={() => { void refreshConversations(); }}
                className="font-semibold text-brand-700 hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-center text-ink-subtle py-4">
              {conversations.length === 0 ? 'No conversations yet.' : 'No conversations found.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { void selectConversation(conv.id); }}
                  className={`w-full text-left p-3 rounded-modal transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    activeConvId === conv.id ? 'bg-surface-faint' : 'hover:bg-surface-faint'
                  }`}
                >
                  <h4 className="text-xs font-bold text-ink truncate">{conv.title ?? 'New conversation'}</h4>
                  <span className="text-[10px] text-ink-subtle shrink-0">{formatShortDate(conv.updated_at)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel: Chat Thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0 px-6 xl:px-10 border-l border-line-soft">
        {/* Header (Only show if active conversation exists) */}
        {activeConvId ? (
          <div className="py-4 border-b border-line-soft flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink truncate">{activeTitle}</h2>
              <p className="text-xs text-ink-muted">Co-Founder</p>
            </div>
            <button
              type="button"
              onClick={() => { startNewChat(); setChatInput(''); }}
              className="lg:hidden shrink-0 text-xs font-semibold text-ink border border-line-soft px-3 py-1.5 rounded-card hover:bg-surface-faint transition-colors cursor-pointer"
            >
              New chat
            </button>
          </div>
        ) : (
          <div className="py-4 border-b border-line-soft invisible">
            {/* Spacer to keep layout identical when empty */}
            <h2 className="text-base">Spacer</h2>
          </div>
        )}

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-6 space-y-8">
          {threadLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted" role="status">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading conversation...
            </div>
          )}

          {!threadLoading && messages.length === 0 && (
            <div className="flex flex-col h-full items-center justify-center text-center max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-accent-600 mb-4" />
              <h3 className="font-bold text-xl text-ink mb-2">Ask your AI Co-Founder anything.</h3>
              <p className="text-sm text-ink-muted mb-8 leading-relaxed">
                Replies use what it knows about your workspace. Your conversations are private to you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {STARTER_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs font-medium text-ink bg-white border border-line-soft px-4 py-3 rounded-modal hover:border-neutral-xd0d0c8 hover:bg-surface-faint transition-all cursor-pointer text-left shadow-card"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start gap-1'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-input flex items-center justify-center shrink-0 bg-accent-600">
                    <Sparkles className="w-3.5 h-3.5 fill-brand-x1f4d3a text-brand-x1f4d3a" />
                  </div>
                  <span className="text-xs font-bold text-ink">Co-Founder</span>
                </div>
              )}

              <div className={`text-sm px-5 py-4 rounded-[24px] shadow-card max-w-[85%] lg:max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-brand-x1f4d3a text-white rounded-tr-sm'
                  : 'bg-white border border-line-soft text-ink rounded-tl-sm'
              }`}>
                <ChatMessageContent message={msg} />
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="pb-6 pt-2 relative">
          {error && (
            <p role="alert" className="mb-2 text-xs font-medium text-danger-700">
              {error}
            </p>
          )}

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
                placeholder={isGenerating ? 'Your co-founder is replying...' : 'Ask anything, strategy, money, legal, marketing...'}
                aria-label="Message your AI co-founder"
                className="w-full bg-transparent text-sm outline-none text-ink placeholder-ink-subtle py-2 resize-none h-[40px] max-h-[160px]"
              />
              <div className="flex items-center justify-end mt-1">
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
        </div>
      </div>

      {/* Right Panel: Context Sidebar (320px) */}
      <div className="w-[320px] shrink-0 border-l border-line-soft bg-white hidden xl:flex flex-col pl-6">
        <div className="flex-1 overflow-y-auto pt-4 pb-6 space-y-8">
          
          <details className="group" open>
            <summary className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3 cursor-pointer list-none flex items-center justify-between">
              Suggested Actions
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="space-y-2">
              {suggestions.slice(0,2).map(sugg => (
                <div key={sugg.id} className="p-3 bg-surface-faint rounded-modal border border-line-soft cursor-pointer hover:border-neutral-xd0d0c8 transition-colors">
                  <p className="text-xs font-semibold text-ink">{sugg.suggestion}</p>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-xs text-ink-subtle italic">No active suggestions.</p>
              )}
            </div>
          </details>
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">About this chat</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Your co-founder answers using your workspace context. Conversations are private to you,
              even from your teammates.
            </p>
          </div>

        </div>
      </div>
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