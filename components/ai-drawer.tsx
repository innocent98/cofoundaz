'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles, Loader2, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAiDrawer } from './ai-drawer-context';
import { useWorkspace } from './workspace-context';
import { canSee } from '@/lib/nav-access';
import { useAICoFounder } from '../hooks/useAICoFounder';
import { AiStatusBanner } from './ai/ai-status-banner';
import { ChatMessageContent } from './ai/chat-message-content';

const STARTER_PROMPTS = [
  'What should I focus on this week?',
  'Poke holes in my business model',
];

export function AiDrawer() {
  const pathname = usePathname();
  const isAiPage = pathname?.startsWith('/ai') ?? false;
  
  const { isAiDrawerOpen, closeAiDrawer, openAiDrawer, seed, clearSeed } = useAiDrawer();
  // The AI Co-Founder is for founders and team members; other roles get no dock (hidden, not disabled).
  const { role } = useWorkspace();
  const aiAllowed = canSee('/ai', role);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isGenerating,
    threadLoading,
    error,
    sendMessage,
    startNewChat,
  } = useAICoFounder();

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating || threadLoading) return;
    setChatInput('');
    const accepted = await sendMessage(text);
    // Not accepted (e.g. a network error): put the draft back so nothing is lost.
    if (!accepted) setChatInput(text);
  };

  // A seeded open ("Tell me more" on the briefing) starts a fresh conversation and
  // sends the seed as its first message. startNewChat resets state on the next
  // render, so the send waits until the thread is empty.
  const [pendingSeed, setPendingSeed] = useState<string | null>(null);
  useEffect(() => {
    if (!seed) return;
    queueMicrotask(() => {
      startNewChat();
      setPendingSeed(seed.text);
      clearSeed();
    });
  }, [seed, startNewChat, clearSeed]);

  useEffect(() => {
    if (!pendingSeed || messages.length > 0 || threadLoading || isGenerating) return;
    queueMicrotask(() => {
      setPendingSeed(null);
      void sendMessage(pendingSeed);
    });
  }, [pendingSeed, messages.length, threadLoading, isGenerating, sendMessage]);

  // Global keyboard shortcuts: Cmd+J / Ctrl+J toggles the drawer, Escape closes it.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (aiAllowed && isAiDrawerOpen && e.key === 'Escape' && !e.defaultPrevented) {
        closeAiDrawer();
        return;
      }
      if (aiAllowed && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (isAiDrawerOpen) {
          closeAiDrawer();
        } else {
          openAiDrawer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aiAllowed, isAiDrawerOpen, closeAiDrawer, openAiDrawer]);

  if (!aiAllowed) return null;

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isAiPage && (
        <button
          type="button"
          onClick={() => (isAiDrawerOpen ? closeAiDrawer() : openAiDrawer())}
          className="fixed hidden md:flex md:bottom-6 md:right-6 z-50 w-14 h-14 bg-brand-x1f4d3a text-white rounded-full shadow-card items-center justify-center hover:bg-brand-x15382a transition-colors group cursor-pointer"
          aria-label="Ask your AI Co-Founder"
          aria-keyshortcuts="Meta+J Control+J"
        >
          <Sparkles className="w-6 h-6 fill-accent-600 text-accent-600 group-hover:scale-110 transition-transform" />
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-input bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-raised transition-opacity md:flex md:items-center md:gap-2 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            Ask your AI Co-Founder
            <kbd className="rounded-input border border-brand-x2e5a45 px-1.5 py-0.5 text-[10px] text-neutral-200">⌘J</kbd>
          </span>
        </button>
      )}

      {/* Drawer Overlay & Panel */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            onClick={closeAiDrawer}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md h-full bg-surface-ghost shadow-raised flex flex-col transform transition-transform border-l border-neutral-200">
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-card bg-brand-x1f4d3a text-white flex items-center justify-center shadow-card">
                  <Sparkles className="w-4 h-4 fill-accent-600 text-accent-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">AI Co-Founder</h3>
                  <Link 
                    href="/ai" 
                    onClick={closeAiDrawer}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Open full view →
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-card text-xs font-semibold text-neutral-600 hover:text-brand-x1f4d3a hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New chat
                  </button>
                )}
                <button
                  onClick={closeAiDrawer}
                  aria-label="Close AI Co-Founder"
                  className="p-1.5 rounded-card text-neutral-400 hover:text-brand-x1f4d3a hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Over-budget subtle banner */}
            <div className="px-4 pt-3 pb-1 bg-white">
              <AiStatusBanner />
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-surface-ghost" ref={chatScrollRef}>
              <div className="p-4 space-y-6">
                
                {threadLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-neutral-500" role="status">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading conversation...
                  </div>
                )}

                {!threadLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-3">
                    <Sparkles className="w-8 h-8 text-accent-600" />
                    <p className="text-sm font-medium text-neutral-700">
                      Ask your AI co-founder anything.
                    </p>
                    <p className="text-xs text-neutral-500 max-w-[16rem]">
                      Replies use what it knows about your workspace. Your conversations are private to you.
                    </p>
                    <div className="flex flex-col gap-2 w-full pt-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="text-xs font-medium text-ink bg-white border border-neutral-200 px-3 py-2.5 rounded-card hover:border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer text-left shadow-card"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="text-[11px] font-semibold text-neutral-500 mb-1 ml-9">Co-Founder</div>
                    )}
                    <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} w-full`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-input bg-brand-x1f4d3a text-white flex items-center justify-center shrink-0 mt-0.5 shadow-card">
                          <Sparkles className="w-3.5 h-3.5 fill-accent-600 text-accent-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] p-3.5 text-sm rounded-card shadow-card ${
                          msg.role === 'user'
                            ? 'bg-brand-x1f4d3a text-white rounded-tr-sm'
                            : 'bg-white border border-neutral-100 text-neutral-x1c201d rounded-tl-sm'
                        }`}
                      >
                        <ChatMessageContent message={msg} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-white border-t border-neutral-100 relative shrink-0">
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
                className="relative flex flex-col bg-neutral-xf9f9f8 border border-line-soft rounded-card px-2 py-2 focus-within:ring-2 focus-within:ring-accent-600 focus-within:border-transparent transition-all"
              >
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
                  placeholder={isGenerating ? 'Your co-founder is replying...' : 'Ask anything...'}
                  aria-label="Message your AI co-founder"
                  className="w-full bg-transparent text-sm outline-none text-ink placeholder-ink-subtle py-2 resize-none h-[40px] max-h-[120px]"
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
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
