'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import {
  Bell,
  Plus,
  ArrowRight,
  LayoutGrid,
  Sun,
  Diamond,
  Smile,
  TrendingUp,
  Target,
  ShieldAlert,
  Sparkles,
  Download,
  Check,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  progress: number;
  icon: React.ReactNode;
  category: string;
}

interface CanvasSection {
  id: string;
  title: string;
  items: string[];
}

interface Persona {
  id: string;
  initials: string;
  name: string;
  role: string;
  age: number;
  location: string;
  incomeType: string;
  quote: string;
  goals: string;
  frustrations: string;
}

interface PricingTier {
  id: string;
  tier: string;
  price: string;
  included: string;
}

interface RevenueStream {
  id: string;
  stream: string;
  basis: string;
  estMonthly: string;
}

interface Competitor {
  id: string;
  name: string;
  positioning: string;
  threat: 'High' | 'Medium' | 'Low';
}

interface SwotSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  dotColor: string;
  items: string[];
}

interface ChecklistItem {
  id: string;
  title: string;
  status: 'ready' | 'missing';
}

export default function BusinessBuilderPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Business Plan');
  const [showAiModal, setShowAiModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Business Plan Generator State
  const [genState, setGenState] = useState<'idle' | 'generating' | 'ready'>('idle');
  const [selectedAudience, setSelectedAudience] = useState<'Bank' | 'Investors' | 'Internal'>('Investors');
  const [selectedLength, setSelectedLength] = useState<'Concise' | 'Full'>('Concise');

  // Pricing Strategy filter state
  const [selectedPricingStrategy, setSelectedPricingStrategy] = useState('Subscription');

  // Mission & Vision states
  const [missionText, setMissionText] = useState(
    'We help gig workers save automatically, without a bank or willpower.'
  );
  const [visionText, setVisionText] = useState(
    'A generation of informal workers who retire with dignity.'
  );

  const tabs = [
    'Overview',
    'Business Model',
    'Lean Canvas',
    'Mission & Vision',
    'Value Prop',
    'Personas',
    'Pricing',
    'Revenue',
    'Competitive',
    'SWOT',
    'Business Plan',
  ];

  const readinessChecklist: ChecklistItem[] = [
    { id: 'bmc', title: 'Business Model Canvas', status: 'ready' },
    { id: 'vp', title: 'Value Proposition', status: 'ready' },
    { id: 'ps', title: 'Pricing Strategy', status: 'missing' },
    { id: 'rm', title: 'Revenue Model', status: 'ready' },
    { id: 'fm', title: 'Financial model', status: 'missing' },
  ];

  const pricingStrategies = [
    'Subscription',
    'One-time',
    'Usage-based',
    'Freemium',
    'Tiered',
  ];

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      tier: 'Free',
      price: '₦0',
      included: 'Auto round-ups, one goal wallet',
    },
    {
      id: 'saver',
      tier: 'Saver',
      price: '₦500 / mo',
      included: 'Unlimited goals, streaks, interest',
    },
    {
      id: 'saver-plus',
      tier: 'Saver+',
      price: '₦800 / mo',
      included: 'Everything, plus family wallets and investing',
    },
  ];

  const revenueStreams: RevenueStream[] = [
    {
      id: 'sub',
      stream: 'Subscription (Saver tiers)',
      basis: 'Per active subscriber',
      estMonthly: '₦1.2M',
    },
    {
      id: 'spread',
      stream: 'Interest spread',
      basis: 'On pooled balances',
      estMonthly: '₦300K',
    },
    {
      id: 'referrals',
      stream: 'Partner referrals',
      basis: 'Per qualified lead',
      estMonthly: '₦100K',
    },
  ];

  const competitors: Competitor[] = [
    {
      id: 'piggyvest',
      name: 'PiggyVest',
      positioning: 'Broad savings & investing',
      threat: 'High',
    },
    {
      id: 'cowrywise',
      name: 'Cowrywise',
      positioning: 'Investing-led',
      threat: 'Medium',
    },
    {
      id: 'ajo',
      name: 'Traditional ajo',
      positioning: 'Informal, offline',
      threat: 'Medium',
    },
    {
      id: 'banks',
      name: 'Bank apps',
      positioning: 'Full service, formal',
      threat: 'Low',
    },
  ];

  const swotData: SwotSection[] = [
    {
      id: 'strengths',
      title: 'Strengths',
      icon: <span className="text-sm font-bold">↑</span>,
      bgColor: 'bg-[#EAF3EE]',
      borderColor: 'border-[#CCE2D5]',
      titleColor: 'text-[#183B28]',
      dotColor: 'bg-[#183B28]',
      items: [
        'Trusted agent network',
        'Dead-simple saving flow',
        'Low cost to save',
      ],
    },
    {
      id: 'weaknesses',
      title: 'Weaknesses',
      icon: <span className="text-sm font-bold">↓</span>,
      bgColor: 'bg-[#F9F4E6]',
      borderColor: 'border-[#EAD5C6]',
      titleColor: 'text-[#8A5330]',
      dotColor: 'bg-[#8A5330]',
      items: [
        'Thin runway',
        'Small team',
        'No investing feature yet',
      ],
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      icon: <ArrowUpRight className="w-4 h-4" />,
      bgColor: 'bg-[#F3F7F4]',
      borderColor: 'border-[#DCE8E0]',
      titleColor: 'text-[#2D5A3F]',
      dotColor: 'bg-[#2D5A3F]',
      items: [
        'Huge unbanked market',
        'Grant funding available',
        'Partner distribution',
      ],
    },
    {
      id: 'threats',
      title: 'Threats',
      icon: <AlertTriangle className="w-4 h-4" />,
      bgColor: 'bg-[#FDF2F2]',
      borderColor: 'border-[#F4C7C7]',
      titleColor: 'text-[#A34B4B]',
      dotColor: 'bg-[#A34B4B]',
      items: [
        'Well-funded incumbents',
        'Regulatory shifts',
        'Trust is fragile',
      ],
    },
  ];

  const monthlyProjectionData = [18, 26, 32, 38, 46, 54, 60, 68, 74, 82, 88, 100];

  const modules: ModuleCard[] = [
    {
      id: 'bmc',
      title: 'Business Model Canvas',
      description: 'The nine building blocks of how you create value.',
      progress: 80,
      category: 'Business Model',
      icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'lean',
      title: 'Lean Canvas',
      description: 'A one-page problem-to-solution snapshot.',
      progress: 60,
      category: 'Lean Canvas',
      icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'mission',
      title: 'Mission & Vision',
      description: 'Why you exist and the world if you win.',
      progress: 100,
      category: 'Mission & Vision',
      icon: <Sun className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'value-prop',
      title: 'Value Proposition',
      description: 'The fit between customer needs and what you offer.',
      progress: 70,
      category: 'Value Prop',
      icon: <Diamond className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'personas',
      title: 'Customer Personas',
      description: 'Who you are building for, in detail.',
      progress: 50,
      category: 'Personas',
      icon: <Smile className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'pricing',
      title: 'Pricing Strategy',
      description: 'Your model and tiers, grounded in willingness to pay.',
      progress: 40,
      category: 'Pricing',
      icon: <span className="text-xs font-bold text-[#183B28]">₦</span>,
    },
    {
      id: 'revenue',
      title: 'Revenue Model',
      description: 'Where the money comes from and how much.',
      progress: 55,
      category: 'Revenue',
      icon: <TrendingUp className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'competitive',
      title: 'Competitive Analysis',
      description: 'Who else is out there and where you win.',
      progress: 65,
      category: 'Competitive',
      icon: <Target className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'swot',
      title: 'SWOT',
      description: 'Strengths, weaknesses, opportunities, threats.',
      progress: 35,
      category: 'SWOT',
      icon: <ShieldAlert className="w-4 h-4 text-[#183B28]" />,
    },
  ];

  const bmcSections: CanvasSection[] = [
    { id: 'partners', title: 'KEY PARTNERS', items: ['Mobile money agents', 'Microfinance banks'] },
    { id: 'activities', title: 'KEY ACTIVITIES', items: ['Automated savings', 'Payouts'] },
    { id: 'value', title: 'VALUE PROPOSITION', items: ['Save without thinking', 'No bank needed'] },
    { id: 'relationships', title: 'CUSTOMER RELATIONSHIPS', items: ['In-app coach'] },
    { id: 'segments', title: 'CUSTOMER SEGMENTS', items: ['Gig workers', 'Traders'] },
    { id: 'resources', title: 'KEY RESOURCES', items: ['Payments API', 'Trust'] },
    { id: 'channels', title: 'CHANNELS', items: ['WhatsApp', 'Referral'] },
    { id: 'costs', title: 'COST STRUCTURE', items: ['Payment fees', 'Support'] },
    { id: 'revenue', title: 'REVENUE STREAMS', items: ['₦500 / mo', 'Interest spread'] },
  ];

  const leanCanvasSections: CanvasSection[] = [
    { id: 'problem', title: 'PROBLEM', items: ['No easy way to save', 'Income is irregular'] },
    { id: 'solution', title: 'SOLUTION', items: ['Auto round-ups', 'Locked goals'] },
    { id: 'uvp', title: 'UNIQUE VALUE PROPOSITION', items: ['Save without thinking'] },
    { id: 'advantage', title: 'UNFAIR ADVANTAGE', items: ['Agent trust network'] },
    { id: 'segments', title: 'CUSTOMER SEGMENTS', items: ['Gig workers'] },
    { id: 'metrics', title: 'KEY METRICS', items: ['Active savers', 'Avg balance'] },
    { id: 'channels', title: 'CHANNELS', items: ['WhatsApp', 'Referral'] },
    { id: 'costs', title: 'COST STRUCTURE', items: ['Payment fees'] },
    { id: 'revenue', title: 'REVENUE STREAMS', items: ['Subscription', 'Interest'] },
  ];

  const valuePropData = {
    customerProfile: [
      { id: 'jobs', title: 'JOBS', items: ['Set money aside', 'Handle emergencies'] },
      { id: 'pains', title: 'PAINS', items: ['No willpower', 'Fees eat savings'] },
      { id: 'gains', title: 'GAINS', items: ['Peace of mind', 'A visible goal'] },
    ],
    valueMap: [
      { id: 'products', title: 'PRODUCTS', items: ['Auto round-ups', 'Goal wallets'] },
      { id: 'pain-relievers', title: 'PAIN RELIEVERS', items: ['No manual effort', 'Zero fees to save'] },
      { id: 'gain-creators', title: 'GAIN CREATORS', items: ['Streaks & nudges', 'Interest on balance'] },
    ],
  };

  const personas: Persona[] = [
    {
      id: 'chidi',
      initials: 'CO',
      name: 'Chidi',
      role: 'okada rider',
      age: 28,
      location: 'Lagos',
      incomeType: 'daily cash income',
      quote: '“I earn every day but somehow it is gone by the weekend.”',
      goals: 'Save for a second bike; cover slow weeks.',
      frustrations: 'No discipline; banks feel far and unfriendly.',
    },
    {
      id: 'funke',
      initials: 'FT',
      name: 'Funke',
      role: 'market trader',
      age: 41,
      location: 'Ibadan',
      incomeType: 'weekly cash flow',
      quote: '“I keep my savings in a box. It is not safe.”',
      goals: "Grow stock; children's school fees.",
      frustrations: 'Cash is risky; ajo collectors are unreliable.',
    },
    {
      id: 'yaw',
      initials: 'YS',
      name: 'Yaw',
      role: 'delivery gig',
      age: 24,
      location: 'Accra',
      incomeType: 'app-based income',
      quote: '“I want to invest but I do not know where to start.”',
      goals: 'Build an emergency fund; try investing.',
      frustrations: 'Income swings; too many confusing apps.',
    },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSendToFinancialModel = () => {
    triggerToast('Assumptions sent to your financial model.');
  };

  const handleDraftAI = () => {
    setShowAiModal(false);
    triggerToast('✦ AI draft added. Review before using.');
  };

  const handleExport = () => {
    triggerToast('Exported to Documents.');
  };

  const handleGenerateBusinessPlan = () => {
    setGenState('generating');
    setTimeout(() => {
      setGenState('ready');
    }, 2000);
  };

  const handleOpenDocument = () => {
    triggerToast('✓ Opening in Documents.');
  };

  const getProgressColor = (pct: number) => {
    if (pct === 100) return '#183B28';
    if (pct >= 60) return '#2D5A3F';
    if (pct >= 40) return '#8A5330';
    return '#B26B6B';
  };

  const getThreatBadgeStyle = (threat: 'High' | 'Medium' | 'Low') => {
    switch (threat) {
      case 'High':
        return 'bg-[#FBEBEB] text-[#B83E3E]';
      case 'Medium':
        return 'bg-[#F7EFE0] text-[#9C5B34]';
      case 'Low':
        return 'bg-[#EBF5F0] text-[#2E7A56]';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] text-[#1E2923] relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#12261C] text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#D89A6E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6]">
          <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card"
              >
                C
              </button>
              <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
                <span className="text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="text-[#1E2923] font-bold">Business Builder</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-[#E6EFEA] text-[#183B28] px-3.5 py-1.5 rounded-full text-xs font-medium">
                <span className="text-[#556358]">Health</span>
                <span className="font-bold text-sm">72</span>
                <span className="text-[10px] text-[#2D5A3F]">↑</span>
              </div>

              <button className="relative p-2.5 bg-[#F5F5F0] hover:bg-[#EBEBE6] rounded-full transition-colors text-[#1E2923]">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors shadow-card">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Invite</span>
              </button>
            </div>
          </header>

          {/* Module Nav Tabs */}
          <div className="px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card'
                        : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
          {activeTab === 'Overview' ? (
            <>
              <div>
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Business Builder
                </h2>
                <p className="text-xs text-[#768478] mt-1.5 max-w-xl">
                  Define the business. Every artifact you finish here feeds your plan, your score, and your pitch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((card) => {
                  const strokeColor = getProgressColor(card.progress);
                  return (
                    <div
                      key={card.id}
                      className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6 hover:shadow-card transition-shadow group cursor-pointer"
                      onClick={() => setActiveTab(card.category)}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-modal bg-[#E6EFEA] flex items-center justify-center shrink-0">
                            {card.icon}
                          </div>

                          <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                stroke="#EBEBE6"
                                strokeWidth="3.5"
                                fill="transparent"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                stroke={strokeColor}
                                strokeWidth="3.5"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 16}
                                strokeDashoffset={
                                  2 * Math.PI * 16 * (1 - card.progress / 100)
                                }
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-[10px] font-bold text-[#1E2923]">
                              {card.progress}%
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <h3 className="text-sm font-bold text-[#1E2923] group-hover:text-[#183B28] transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-xs text-[#768478] leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-[#183B28] pt-2">
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'Business Model' || activeTab === 'Lean Canvas' ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                    {activeTab === 'Business Model'
                      ? 'Business Model Canvas'
                      : 'Lean Canvas'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#556358] mt-1">
                    <span className="text-[#183B28] font-medium">✓ Saved</span>
                    <span>·</span>
                    <span>edited 2h ago</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2 rounded-card text-xs transition-colors border border-[#EAD5C6]"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
                    <span>Fill with AI</span>
                  </button>

                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] text-[#1E2923] font-semibold px-4 py-2 rounded-card text-xs transition-colors border border-[#EBEBE6] shadow-card"
                  >
                    <Download className="w-3.5 h-3.5 text-[#556358]" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {(activeTab === 'Business Model'
                  ? bmcSections
                  : leanCanvasSections
                ).map((sec) => (
                  <div
                    key={sec.id}
                    className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col gap-4 min-h-[160px]"
                  >
                    <h4 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                      {sec.title}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {sec.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-[#E6EFEA] text-[#183B28] text-xs font-medium px-3 py-1.5 rounded-input border border-[#D5E3DB]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'Mission & Vision' ? (
            <div className="flex flex-col gap-6 max-w-4xl">
              <div>
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Mission & Vision
                </h2>
              </div>

              <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E2923]">Mission</h3>
                    <p className="text-xs text-[#768478]">
                      Why you exist, one sentence, no jargon.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      triggerToast('✦ 3 Mission suggestions generated!')
                    }
                    className="flex items-center gap-1 text-xs font-bold text-[#183B28] hover:text-[#2D5A3F] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-[#183B28]" />
                    <span>Give me 3 options</span>
                  </button>
                </div>

                <div className="mt-1">
                  <textarea
                    rows={3}
                    value={missionText}
                    onChange={(e) => setMissionText(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-xs md:text-sm text-[#1E2923] focus:outline-hidden focus:border-[#183B28] focus:bg-white transition-all resize-y font-normal leading-relaxed"
                  />
                </div>
              </div>

              <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E2923]">Vision</h3>
                    <p className="text-xs text-[#768478]">The world if you win.</p>
                  </div>

                  <button
                    onClick={() =>
                      triggerToast('✦ 3 Vision suggestions generated!')
                    }
                    className="flex items-center gap-1 text-xs font-bold text-[#183B28] hover:text-[#2D5A3F] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-[#183B28]" />
                    <span>Give me 3 options</span>
                  </button>
                </div>

                <div className="mt-1">
                  <textarea
                    rows={3}
                    value={visionText}
                    onChange={(e) => setVisionText(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-xs md:text-sm text-[#1E2923] focus:outline-hidden focus:border-[#183B28] focus:bg-white transition-all resize-y font-normal leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'Value Prop' ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Value Proposition
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
                  <h3 className="text-sm font-bold text-[#1E2923]">
                    Customer profile
                  </h3>

                  <div className="flex flex-col gap-5">
                    {valuePropData.customerProfile.map((sec) => (
                      <div key={sec.id} className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                          {sec.title}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sec.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-[#F5F2E9] text-[#522F1A] text-xs font-medium px-3.5 py-2 rounded-card border border-[#EAE3D2]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
                  <h3 className="text-sm font-bold text-[#1E2923]">
                    Value map
                  </h3>

                  <div className="flex flex-col gap-5">
                    {valuePropData.valueMap.map((sec) => (
                      <div key={sec.id} className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                          {sec.title}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sec.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-[#E6EFEA] text-[#183B28] text-xs font-medium px-3.5 py-2 rounded-card border border-[#D5E3DB]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center py-4">
                <p className="text-xs md:text-sm font-semibold text-[#183B28] flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Strong fit: your pain relievers map to their top two pains.</span>
                </p>
              </div>
            </div>
          ) : activeTab === 'Personas' ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Customer personas
                </h2>

                <button
                  onClick={() => triggerToast('✦ Personas updated from validation notes!')}
                  className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-[#EAD5C6] self-start md:self-auto shadow-card"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
                  <span>Generate from validation notes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#183B28] text-[#EAD5C6] font-bold text-base flex items-center justify-center shrink-0">
                          {persona.initials}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-sm font-bold text-[#1E2923]">
                            {persona.name}, {persona.role}
                          </h3>
                          <p className="text-[11px] text-[#768478]">
                            Age {persona.age} · {persona.location} · {persona.incomeType}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[#556358] italic leading-relaxed pt-1">
                        {persona.quote}
                      </p>

                      <div className="flex flex-col gap-1 pt-2">
                        <span className="text-[10px] font-bold tracking-wider text-[#8A5330] uppercase">
                          GOALS
                        </span>
                        <p className="text-xs text-[#1E2923] leading-normal">
                          {persona.goals}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-[#A34B4B] uppercase">
                          FRUSTRATIONS
                        </span>
                        <p className="text-xs text-[#1E2923] leading-normal">
                          {persona.frustrations}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'Pricing' ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Pricing strategy
                </h2>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {pricingStrategies.map((strat) => {
                  const isActive = selectedPricingStrategy === strat;
                  return (
                    <button
                      key={strat}
                      onClick={() => setSelectedPricingStrategy(strat)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#183B28] text-white'
                          : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
                      }`}
                    >
                      {strat}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                        <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/4">
                          TIER
                        </th>
                        <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/4">
                          PRICE
                        </th>
                        <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-2/4">
                          WHAT&apos;S INCLUDED
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EC]">
                      {pricingTiers.map((tier) => (
                        <tr key={tier.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                            {tier.tier}
                          </td>
                          <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#183B28]">
                            {tier.price}
                          </td>
                          <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                            {tier.included}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#12261C] text-white p-5 rounded-modal flex items-center gap-3 shadow-card">
                <div className="w-7 h-7 rounded-input bg-[#213C2D] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 fill-[#D89A6E] text-[#D89A6E]" />
                </div>
                <p className="text-xs md:text-sm font-medium leading-relaxed">
                  Willingness-to-pay signal from your survey suggests <span className="font-bold">₦500 to ₦800 per month</span> is the sweet spot for gig workers.
                </p>
              </div>
            </div>
          ) : activeTab === 'Revenue' ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Revenue model
                </h2>

                <button
                  onClick={handleSendToFinancialModel}
                  className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 shadow-card"
                >
                  <span>Send to financial model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                        <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                          STREAM
                        </th>
                        <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                          BASIS
                        </th>
                        <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                          EST. MONTHLY
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EC]">
                      {revenueStreams.map((row) => (
                        <tr key={row.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                            {row.stream}
                          </td>
                          <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                            {row.basis}
                          </td>
                          <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#183B28]">
                            {row.estMonthly}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
                <h3 className="text-xs font-bold text-[#1E2923]">
                  12-month projection
                </h3>

                <div className="h-48 flex items-end justify-between gap-2.5 md:gap-4 pt-4 px-2">
                  {monthlyProjectionData.map((heightPct, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-[#235840] hover:bg-[#183B28] transition-colors rounded-xs md:rounded-[2px]"
                      style={{ height: `${heightPct}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'Competitive' ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  Competitive analysis
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[420px]">
                      <thead>
                        <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                          <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                            COMPETITOR
                          </th>
                          <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                            POSITIONING
                          </th>
                          <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                            THREAT
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0EC]">
                        {competitors.map((comp) => (
                          <tr key={comp.id} className="hover:bg-[#FAF9F5] transition-colors">
                            <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                              {comp.name}
                            </td>
                            <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                              {comp.positioning}
                            </td>
                            <td className="py-4 px-6 text-xs md:text-sm">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getThreatBadgeStyle(
                                  comp.threat
                                )}`}
                              >
                                {comp.threat}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-[#1E2923]">
                    Positioning map
                  </h3>

                  <div className="relative w-full h-64 border-l border-b border-[#A0AABA] mt-2 mb-2">
                    <span className="absolute top-0 left-2 text-[10px] font-medium text-[#556358]">
                      High trust
                    </span>
                    <span className="absolute bottom-1 right-2 text-[10px] font-medium text-[#556358]">
                      Low cost →
                    </span>

                    <div className="absolute top-[38%] left-[20%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#75B29B] border-2 border-white shadow-card" />
                      <span className="text-[10px] font-bold text-[#1E2923] mt-1">Banks</span>
                    </div>

                    <div className="absolute top-[62%] left-[45%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#3B7A57] border-2 border-white shadow-card" />
                      <span className="text-[10px] font-bold text-[#1E2923] mt-1">Cowrywise</span>
                    </div>

                    <div className="absolute top-[46%] left-[52%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#1A422D] border-2 border-white shadow-card" />
                      <span className="text-[10px] font-bold text-[#1E2923] mt-1">PiggyVest</span>
                    </div>

                    <div className="absolute top-[30%] left-[82%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#9C5B34] border-2 border-white shadow-card" />
                      <span className="text-[10px] font-bold text-[#1E2923] mt-1">Kolo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'SWOT' ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  SWOT
                </h2>

                <button
                  onClick={() => setShowAiModal(true)}
                  className="bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 border border-[#EAD5C6] shadow-card"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
                  <span>Seed each quadrant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {swotData.map((quad) => (
                  <div
                    key={quad.id}
                    className={`${quad.bgColor} ${quad.borderColor} rounded-modal p-6 border shadow-card flex flex-col gap-4 min-h-[190px]`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={quad.titleColor}>{quad.icon}</span>
                      <h3 className={`text-base font-bold ${quad.titleColor}`}>
                        {quad.title}
                      </h3>
                    </div>

                    <ul className="flex flex-col gap-3 pt-1">
                      {quad.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2.5 text-xs md:text-sm text-[#2D3830] font-medium"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${quad.dotColor} shrink-0`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'Business Plan' ? (
            /* BUSINESS PLAN TAB */
            <div className="flex flex-col gap-6 max-w-4xl">
              <div>
                <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
                  AI business plan generator
                </h2>
                <p className="text-xs text-[#768478] mt-1.5">
                  I&apos;ll compile your canvases, personas, pricing, and financials into a plan. You edit, nothing is final until you say so.
                </p>
              </div>

              {genState === 'idle' && (
                <div className="flex flex-col gap-6">
                  {/* Readiness Checklist Card */}
                  <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-[#1E2923]">
                      Readiness checklist
                    </h3>

                    <div className="flex flex-col divide-y divide-[#F5F5F0]">
                      {readinessChecklist.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            {item.status === 'ready' ? (
                              <div className="w-5 h-5 rounded-[6px] bg-[#183B28] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-[6px] bg-[#FDF4E3] text-[#8A5330] flex items-center justify-center font-bold text-xs shrink-0 border border-[#EAD5C6]">
                                !
                              </div>
                            )}
                            <span className="text-xs md:text-sm font-medium text-[#1E2923]">
                              {item.title}
                            </span>
                          </div>

                          <div>
                            {item.status === 'ready' ? (
                              <span className="text-xs font-medium text-[#2D5A3F]">
                                Ready
                              </span>
                            ) : (
                              <button
                                onClick={() => setShowAiModal(true)}
                                className="text-xs font-medium text-[#8A5330] hover:underline"
                              >
                                Draft missing sections with AI
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Options Grid: Audience & Length */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audience Selection */}
                    <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-[#1E2923]">
                        Audience
                      </h3>

                      <div className="flex items-center gap-2">
                        {(['Bank', 'Investors', 'Internal'] as const).map((aud) => {
                          const isSelected = selectedAudience === aud;
                          return (
                            <button
                              key={aud}
                              onClick={() => setSelectedAudience(aud)}
                              className={`px-4 py-2 rounded-card text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-[#183B28] text-white shadow-card'
                                  : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
                              }`}
                            >
                              {aud}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Length Selection */}
                    <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-[#1E2923]">
                        Length
                      </h3>

                      <div className="flex items-center gap-2">
                        {[
                          { key: 'Concise', label: 'Concise (10 to 15 pp)' },
                          { key: 'Full', label: 'Full (25 to 40 pp)' },
                        ].map((len) => {
                          const isSelected = selectedLength === len.key;
                          return (
                            <button
                              key={len.key}
                              onClick={() => setSelectedLength(len.key as 'Concise' | 'Full')}
                              className={`px-4 py-2 rounded-card text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-white border-2 border-[#183B28] text-[#1E2923] shadow-card'
                                  : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
                              }`}
                            >
                              {len.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    onClick={handleGenerateBusinessPlan}
                    className="w-full bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold py-3.5 rounded-card text-sm transition-colors shadow-card active:scale-[0.99]"
                  >
                    Generate my business plan
                  </button>
                </div>
              )}

              {genState === 'generating' && (
                <div className="bg-white rounded-modal p-12 border border-[#EBEBE6] shadow-card flex flex-col items-center justify-center text-center gap-4 min-h-[320px]">
                  <Loader2 className="w-8 h-8 text-[#9C5B34] animate-spin" />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-display font-bold text-[#1E2923]">
                      Compiling your canvases...
                    </h3>
                    <p className="text-xs text-[#768478]">
                      This is a bigger job. I&apos;ll have it ready in a moment.
                    </p>
                  </div>
                </div>
              )}

              {genState === 'ready' && (
                <div className="bg-white rounded-modal p-10 border border-[#EBEBE6] shadow-card flex flex-col items-center justify-center text-center gap-6 min-h-[320px]">
                  <div className="w-14 h-14 rounded-full bg-[#183B28] text-white flex items-center justify-center shadow-card">
                    <Check className="w-7 h-7" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-2xl font-display font-bold text-[#1E2923]">
                      Your business plan is ready.
                    </h3>
                    <p className="text-xs text-[#768478]">
                      Compiled from your canvases, financials, and market data.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleOpenDocument}
                      className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-6 py-3 rounded-card text-xs transition-colors shadow-card"
                    >
                      Open document
                    </button>
                    <button
                      onClick={() => setGenState('idle')}
                      className="bg-white hover:bg-[#F5F5F0] text-[#1E2923] font-semibold px-6 py-3 rounded-card text-xs transition-colors border border-[#EBEBE6] shadow-card"
                    >
                      Regenerate a section
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PLACEHOLDER */
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-modal border border-[#EBEBE6] gap-3">
              <h3 className="text-lg font-bold text-[#1E2923]">
                {activeTab} Module
              </h3>
              <p className="text-xs text-[#768478] max-w-sm text-center">
                This module is under construction. Use the top navigation bar to browse available screens.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* AI Fill Modal Overlay */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-[#1E2923]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-modal p-6 max-w-md w-full shadow-raised border border-[#EBEBE6] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-card bg-[#8A5330] flex items-center justify-center text-white shrink-0 shadow-card">
                <Sparkles className="w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-display font-bold text-[#1E2923]">
                  Fill with AI
                </h3>
                <p className="text-xs text-[#617065] leading-relaxed">
                  I&apos;ll draft this from your profile, assessment, and market data. You edit, nothing is final until you say so.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F0F0EC]">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2.5 rounded-card border border-[#EBEBE6] text-xs font-bold text-[#1E2923] hover:bg-[#F5F5F0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDraftAI}
                className="px-5 py-2.5 rounded-card bg-[#8A5330] hover:bg-[#6E4326] text-white text-xs font-bold transition-colors shadow-card"
              >
                Draft it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}