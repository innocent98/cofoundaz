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
            className="w-full flex items-center justify-center gap-2 bg-copper-600 hover:bg-copper-700 text-white font-semibold text-sm py-2.5 rounded-card transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9B90]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="w-full bg-transparent text-xs text-[#1E2923] placeholder-[#8E9B90] pl-8 pr-3 py-1.5 focus:outline-none"
            />
          </div>

        </div>
        
        <div className="flex-1 overflow-y-auto pr-4 mt-2">
          {conversationsLoading ? (
            <p className="text-xs text-center text-[#8E9B90] py-4" role="status">Loading conversations...</p>
          ) : conversationsError ? (
            <div className="text-xs text-center text-[#617065] py-4 space-y-2">
              <p>Couldn&apos;t load your conversations.</p>
              <button
                type="button"
                onClick={() => { void refreshConversations(); }}
                className="font-semibold text-[#1E4D3B] hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-center text-[#8E9B90] py-4">
              {conversations.length === 0 ? 'No conversations yet.' : 'No conversations found.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { void selectConversation(conv.id); }}
                  className={`w-full text-left p-3 rounded-modal transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    activeConvId === conv.id ? 'bg-[#FBFBFA]' : 'hover:bg-[#FBFBFA]'
                  }`}
                >
                  <h4 className="text-xs font-bold text-[#1E2923] truncate">{conv.title ?? 'New conversation'}</h4>
                  <span className="text-[10px] text-[#8E9B90] shrink-0">{formatShortDate(conv.updated_at)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel: Chat Thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0 px-6 xl:px-10 border-l border-[#EBEBE6]">
        {/* Header (Only show if active conversation exists) */}
        {activeConvId ? (
          <div className="py-4 border-b border-[#EBEBE6] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E2923] truncate">{activeTitle}</h2>
              <p className="text-xs text-[#617065]">Co-Founder</p>
            </div>
            <button
              type="button"
              onClick={() => { startNewChat(); setChatInput(''); }}
              className="lg:hidden shrink-0 text-xs font-semibold text-[#1E2923] border border-[#EBEBE6] px-3 py-1.5 rounded-card hover:bg-[#FBFBFA] transition-colors cursor-pointer"
            >
              New chat
            </button>
          </div>
        ) : (
          <div className="py-4 border-b border-[#EBEBE6] invisible">
            {/* Spacer to keep layout identical when empty */}
            <h2 className="text-base">Spacer</h2>
          </div>
        )}

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-6 space-y-8">
          {threadLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#617065]" role="status">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading conversation...
            </div>
          )}

          {!threadLoading && messages.length === 0 && (
            <div className="flex flex-col h-full items-center justify-center text-center max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-copper-600 mb-4" />
              <h3 className="font-bold text-xl text-[#1E2923] mb-2">Ask your AI Co-Founder anything.</h3>
              <p className="text-sm text-[#617065] mb-8 leading-relaxed">
                Replies use what it knows about your workspace. Your conversations are private to you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {STARTER_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs font-medium text-[#1E2923] bg-white border border-[#EBEBE6] px-4 py-3 rounded-modal hover:border-[#D0D0C8] hover:bg-[#FBFBFA] transition-all cursor-pointer text-left shadow-card"
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
                  <div className="w-6 h-6 rounded-input flex items-center justify-center shrink-0 bg-copper-600">
                    <Sparkles className="w-3.5 h-3.5 fill-[#1F4D3A] text-[#1F4D3A]" />
                  </div>
                  <span className="text-xs font-bold text-[#1E2923]">Co-Founder</span>
                </div>
              )}

              <div className={`text-sm px-5 py-4 rounded-[24px] shadow-card max-w-[85%] lg:max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-[#1F4D3A] text-white rounded-tr-sm'
                  : 'bg-white border border-[#EBEBE6] text-[#1E2923] rounded-tl-sm'
              }`}>
                <ChatMessageContent message={msg} />
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="pb-6 pt-2 relative">
          {error && (
            <p role="alert" className="mb-2 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(chatInput);
            }}
            className="flex items-center bg-[#F9F9F8] border border-[#EBEBE6] rounded-modal px-2 py-2 focus-within:ring-2 focus-within:ring-copper-600 focus-within:border-transparent transition-all"
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
                className="w-full bg-transparent text-sm outline-none text-[#1E2923] placeholder-[#8E9B90] py-2 resize-none h-[40px] max-h-[160px]"
              />
              <div className="flex items-center justify-end mt-1">
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isGenerating || threadLoading}
                  className={`font-semibold text-xs px-4 py-1.5 rounded-card shadow-card transition-colors flex items-center justify-center min-w-[64px] ${
                    chatInput.trim() && !isGenerating && !threadLoading
                      ? 'bg-copper-600 hover:bg-copper-700 text-white cursor-pointer'
                      : 'bg-[#EBEBE6] text-[#8E9B90] cursor-not-allowed'
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
      <div className="w-[320px] shrink-0 border-l border-[#EBEBE6] bg-white hidden xl:flex flex-col pl-6">
        <div className="flex-1 overflow-y-auto pt-4 pb-6 space-y-8">
          
          <details className="group" open>
            <summary className="text-[10px] font-bold uppercase tracking-wider text-[#8E9B90] mb-3 cursor-pointer list-none flex items-center justify-between">
              Suggested Actions
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="space-y-2">
              {suggestions.slice(0,2).map(sugg => (
                <div key={sugg.id} className="p-3 bg-[#FBFBFA] rounded-modal border border-[#EBEBE6] cursor-pointer hover:border-[#D0D0C8] transition-colors">
                  <p className="text-xs font-semibold text-[#1E2923]">{sugg.suggestion}</p>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-xs text-[#8E9B90] italic">No active suggestions.</p>
              )}
            </div>
          </details>
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E9B90] mb-3">About this chat</p>
            <p className="text-xs text-[#617065] leading-relaxed">
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-[#617065]">Loading AI co-founder...</div>}>
      <ChatViewContent />
    </Suspense>
  );
}