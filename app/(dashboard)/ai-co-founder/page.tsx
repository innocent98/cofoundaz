'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import {
  Plus,
  Search,
  PlusCircle,
  PieChart,
  FileText,
  Globe,
  Send,
  Bell,
  Sparkles,
  Menu,
  Check,
  TrendingUp,
  Diamond,
  Star,
  ArrowRight,
  Sun,
  Layers,
} from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent';
  agentName?: string;
  via?: string;
  text: string;
  reasoning?: string;
  chips?: string[];
  taskCard?: {
    text: string;
    boldText: string;
    actionText: string;
  };
}

interface SuggestedActionItem {
  id: number;
  agentRole: string;
  iconType: 'currency' | 'diamond' | 'check' | 'trending';
  title: string;
  description: string;
}

interface HistoryItem {
  id: number;
  title: string;
  topic: string;
  agents: string;
  last: string;
}

interface BenchAgent {
  id: number;
  name: string;
  category: string;
  description: string;
  buttonText: string;
  iconType:
    | 'lines'
    | 'currency'
    | 'section'
    | 'pie'
    | 'trending'
    | 'diamond'
    | 'star'
    | 'check'
    | 'arrow'
    | 'layers'
    | 'sun';
}

interface MemoryItem {
  id: number;
  text: string;
}

export default function AICoFounderPage() {
  const { openSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState('Chat');
  const [activeCategory, setActiveCategory] = useState('All');
  const [inputText, setInputText] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Settings State
  const [proactiveSuggestions, setProactiveSuggestions] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [selectedTone, setSelectedTone] = useState<'straight' | 'encouraging'>('encouraging');
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([
    { id: 1, text: 'Kolo is a mobile savings app for gig workers in West Africa.' },
    { id: 2, text: 'You prefer straight, specific answers over caveats.' },
    { id: 3, text: 'You are pre-seed and focused on validation this quarter.' },
    { id: 4, text: 'Tayo is your legal advisor; Grace is your accountant.' },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const topTabs = ['Chat', 'Suggested actions', 'History', 'Your bench', 'Settings'];
  const categories = ['All', 'Strategy', 'Finance', 'Legal', 'Growth', 'Fundraising'];

  // Interactive Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'user',
      text: 'How long is my runway, and what should I do about it?',
    },
    {
      id: 2,
      sender: 'agent',
      agentName: 'Finance Advisor',
      via: 'Co-Founder',
      text: 'You have about 8.4 months at your current net burn of ₦4.9M a month. That is workable, but revenue has been flat for two months, so the trend is what I would act on. Two levers move it fastest: pricing, and your two largest variable costs. I would test a price change before cutting anything, since your smoke test suggests room.',
      reasoning: 'Why I said this',
      chips: [
        'Draft a pricing experiment',
        'Model a 15% price increase',
        'Draft a cost-review memo',
      ],
      taskCard: {
        text: 'Done. I created ',
        boldText: 'a task: Draft a pricing experiment.',
        actionText: 'Open it',
      },
    },
  ]);

  // Suggested Actions Data
  const [suggestedActions, setSuggestedActions] = useState<SuggestedActionItem[]>([
    {
      id: 1,
      agentRole: 'Finance Advisor',
      iconType: 'currency',
      title: 'Your runway crossed below 9 months',
      description:
        'Revenue is flat and burn ticked up. Worth reviewing pricing and your two largest costs this week.',
    },
    {
      id: 2,
      agentRole: 'Fundraising Copilot',
      iconType: 'diamond',
      title: 'A ₦5M grant closes in 3 weeks',
      description:
        'It fits your stage and sector. I can pre-fill most of the application from your Business Builder.',
    },
    {
      id: 3,
      agentRole: 'Validation Scientist',
      iconType: 'check',
      title: 'Two interviews flagged the same feature',
      description:
        'Automated round-ups came up twice. Might be worth a small MVP task to test demand.',
    },
    {
      id: 4,
      agentRole: 'Sales Coach',
      iconType: 'trending',
      title: 'GigPay HR has gone quiet for 14 days',
      description:
        'It is your largest open deal. I can draft a re-engagement note in your voice.',
    },
  ]);

  // Bench Agents Data
  const benchAgents: BenchAgent[] = [
    {
      id: 1,
      name: 'Strategist',
      category: 'Business Builder',
      description: 'Sharpens your model, plan, and positioning.',
      buttonText: 'Ask Strategist',
      iconType: 'lines',
    },
    {
      id: 2,
      name: 'Finance Advisor',
      category: 'Finance Hub',
      description: 'Runway, forecasts, and the hard money calls.',
      buttonText: 'Ask Finance',
      iconType: 'currency',
    },
    {
      id: 3,
      name: 'Legal Advisor',
      category: 'Legal & Compliance',
      description: 'Contracts, formation, and staying covered.',
      buttonText: 'Ask Legal',
      iconType: 'section',
    },
    {
      id: 4,
      name: 'Marketing Advisor',
      category: 'Marketing Hub',
      description: 'Campaigns, copy, and channel strategy.',
      buttonText: 'Ask Marketing',
      iconType: 'pie',
    },
    {
      id: 5,
      name: 'Sales Coach',
      category: 'Sales Hub',
      description: 'Pipeline, objections, and closing with confidence.',
      buttonText: 'Ask Sales',
      iconType: 'trending',
    },
    {
      id: 6,
      name: 'Fundraising Copilot',
      category: 'Funding Hub',
      description: 'Investors, the data room, and running the raise.',
      buttonText: 'Ask Fundraising',
      iconType: 'diamond',
    },
    {
      id: 7,
      name: 'Readiness Coach',
      category: 'Investor Readiness',
      description: 'Your deck, your story, and the tough questions.',
      buttonText: 'Ask Readiness',
      iconType: 'star',
    },
    {
      id: 8,
      name: 'Validation Scientist',
      category: 'Validation Hub',
      description: 'Experiments that prove it before you build.',
      buttonText: 'Ask Validation',
      iconType: 'check',
    },
    {
      id: 9,
      name: 'Product Manager',
      category: 'Roadmap',
      description: 'Turns feedback into the right next build.',
      buttonText: 'Ask Product',
      iconType: 'arrow',
    },
    {
      id: 10,
      name: 'Insight Synthesizer',
      category: 'Validation Hub',
      description: 'Finds the patterns hiding in your feedback.',
      buttonText: 'Ask Insight',
      iconType: 'layers',
    },
    {
      id: 11,
      name: 'Mentor',
      category: 'Across everything',
      description: 'A steady voice for the founder behind the company.',
      buttonText: 'Ask Mentor',
      iconType: 'sun',
    },
  ];

  // Conversation History Data
  const historyItems: HistoryItem[] = [
    {
      id: 1,
      title: 'Runway and pricing',
      topic: 'Finance',
      agents: 'Finance',
      last: 'now',
    },
    {
      id: 2,
      title: 'Poke holes in my model',
      topic: 'Strategy',
      agents: 'Strategist',
      last: '2d ago',
    },
    {
      id: 3,
      title: 'NDA for a contractor',
      topic: 'Legal',
      agents: 'Legal',
      last: '3d ago',
    },
    {
      id: 4,
      title: 'First 100 customers',
      topic: 'Growth',
      agents: 'Sales, Marketing',
      last: '5d ago',
    },
    {
      id: 5,
      title: 'Grant fit check',
      topic: 'Fundraising',
      agents: 'Fundraising',
      last: '1w ago',
    },
    {
      id: 6,
      title: 'Positioning statement',
      topic: 'Strategy',
      agents: 'Strategist, Marketing',
      last: '2w ago',
    },
  ];

  const conversations = [
    {
      id: 1,
      title: 'Runway and pricing',
      time: 'now',
      tag: 'Finance',
      preview: 'Two levers move it fastest...',
      active: true,
    },
    {
      id: 2,
      title: 'Poke holes in my model',
      time: '2d',
      tag: 'Strategy',
      preview: 'Your weakest assumption is...',
    },
    {
      id: 3,
      title: 'NDA for a contractor',
      time: '3d',
      tag: 'Legal',
      preview: 'Here is a standard mutual NDA...',
    },
    {
      id: 4,
      title: 'First 100 customers',
      time: '5d',
      tag: 'Growth',
      preview: 'Founder-led sales beats paid...',
    },
    {
      id: 5,
      title: 'Grant fit check',
      time: '1w',
      tag: 'Fundraising',
      preview: 'Three grants fit your profile...',
    },
  ];

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'Chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle message submission
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: userMessageText,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');

    setTimeout(() => {
      const newAgentMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'agent',
        agentName: 'Finance Advisor',
        via: 'Co-Founder',
        text: `I'm analyzing your request regarding "${userMessageText}". Based on your financial metrics, we can optimize this further.`,
      };
      setMessages((prev) => [...prev, newAgentMessage]);
    }, 1000);
  };

  const handleDismissAction = (id: number) => {
    setSuggestedActions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleForgetMemory = (id: number) => {
    setMemoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllMemory = () => {
    setMemoryItems([]);
  };

  const renderIcon = (type: SuggestedActionItem['iconType']) => {
    switch (type) {
      case 'currency':
        return <span className="font-bold text-sm">₦</span>;
      case 'diamond':
        return <Diamond className="w-4 h-4 text-[#D89A6E]" />;
      case 'check':
        return <Check className="w-4 h-4 stroke-[3]" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderBenchIcon = (type: BenchAgent['iconType']) => {
    switch (type) {
      case 'lines':
        return (
          <div className="flex flex-col gap-1 w-3.5 items-center">
            <div className="w-full h-0.5 bg-white/80 rounded-full" />
            <div className="w-full h-0.5 bg-white/80 rounded-full" />
            <div className="w-full h-0.5 bg-white/80 rounded-full" />
          </div>
        );
      case 'currency':
        return <span className="font-bold text-sm text-[#D89A6E]">₦</span>;
      case 'section':
        return <span className="font-display text-sm font-bold text-[#D89A6E]">§</span>;
      case 'pie':
        return <PieChart className="w-4 h-4 text-[#D89A6E]" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-[#D89A6E]" />;
      case 'diamond':
        return <Diamond className="w-4 h-4 text-[#D89A6E]" />;
      case 'star':
        return <Star className="w-4 h-4 text-[#D89A6E] fill-[#D89A6E]" />;
      case 'check':
        return <Check className="w-4 h-4 stroke-[3] text-white" />;
      case 'arrow':
        return <ArrowRight className="w-4 h-4 text-[#D89A6E]" />;
      case 'layers':
        return <Layers className="w-4 h-4 text-[#D89A6E]" />;
      case 'sun':
        return <Sun className="w-4 h-4 text-[#D89A6E]" />;
      default:
        return null;
    }
  };

  // Filter history items by search query
  const filteredHistory = historyItems.filter(
    (item) =>
      item.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      item.agents.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

return (
  <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923]">
    <div className="flex flex-col min-w-0">
<header className="sticky top-0 z-40 bg-white border-b border-[#EBEBE6] px-4 md:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-card">
  <div className="flex items-center gap-3">
    {/* Mobile-Only Standalone Logo Button (triggers sidebar) */}
    <button
    onClick={openSidebar}
      className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
      aria-label="Open sidebar"
    >
      C
    </button>

    {/* Responsive Breadcrumbs */}
    <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm md:text-lg font-semibold">
      <span className="text-[#8E9B90]">Workspace</span>
      <span className="text-[#8E9B90]">/</span>
      <h1 className="text-[#1E2923] font-bold truncate">AI Co-Founder</h1>
    </div>
  </div>

  {/* Header Right Actions */}
  <div className="flex items-center gap-4">
    <div className="bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 h-[34px]">
      <span>Health</span>
      <span className="font-bold">72</span>
      <span className="text-emerald-600 font-bold">↑</span>
    </div>

    <button className="relative w-9 h-9 rounded-full border border-[#DCE6E1] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
      <Bell className="w-4 h-4 text-[#66756F]" />
      <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
        5
      </span>
    </button>

    <button className="bg-[#A8894B] text-[#12291F] font-semibold text-xs px-4 h-[36px] rounded-[8px] hover:bg-[#967941] transition-colors">
      + Invite
    </button>
  </div>
</header>
        {/* Main Page Body */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
          {/* Top Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#EBEBE6] pb-2 mb-6 overflow-x-auto no-scrollbar">
            {topTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#EAD5C6] text-[#1E2923] font-semibold'
                      : 'bg-transparent text-[#617065] hover:bg-[#F2F2EC]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Content: AI Settings View */}
          {activeTab === 'Settings' && (
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
                  AI settings
                </h2>
                <p className="text-xs text-[#617065]">
                  Tune how your Co-Founder works and what it remembers.
                </p>
              </div>

              {/* Section 1: Toggles */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] p-6 shadow-card flex flex-col divide-y divide-[#F0F0EC]">
                {/* Proactive suggestions toggle */}
                <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div>
                    <h3 className="font-bold text-sm text-[#1E2923]">
                      Proactive suggestions
                    </h3>
                    <p className="text-xs text-[#617065]">
                      Let me surface moves before you ask.
                    </p>
                  </div>
                  <button
                    onClick={() => setProactiveSuggestions(!proactiveSuggestions)}
                    className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      proactiveSuggestions ? 'bg-[#183B28]' : 'bg-[#D0D0C8]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-card transform transition-transform ${
                        proactiveSuggestions ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Daily briefing toggle */}
                <div className="flex items-center justify-between pt-4 pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#1E2923]">
                      Daily briefing
                    </h3>
                    <p className="text-xs text-[#617065]">
                      A morning digest of what needs you.
                    </p>
                  </div>
                  <button
                    onClick={() => setDailyBriefing(!dailyBriefing)}
                    className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      dailyBriefing ? 'bg-[#183B28]' : 'bg-[#D0D0C8]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-card transform transition-transform ${
                        dailyBriefing ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Section 2: Tone Selection */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] p-6 shadow-card">
                <h3 className="font-bold text-sm text-[#1E2923] mb-4">Tone</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Straight shooter card */}
                  <div
                    onClick={() => setSelectedTone('straight')}
                    className={`p-4 rounded-card border cursor-pointer transition-all ${
                      selectedTone === 'straight'
                        ? 'bg-[#EAF2ED] border-[#183B28]'
                        : 'bg-white border-[#EBEBE6] hover:border-[#D0D0C8]'
                    }`}
                  >
                    <h4 className="font-bold text-sm text-[#1E2923]">Straight shooter</h4>
                    <p className="text-xs text-[#617065] mt-1">Direct, no hedging.</p>
                  </div>

                  {/* Encouraging card */}
                  <div
                    onClick={() => setSelectedTone('encouraging')}
                    className={`p-4 rounded-card border cursor-pointer transition-all ${
                      selectedTone === 'encouraging'
                        ? 'bg-[#EAF2ED] border-[#183B28]'
                        : 'bg-white border-[#EBEBE6] hover:border-[#D0D0C8]'
                    }`}
                  >
                    <h4 className="font-bold text-sm text-[#1E2923]">Encouraging</h4>
                    <p className="text-xs text-[#617065] mt-1">Warm, still honest.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: What I Remember */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] p-6 shadow-card">
                <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                  <h3 className="font-bold text-sm text-[#1E2923]">What I remember</h3>
                  {memoryItems.length > 0 && (
                    <button
                      onClick={handleClearAllMemory}
                      className="text-xs font-semibold text-[#B84233] hover:underline transition-colors"
                    >
                      Clear all memory
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F0F0EC]">
                  {memoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3.5 text-xs text-[#334139]"
                    >
                      <span>{item.text}</span>
                      <button
                        onClick={() => handleForgetMemory(item.id)}
                        className="text-xs font-semibold text-[#617065] hover:text-[#1E2923] transition-colors ml-4 shrink-0"
                      >
                        Forget this
                      </button>
                    </div>
                  ))}

                  {memoryItems.length === 0 && (
                    <p className="text-xs text-[#8E9B90] py-6 text-center">
                      No memories saved.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Your Bench View */}
          {activeTab === 'Your bench' && (
            <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
                  Your bench
                </h2>
                <p className="text-xs text-[#617065]">
                  Every specialist, one chat away. You never have to pick, I route automatically, but you can go direct.
                </p>
              </div>

              {/* Grid of Agent Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {benchAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header with Icon */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-card bg-[#183B28] text-white flex items-center justify-center shrink-0">
                          {renderBenchIcon(agent.iconType)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#1E2923] leading-tight">
                            {agent.name}
                          </h3>
                          <span className="text-[11px] font-semibold text-[#9C5B34]">
                            {agent.category}
                          </span>
                        </div>
                      </div>

                      {/* Card Description */}
                      <p className="text-xs text-[#556358] leading-relaxed mb-6">
                        {agent.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        setActiveTab('Chat');
                        setInputText(`Hi ${agent.name}, I need help with...`);
                      }}
                      className="w-full bg-white hover:bg-[#F5F5F0] text-[#183B28] font-semibold text-xs py-2 rounded-card border border-[#D5DDD6] transition-colors"
                    >
                      {agent.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: Conversation History View */}
          {activeTab === 'History' && (
            <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
              {/* Header section with search */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
                    Conversation history
                  </h2>
                  <p className="text-xs text-[#617065]">
                    Everything you&apos;ve worked through, grouped by topic.
                  </p>
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9B90]" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search conversations"
                    className="w-full bg-white text-xs text-[#1E2923] placeholder-[#8E9B90] pl-9 pr-3 py-2 rounded-card border border-[#EBEBE6] focus:border-[#9C5B34] focus:outline-none transition-colors shadow-card"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8F8F4] border-b border-[#EBEBE6] text-[11px] font-bold uppercase tracking-wider text-[#768478]">
                        <th className="py-3.5 px-6">CONVERSATION</th>
                        <th className="py-3.5 px-6">TOPIC</th>
                        <th className="py-3.5 px-6">AGENTS</th>
                        <th className="py-3.5 px-6 text-right">LAST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBEBE6] text-xs">
                      {filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setActiveTab('Chat')}
                          className="hover:bg-[#F9F9F6] cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6 font-semibold text-[#1E2923]">
                            {item.title}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-block bg-[#E2EFE7] text-[#2D5A3F] font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                              {item.topic}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[#617065]">
                            {item.agents}
                          </td>
                          <td className="py-4 px-6 text-right text-[#8E9B90]">
                            {item.last}
                          </td>
                        </tr>
                      ))}

                      {filteredHistory.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-12 text-center text-xs text-[#8E9B90]"
                          >
                            No conversations found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Suggested Actions View */}
          {activeTab === 'Suggested actions' && (
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
                  Suggested actions
                </h2>
                <p className="text-xs text-[#617065]">
                  Proactive moves your Co-Founder spotted. Nothing happens until you say so.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {suggestedActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex items-start gap-4"
                  >
                    <div className="w-9 h-9 rounded-card bg-[#183B28] text-white flex items-center justify-center shrink-0 mt-0.5">
                      {renderIcon(action.iconType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-[#8A5330] tracking-wide">
                        {action.agentRole}
                      </span>
                      <h3 className="font-bold text-sm text-[#1E2923] mt-0.5 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs text-[#556358] leading-relaxed mb-4">
                        {action.description}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            setActiveTab('Chat');
                            setInputText(`Let's do this: ${action.title}`);
                          }}
                          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-semibold px-4 py-1.5 rounded-card transition-colors shadow-card"
                        >
                          Do it
                        </button>
                        <button
                          onClick={() => handleDismissAction(action.id)}
                          className="bg-white hover:bg-[#F5F5F0] text-[#1E2923] text-xs font-medium px-4 py-1.5 rounded-card border border-[#D5DDD6] transition-colors"
                        >
                          Dismiss
                        </button>
                        <button className="text-xs text-[#617065] hover:text-[#1E2923] transition-colors ml-1">
                          Snooze 1 week
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {suggestedActions.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-modal border border-[#EBEBE6] text-xs text-[#8E9B90]">
                    All caught up! No active suggestions right now.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Chat View */}
          {activeTab === 'Chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
              {/* Left Column: Sidebar Conversations */}
              <div className="lg:col-span-3 flex flex-col gap-3 bg-white p-4 rounded-modal border border-[#EBEBE6] shadow-card">
                <button className="w-full flex items-center justify-center gap-2 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-2.5 px-4 rounded-card text-sm transition-colors shadow-card">
                  <Plus className="w-4 h-4" />
                  <span>New chat</span>
                </button>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9B90]" />
                  <input
                    type="text"
                    placeholder="Search conversations"
                    className="w-full bg-[#F5F5F0] text-xs text-[#1E2923] placeholder-[#8E9B90] pl-9 pr-3 py-2 rounded-card border border-transparent focus:border-[#9C5B34] focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-[#183B28] text-white'
                            : 'bg-[#F2F2EC] text-[#556358] hover:bg-[#E5E5DE]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {conversations.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-card cursor-pointer transition-all ${
                        item.active
                          ? 'bg-[#F2EFE8] border border-[#EAD5C6]'
                          : 'hover:bg-[#F8F8F4]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-xs text-[#1E2923] truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-[#8E9B90] shrink-0">{item.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#E7EFEA] text-[#2D5A3F] text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                          {item.tag}
                        </span>
                        <p className="text-[11px] text-[#617065] truncate">{item.preview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Column: Interactive Chatbox */}
              <div className="lg:col-span-6 flex flex-col h-[560px] bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden justify-between">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#EBEBE6]">
                  <div>
                    <h2 className="font-bold text-sm text-[#1E2923]">Runway and pricing</h2>
                    <p className="text-[11px] text-[#8E9B90]">Finance Advisor · Co-Founder</p>
                  </div>
                  <button className="text-xs font-medium text-[#556358] bg-[#F2F2EC] hover:bg-[#E5E5DE] px-3 py-1 rounded-input border border-[#E1E1D8] transition-colors">
                    Open full view
                  </button>
                </div>

                {/* Dynamic Scrollable Chat Feed */}
                <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                  {messages.map((msg) =>
                    msg.sender === 'user' ? (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-[#183B28] text-white p-3.5 rounded-modal rounded-tr-xs max-w-[85%] text-xs leading-relaxed shadow-card">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex gap-2.5 items-start max-w-[95%]">
                        <div className="w-7 h-7 rounded-card bg-[#183B28] text-[#D89A6E] flex items-center justify-center shrink-0 mt-0.5 shadow-card">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-2.5 w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1E2923]">{msg.agentName}</span>
                            {msg.via && <span className="text-[10px] text-[#8E9B90]">via {msg.via}</span>}
                          </div>

                          <div className="bg-[#F8F8F4] border border-[#EBEBE6] p-3.5 rounded-modal rounded-tl-xs text-xs text-[#2C3830] leading-relaxed">
                            {msg.text}
                          </div>

                          {msg.reasoning && (
                            <button className="text-[11px] font-semibold text-[#183B28] hover:underline self-start">
                              {msg.reasoning}
                            </button>
                          )}

                          {msg.chips && msg.chips.length > 0 && (
                            <div className="flex flex-col gap-2 items-start mt-1">
                              {msg.chips.map((chipText, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setInputText(chipText)}
                                  className="bg-white hover:bg-[#F5F5F0] text-[#183B28] font-semibold text-xs px-4 py-2 rounded-card border border-[#D5DDD6] transition-colors shadow-card"
                                >
                                  {chipText}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.taskCard && (
                            <div className="mt-1 flex items-center justify-between bg-[#E6F1EB] border border-[#CDE3D6] rounded-modal p-3 text-xs text-[#183B28]">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-input bg-[#183B28] text-white flex items-center justify-center shrink-0">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                                <p className="text-xs">
                                  {msg.taskCard.text}
                                  <span className="font-bold">{msg.taskCard.boldText}</span>
                                </p>
                              </div>
                              <button className="font-semibold text-xs text-[#183B28] hover:underline shrink-0 ml-2">
                                {msg.taskCard.actionText}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-[#EBEBE6]">
                  <div className="bg-[#F5F5F0] rounded-modal p-2.5 border border-[#E5E5DE] focus-within:border-[#9C5B34] transition-colors">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask anything, strategy, money, legal, marketing..."
                      className="w-full bg-transparent text-xs text-[#1E2923] placeholder-[#8E9B90] focus:outline-none mb-2 px-1"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#EBEBE6]">
                      <div className="flex items-center gap-2">
                        <button type="button" className="p-1 text-[#8E9B90] hover:text-[#1E2923] transition-colors">
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8E9B90]">
                          <span>Try</span>
                          <button type="button" onClick={() => setInputText('/draft ')} className="font-semibold text-[#1E2923] hover:underline">/draft</button>
                          <span>·</span>
                          <button type="button" onClick={() => setInputText('/analyze ')} className="font-semibold text-[#1E2923] hover:underline">/analyze</button>
                          <span>·</span>
                          <button type="button" onClick={() => setInputText('/plan ')} className="font-semibold text-[#1E2923] hover:underline">/plan</button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="bg-[#9C5B34] hover:bg-[#8A5330] text-white px-4 py-1 rounded-card text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-card ml-auto cursor-pointer"
                      >
                        <span>Send</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Context & Metadata Panel */}
              <div className="lg:col-span-3 flex flex-col gap-5 bg-white p-4 rounded-modal border border-[#EBEBE6] shadow-card">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E9B90] mb-2.5">
                    Suggested Actions
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setInputText('Draft a pricing experiment for the Validation Hub')}
                      className="w-full text-left p-2.5 rounded-card bg-[#F4F7F4] hover:bg-[#E9EFE9] border border-[#E1EAE1] text-xs font-medium text-[#1E2923] transition-colors"
                    >
                      Draft a pricing experiment for the Validation Hub
                    </button>
                    <button
                      onClick={() => setInputText('Send the runway math to your accountant')}
                      className="w-full text-left p-2.5 rounded-card bg-[#F4F7F4] hover:bg-[#E9EFE9] border border-[#E1EAE1] text-xs font-medium text-[#1E2923] transition-colors"
                    >
                      Send the runway math to your accountant
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E9B90] mb-2.5">
                    Sources I Used
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-[#2C3830]">
                      <div className="p-1 bg-[#E6EFEA] rounded-[6px] text-[#183B28]">
                        <PieChart className="w-3.5 h-3.5" />
                      </div>
                      <span>Finance Hub · Runway</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#2C3830]">
                      <div className="p-1 bg-[#E6EFEA] rounded-[6px] text-[#183B28]">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span>Revenue model</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#2C3830]">
                      <div className="p-1 bg-[#E6EFEA] rounded-[6px] text-[#183B28]">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <span>Kickoff assessment</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E9B90] mb-2.5">
                    Agents In This Chat
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5 p-1">
                      <div className="w-6 h-6 rounded-[6px] bg-[#183B28] text-white flex items-center justify-center font-bold text-[10px]">
                        ₦
                      </div>
                      <span className="font-semibold text-xs text-[#1E2923]">Finance Advisor</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-1">
                      <div className="w-6 h-6 rounded-[6px] bg-[#9C5B34] text-white flex items-center justify-center">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-xs text-[#1E2923]">Co-Founder</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
