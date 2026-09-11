'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowUp, Loader2, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAiDrawer } from './ai-drawer-context';
import { useAICoFounder } from '../hooks/useAICoFounder';
import type { AgentKey } from '../types/ai';

const agentRoleName = (agentKey?: string) => {
  if (!agentKey || agentKey === 'cofounder') return 'Co-Founder';
  const roles: Record<string, string> = {
    finance: 'Finance Advisor',
    sales: 'Sales Coach',
    marketing: 'Marketing Advisor',
    legal: 'Legal Advisor',
    team: 'Team Mentor',
    product: 'Product Manager',
    funding: 'Fundraising Copilot',
    operations: 'Operations Advisor',
    compliance: 'Compliance Officer',
    analytics: 'Data Analyst'
  };
  return roles[agentKey] || 'Advisor';
};

function DrawerReasoningBlock({ reasoningSummary }: { reasoningSummary: string }) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  return (
    <div className="mt-3 pt-3 border-t border-sage-100">
      <button
        type="button"
        onClick={() => setIsReasoningOpen((prev) => !prev)}
        className="flex items-center text-xs font-semibold text-sage-500 hover:text-sage-700 cursor-pointer"
      >
        <span className={`w-3 h-3 transition-transform text-[10px] mr-1 ${isReasoningOpen ? 'rotate-90' : ''}`}>▶</span>
        Why I said this
      </button>
      {isReasoningOpen && (
        <p className="text-xs text-sage-600 mt-2 pl-4 italic border-l-2 border-sage-200">
          {reasoningSummary}
        </p>
      )}
    </div>
  );
}

export function AiDrawer() {
  const pathname = usePathname();
  const isAiPage = pathname?.startsWith('/ai') ?? false;
  
  const { isAiDrawerOpen, closeAiDrawer, openAiDrawer } = useAiDrawer();
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isStreaming, 
    sendMessage, 
    stopGenerating,
    executeAction 
  } = useAICoFounder();

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    
    setChatInput('');
    await sendMessage(text);
  };

  const handleAction = async (msgId: string, actionKey: string) => {
    await executeAction(msgId, actionKey);
  };

  // Global keyboard shortcut Cmd+J / Ctrl+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
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
  }, [isAiDrawerOpen, closeAiDrawer, openAiDrawer]);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isAiPage && (
        <button
          onClick={isAiDrawerOpen ? closeAiDrawer : openAiDrawer}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1F4D3A] text-white rounded-full shadow-card flex items-center justify-center hover:bg-[#15382A] transition-colors group cursor-pointer"
          aria-label="Toggle AI Co-Founder"
        >
          <Sparkles className="w-6 h-6 fill-[#A8894B] text-[#A8894B] group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Drawer Overlay & Panel */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            onClick={closeAiDrawer}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md h-full bg-[#FAFAFA] shadow-2xl flex flex-col transform transition-transform border-l border-sage-200">
            {/* Header */}
            <div className="p-4 border-b border-sage-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-card bg-[#1F4D3A] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 fill-[#A8894B] text-[#A8894B]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E2923]">AI Co-Founder</h3>
                  <Link 
                    href="/ai" 
                    onClick={closeAiDrawer}
                    className="text-xs font-semibold text-[#1E4D3B] hover:underline"
                  >
                    Open full view →
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeAiDrawer}
                  className="p-1.5 rounded-card text-sage-400 hover:text-[#1F4D3A] hover:bg-sage-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-[#FAFAFA]" ref={chatScrollRef}>
              <div className="p-4 space-y-6">
                
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-4">
                    <Sparkles className="w-8 h-8 text-[#9C5B34]" />
                    <p className="text-sm font-medium text-sage-700">
                      Press <kbd className="px-1.5 py-0.5 bg-white border border-sage-200 rounded text-xs mx-1">⌘J</kbd> anytime to chat.
                    </p>
                    <div className="grid gap-2 w-full mt-4">
                      {['What should I focus on this week?', 'How long is my runway?'].map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(suggestion)}
                          className="text-xs font-medium text-[#1C201D] bg-white border border-sage-200 px-3 py-2.5 rounded-card hover:border-[#1F4D3A] transition-colors cursor-pointer shadow-sm text-left"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {msg.role === 'assistant' && msg.agentKey && (
                      <div className="text-[11px] font-semibold text-sage-500 mb-1 ml-9">
                        {agentRoleName(msg.agentKey)}
                        {msg.agentKey && msg.agentKey !== 'cofounder' && <span className="font-normal text-[#8E9B90]"> via Co-Founder</span>}
                      </div>
                    )}
                    
                    <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} w-full`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-md bg-[#1F4D3A] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 fill-[#A8894B] text-[#A8894B]" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] p-3.5 text-sm leading-relaxed rounded-2xl shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-[#1F4D3A] text-white rounded-tr-sm'
                            : 'bg-white border border-sage-100 text-[#1C201D] rounded-tl-sm'
                        }`}
                      >
                        {msg.content ? (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 h-5">
                            <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce" />
                          </div>
                        )}

                        {msg.reasoningSummary && (
                          <DrawerReasoningBlock reasoningSummary={msg.reasoningSummary} />
                        )}
                        
                        {msg.actionChips && msg.actionChips.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-2">
                            {msg.actionChips.map(chip => (
                              <div key={chip.id} className="relative">
                                {(chip as any).executed ? (
                                  <div className="flex items-center gap-2 text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                                    <Check className="w-3.5 h-3.5" />
                                    Done. I created {(chip as any).artifactTitle || 'it'}.
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAction(msg.id, chip.action)}
                                    className="text-xs font-semibold text-[#1F4D3A] bg-sage-50 border border-sage-200 px-3 py-1.5 rounded-full hover:bg-[#1F4D3A] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    {chip.label}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-white border-t border-sage-100 relative shrink-0">
              {isStreaming && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <button
                    onClick={stopGenerating}
                    className="flex items-center gap-2 bg-white border border-sage-200 shadow-raised text-xs font-semibold text-sage-700 px-4 py-2 rounded-full hover:bg-sage-50 transition-colors cursor-pointer"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-sm" />
                    Stop generating
                  </button>
                </div>
              )}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(chatInput);
                }}
                className="relative flex flex-col bg-[#F9F9F8] border border-[#EBEBE6] rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-[#A8894B] focus-within:border-transparent transition-all"
              >
                {chatInput.startsWith('/') && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-[#EBEBE6] rounded-xl shadow-card overflow-hidden">
                    <p className="px-3 py-2 text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider bg-[#FBFBFA] border-b border-[#EBEBE6]">Slash Commands</p>
                    {['/draft', '/analyze', '/plan', '/agents'].map(cmd => (
                      <button 
                        key={cmd}
                        type="button"
                        onClick={() => setChatInput(cmd + ' ')}
                        className="w-full text-left px-3 py-2 text-xs text-[#1E2923] font-semibold hover:bg-[#FBFBFA] cursor-pointer"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                )}
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
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-sm outline-none text-[#1E2923] placeholder-[#8E9B90] py-2 resize-none h-[40px] max-h-[120px]"
                />
                <div className="flex items-center justify-end mt-1">
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isStreaming}
                    className={`font-semibold text-xs px-4 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center min-w-[64px] ${
                      chatInput.trim() && !isStreaming
                        ? 'bg-[#A8894B] hover:bg-[#967941] text-[#12291F] cursor-pointer'
                        : 'bg-[#EBEBE6] text-[#8E9B90] cursor-not-allowed'
                    }`}
                  >
                    {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
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
