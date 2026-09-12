'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Sparkles, ArrowUp, Loader2, 
  Check, Hash, Database
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAICoFounder, useAISuggestions } from '../../../hooks/useAICoFounder';
import type { AIMessage, AgentKey } from '../../../types/ai';

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

function ReasoningBlock({ reasoningSummary }: { reasoningSummary: string }) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsReasoningOpen((prev) => !prev)}
        className="flex items-center text-xs font-bold text-[#617065] hover:text-[#1E2923] cursor-pointer"
      >
        <span className={`w-3 h-3 transition-transform text-[10px] mr-1 ${isReasoningOpen ? 'rotate-90' : ''}`}>▶</span>
        Why I said this
      </button>
      {isReasoningOpen && (
        <p className="text-xs text-[#617065] mt-2 pl-4 italic border-l-2 border-[#EBEBE6]">
          {reasoningSummary}
        </p>
      )}
    </div>
  );
}

function ChatViewContent() {
  const searchParams = useSearchParams();
  const agentParam = searchParams.get('agent') as AgentKey | null;

  const { 
    conversations, 
    activeConversationId: activeConvId,
    messages, 
    isStreaming, 
    selectConversation, 
    startNewChat, 
    sendMessage, 
    stopGenerating,
    executeAction
  } = useAICoFounder();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { suggestions } = useAISuggestions();

  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Track action chip states: { [messageId_actionKey]: { executed: boolean, timer: number } }
  const [actionStates, setActionStates] = useState<Record<string, { executed: boolean; timer: number }>>({});

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Handle agent query parameter
  useEffect(() => {
    if (agentParam && !activeConvId && messages.length === 0) {
      queueMicrotask(() => { setChatInput(`/${agentParam} `); });
    }
  }, [agentParam, activeConvId, messages.length]);

  // Handle countdown timers for undo
  useEffect(() => {
    const interval = setInterval(() => {
      setActionStates(prev => {
        let changed = false;
        const next = { ...prev };
        for (const key in next) {
          if (next[key].executed && next[key].timer > 0) {
            next[key] = { ...next[key], timer: next[key].timer - 1 };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setChatInput('');
    await sendMessage(text, agentParam || undefined);
  };

  const handleAction = async (msgId: string, actionKey: string, artifactTitle: string) => {
    const key = `${msgId}_${actionKey}`;
    setActionStates(prev => ({ ...prev, [key]: { executed: true, timer: 10 } }));
    await executeAction(msgId, actionKey);
  };

  const handleUndoAction = (msgId: string, actionKey: string) => {
    const key = `${msgId}_${actionKey}`;
    setActionStates(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // In a real implementation, you'd call a backend route to revert the action
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic ? c.topic === selectedTopic : true;
    return matchesSearch && matchesTopic;
  });

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
            className="w-full flex items-center justify-center gap-2 bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-semibold text-sm py-2.5 rounded-card transition-colors cursor-pointer"
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

          <div className="flex flex-wrap gap-2">
            {['All', 'Strategy', 'Finance', 'Legal', 'Growth', 'Fundraising'].map(t => {
              const isActive = t === 'All' ? selectedTopic === null : selectedTopic === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t === 'All' ? null : t)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-full border transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-[#12291F] border-[#12291F] text-white' 
                      : 'bg-white border-[#EBEBE6] text-[#617065] hover:border-[#D0D0C8]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-4 mt-2">
          {filteredConversations.length === 0 ? (
            <p className="text-xs text-center text-[#8E9B90] py-4">No conversations found.</p>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map(conv => (
                <button 
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-modal transition-colors cursor-pointer flex flex-col gap-1.5 ${
                    activeConvId === conv.id ? 'bg-[#FBFBFA]' : 'hover:bg-[#FBFBFA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1E2923] truncate pr-2">{conv.title}</h4>
                    <span className="text-[10px] text-[#8E9B90] shrink-0">
                      {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#617065]">
                    <span className="bg-[#E3EFE9] text-[#1E4D3B] px-1.5 py-0.5 rounded font-semibold">{conv.topic || 'General'}</span>
                    <span className="truncate">{conv.agentsInvolved.join(', ')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel: Chat Thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0 px-6 xl:px-10 border-l border-[#EBEBE6]">
        {/* Header (Only show if active conversation exists) */}
        {activeConvId && (
          <div className="flex items-center justify-between py-4 border-b border-[#EBEBE6]">
            <div>
              <h2 className="text-base font-bold text-[#1E2923]">
                {conversations.find(c => c.id === activeConvId)?.title || 'Chat'}
              </h2>
              <p className="text-xs text-[#617065]">
                {conversations.find(c => c.id === activeConvId)?.agentsInvolved.join(' · ') || 'Co-Founder'}
              </p>
            </div>
            <button className="text-xs font-semibold text-[#1E2923] border border-[#EBEBE6] px-3 py-1.5 rounded-card hover:bg-[#FBFBFA] transition-colors cursor-pointer">
              Open full view
            </button>
          </div>
        )}
        {!activeConvId && (
          <div className="py-4 border-b border-[#EBEBE6] invisible">
             {/* Spacer to keep layout identical when empty */}
            <h2 className="text-base">Spacer</h2>
          </div>
        )}

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-6 space-y-8">
          
          {messages.length === 0 && (
            <div className="flex flex-col h-full items-center justify-center text-center max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-[#A8894B] mb-4" />
              <h3 className="font-bold text-xl text-[#1E2923] mb-2">Meet your AI Co-Founder.</h3>
              <p className="text-sm text-[#617065] mb-8 leading-relaxed">
                I know your startup — your stage, your numbers, your plan. Ask me anything, and I&apos;ll bring in the right specialist.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {[
                  'What should I focus on this week?',
                  'Poke holes in my business model',
                  'How long is my runway?',
                  'Draft an NDA for a contractor',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
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
                  <div className={`w-6 h-6 rounded-input flex items-center justify-center shrink-0 ${msg.agentKey === 'cofounder' ? 'bg-[#A8894B]' : 'bg-[#1F4D3A]'}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${msg.agentKey === 'cofounder' ? 'fill-[#1F4D3A] text-[#1F4D3A]' : 'fill-[#A8894B] text-[#A8894B]'}`} />
                  </div>
                  <span className="text-xs font-bold text-[#1E2923]">
                    {agentRoleName(msg.agentKey)}
                    {msg.agentKey && msg.agentKey !== 'cofounder' && <span className="font-normal text-[#8E9B90]"> via Co-Founder</span>}
                  </span>
                </div>
              )}

              <div className={`text-sm px-5 py-4 rounded-[24px] shadow-card max-w-[85%] lg:max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-[#1F4D3A] text-white rounded-tr-sm'
                  : 'bg-white border border-[#EBEBE6] text-[#1E2923] rounded-tl-sm'
              }`}>
                {msg.content ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1.5 h-1.5 bg-[#8E9B90] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#8E9B90] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#8E9B90] rounded-full animate-bounce" />
                  </div>
                )}
                
                {msg.role === 'assistant' && msg.reasoningSummary && (
                  <ReasoningBlock reasoningSummary={msg.reasoningSummary} />
                )}

                {msg.role === 'assistant' && msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#EBEBE6]">
                    {msg.actionChips.map(chip => {
                      const stateKey = `${msg.id}_${chip.action}`;
                      const actionState = actionStates[stateKey];
                      const isExecuted = actionState?.executed;

                      if (isExecuted) {
                        return (
                          <div key={chip.id} className="w-full flex flex-col md:flex-row md:items-center justify-between text-xs font-semibold bg-[#EBF5F0] text-[#12291F] px-4 py-3 rounded-card gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[#1F4D3A] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </div>
                              <span className="truncate">Done. I created: {chip.artifactTitle || chip.label}.</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <button className="text-[#1F4D3A] hover:underline cursor-pointer">Open it</button>
                              {actionState.timer > 0 && (
                                <button onClick={() => handleUndoAction(msg.id, chip.action)} className="text-[#617065] hover:text-[#1E2923] underline cursor-pointer">
                                  Undo ({actionState.timer}s)
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={chip.id}
                          onClick={() => handleAction(msg.id, chip.action, chip.artifactTitle || chip.label)}
                          className="text-xs font-semibold text-[#1F4D3A] bg-white border border-[#EBEBE6] px-3 py-1.5 rounded-card hover:border-[#D0D0C8] transition-colors cursor-pointer text-left"
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          
        </div>

        {/* Chat Input Bar */}
        <div className="pb-6 pt-2 relative">
          {isStreaming && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <button
                onClick={stopGenerating}
                className="flex items-center gap-2 bg-white border border-[#EBEBE6] shadow-card text-xs font-semibold text-[#1E2923] px-4 py-1.5 rounded-full hover:bg-[#FBFBFA] transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 bg-red-600 rounded-[2px]" />
                Stop generating
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(chatInput);
            }}
            className="flex items-center bg-[#F9F9F8] border border-[#EBEBE6] rounded-modal px-2 py-2 focus-within:ring-2 focus-within:ring-[#A8894B] focus-within:border-transparent transition-all"
          >
            <div className="flex flex-col w-full px-2 relative">
              {chatInput.startsWith('/') && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-[#EBEBE6] rounded-modal shadow-card overflow-hidden">
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
                placeholder="Ask anything, strategy, money, legal, marketing..."
                className="w-full bg-transparent text-sm outline-none text-[#1E2923] placeholder-[#8E9B90] py-2 resize-none h-[40px] max-h-[160px]"
              />
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-[11px] text-[#8E9B90]">
                  <button type="button" className="w-6 h-6 rounded-input bg-white border border-[#EBEBE6] flex items-center justify-center hover:bg-sage-50 transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span>Try <span className="font-semibold text-[#1E2923]">/draft</span> · <span className="font-semibold text-[#1E2923]">/analyze</span> · <span className="font-semibold text-[#1E2923]">/plan</span></span>
                </div>
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isStreaming}
                  className={`font-semibold text-xs px-4 py-1.5 rounded-card shadow-card transition-colors flex items-center justify-center min-w-[64px] ${
                    chatInput.trim() && !isStreaming
                      ? 'bg-[#A8894B] hover:bg-[#967941] text-[#12291F] cursor-pointer'
                      : 'bg-[#EBEBE6] text-[#8E9B90] cursor-not-allowed'
                  }`}
                >
                  {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
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
          
          <details className="group" open>
            <summary className="text-[10px] font-bold uppercase tracking-wider text-[#8E9B90] mb-3 cursor-pointer list-none flex items-center justify-between">
              Sources I used
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-[#617065] cursor-pointer hover:text-[#1E2923]">
                <div className="w-6 h-6 rounded bg-[#E3EFE9] text-[#1E4D3B] flex items-center justify-center font-bold text-[10px]">₦</div>
                <span className="font-semibold text-[#1E2923]">Finance Hub</span> · Runway
              </div>
              <div className="flex items-center gap-3 text-xs text-[#617065] cursor-pointer hover:text-[#1E2923]">
                <div className="w-6 h-6 rounded bg-[#E3EFE9] text-[#1E4D3B] flex items-center justify-center font-bold text-[10px]">
                  <Database className="w-3 h-3" />
                </div>
                <span className="font-semibold text-[#1E2923]">Revenue model</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#617065] cursor-pointer hover:text-[#1E2923]">
                <div className="w-6 h-6 rounded bg-[#E3EFE9] text-[#1E4D3B] flex items-center justify-center font-bold text-[10px]">
                  <Hash className="w-3 h-3" />
                </div>
                <span className="font-semibold text-[#1E2923]">Kickoff assessment</span>
              </div>
            </div>
          </details>
          
          <details className="group" open>
            <summary className="text-[10px] font-bold uppercase tracking-wider text-[#8E9B90] mb-3 cursor-pointer list-none flex items-center justify-between">
              Agents in this chat
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#1E2923]">
                <div className="w-6 h-6 rounded bg-[#1F4D3A] text-white flex items-center justify-center font-bold text-[10px]">₦</div>
                Finance Advisor
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-[#1E2923]">
                <div className="w-6 h-6 rounded bg-[#A8894B] text-[#1F4D3A] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 fill-[#1F4D3A]" />
                </div>
                Co-Founder
              </div>
            </div>
          </details>
          
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