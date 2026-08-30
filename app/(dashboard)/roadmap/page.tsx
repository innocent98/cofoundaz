'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Star,
  TrendingUp,
  X,
  ArrowRight,
} from 'lucide-react';

interface TaskBar {
  title: string;
  progress: string;
  startCol: string;
  spanCols: number;
}

interface KanbanCard {
  title: string;
  dueDate: string;
  assignee: string;
  progressPercent: number;
  hasBorderAccent?: boolean;
}

interface KanbanColumn {
  title: string;
  count: number;
  cards: KanbanCard[];
}

interface MilestoneGroup {
  phaseTitle: string;
  tasks: {
    name: string;
    bar?: TaskBar;
  }[];
}

interface MilestoneRow {
  milestone: string;
  phase: string;
  due: string;
  owner: string;
  progress: number;
  status: 'In progress' | 'To do' | 'Done';
  deps?: string;
}

interface DependencyItem {
  id: string;
  task: string;
  dependsOn: string;
}

interface TemplateCard {
  id: string;
  title: string;
  category: string;
  tasksCount: number;
  milestonesCount: number;
  icon: React.ReactNode;
}

interface RePlanItem {
  id: string;
  title: string;
  oldDue: string;
  newDue: string;
  reason: string;
  selected: boolean;
}

export default function RoadmapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('Validation');
  const [activeTab, setActiveTab] = useState('AI Re-plan');
  const [viewMode, setViewMode] = useState('Month');
  const [kanbanFilter, setKanbanFilter] = useState<'phase' | 'status'>('status');

  // Interactive Notification States
  const [previewingTemplateTitle, setPreviewingTemplateTitle] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<TemplateCard | null>(null);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // AI Re-plan Interactive States
  const [rePlanItems, setRePlanItems] = useState<RePlanItem[]>([
    {
      id: '1',
      title: 'Pricing test',
      oldDue: 'Due Aug 15',
      newDue: 'Due Aug 22',
      reason: 'Validate demand ran a week long.',
      selected: true,
    },
    {
      id: '2',
      title: 'Core savings flow',
      oldDue: 'Due Sep 30',
      newDue: 'Due Oct 7',
      reason: 'Shifts with upstream pricing test.',
      selected: true,
    },
    {
      id: '3',
      title: 'Closed beta',
      oldDue: 'Due Nov 15',
      newDue: 'Due Nov 22',
      reason: 'Preserves your build buffer.',
      selected: true,
    },
  ]);

  // Form states for adding dependencies
  const [selectedTask, setSelectedTask] = useState('Validate demand');
  const [selectedDependencyTarget, setSelectedDependencyTarget] = useState('Validate demand');

  const stages = [
    { name: 'Idea', active: false },
    { name: 'Validation', active: true },
    { name: 'Build', active: false },
    { name: 'Launch', active: false },
    { name: 'Growth', active: false },
    { name: 'Scale', active: false },
  ];

  const tabs = [
    'Timeline',
    'Kanban',
    'Milestones',
    'Dependencies',
    'Templates',
    'AI Re-plan',
  ];

  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const allTaskOptions = [
    'Validate demand',
    'Pricing test',
    'Core savings flow',
    'Payments integration',
    'Closed beta',
    'Public launch',
  ];

  const templatesData: TemplateCard[] = [
    {
      id: '1',
      title: 'Validation sprint',
      category: 'Fintech',
      tasksCount: 18,
      milestonesCount: 4,
      icon: <Globe className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: '2',
      title: 'MVP build',
      category: 'Fintech',
      tasksCount: 26,
      milestonesCount: 5,
      icon: <List className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: '3',
      title: 'Go-to-market',
      category: 'B2C',
      tasksCount: 22,
      milestonesCount: 4,
      icon: <TrendingUp className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: '4',
      title: 'Pre-seed raise',
      category: 'General',
      tasksCount: 20,
      milestonesCount: 5,
      icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: '5',
      title: 'Company formation',
      category: 'Nigeria',
      tasksCount: 14,
      milestonesCount: 3,
      icon: <span className="text-xs font-semibold text-[#183B28]">§</span>,
    },
    {
      id: '6',
      title: 'Scale playbook',
      category: 'General',
      tasksCount: 30,
      milestonesCount: 6,
      icon: <Star className="w-4 h-4 text-[#183B28]" />,
    },
  ];

  const [dependenciesList, setDependenciesList] = useState<DependencyItem[]>([
    { id: '1', task: 'Pricing test', dependsOn: 'Validate demand' },
    { id: '2', task: 'Core savings flow', dependsOn: 'Pricing test' },
    { id: '3', task: 'Payments integration', dependsOn: 'Core savings flow' },
    { id: '4', task: 'Closed beta', dependsOn: 'Payments integration' },
  ]);

  const handleAddDependency = () => {
    if (selectedTask && selectedDependencyTarget) {
      setDependenciesList((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          task: selectedTask,
          dependsOn: selectedDependencyTarget,
        },
      ]);
    }
  };

  const handlePreview = (title: string) => {
    setShowNotification(null);
    setPreviewingTemplateTitle(title);
    setTimeout(() => {
      setPreviewingTemplateTitle(null);
    }, 4000);
  };

  const handleApplyClick = (template: TemplateCard) => {
    setApplyingTemplate(template);
  };

  const confirmApplyTemplate = () => {
    setApplyingTemplate(null);
    setPreviewingTemplateTitle(null);
    triggerNotification('Template merged into your roadmap.');
  };

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  const toggleRePlanItem = (id: string) => {
    setRePlanItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectedChangesCount = rePlanItems.filter((i) => i.selected).length;

  const handleApplyRePlanChanges = () => {
    triggerNotification(
      `Applied ${selectedChangesCount} ${
        selectedChangesCount === 1 ? 'change' : 'changes'
      } to your roadmap.`
    );
    setActiveTab('Timeline');
  };

  const roadmapData: MilestoneGroup[] = [
    {
      phaseTitle: 'Validation',
      tasks: [
        {
          name: 'Validate demand',
          bar: {
            title: 'Validate demand',
            progress: '60%',
            startCol: 'Jul',
            spanCols: 1,
          },
        },
        {
          name: 'Pricing test',
          bar: {
            title: 'Pricing test',
            progress: '20%',
            startCol: 'Aug',
            spanCols: 1,
          },
        },
      ],
    },
    {
      phaseTitle: 'Build MVP',
      tasks: [
        {
          name: 'Core savings flow',
          bar: {
            title: 'Core savings flow',
            progress: '0%',
            startCol: 'Sep',
            spanCols: 2,
          },
        },
        {
          name: 'Payments integration',
          bar: {
            title: 'Payments',
            progress: '0%',
            startCol: 'Oct',
            spanCols: 1.5,
          },
        },
      ],
    },
    {
      phaseTitle: 'Launch',
      tasks: [
        {
          name: 'Closed beta',
          bar: {
            title: 'Closed beta',
            progress: '0%',
            startCol: 'Nov',
            spanCols: 1,
          },
        },
        {
          name: 'Public launch',
          bar: {
            title: 'Public launch',
            progress: '0%',
            startCol: 'Dec',
            spanCols: 1,
          },
        },
      ],
    },
  ];

  const kanbanByPhase: KanbanColumn[] = [
    {
      title: 'Validation',
      count: 2,
      cards: [
        {
          title: 'Validate demand',
          dueDate: 'Due Jul 26',
          assignee: 'AO',
          progressPercent: 60,
          hasBorderAccent: true,
        },
        {
          title: 'Pricing test',
          dueDate: 'Due Aug 15',
          assignee: 'AO',
          progressPercent: 20,
        },
      ],
    },
    {
      title: 'Build MVP',
      count: 2,
      cards: [
        {
          title: 'Core savings flow',
          dueDate: 'Due Sep 30',
          assignee: 'DK',
          progressPercent: 0,
        },
        {
          title: 'Payments integration',
          dueDate: 'Due Oct 20',
          assignee: 'DK',
          progressPercent: 0,
        },
      ],
    },
    {
      title: 'Launch',
      count: 2,
      cards: [
        {
          title: 'Closed beta',
          dueDate: 'Due Nov 15',
          assignee: 'AO',
          progressPercent: 0,
        },
        {
          title: 'Public launch',
          dueDate: 'Due Dec 10',
          assignee: 'AO',
          progressPercent: 0,
        },
      ],
    },
  ];

  const kanbanByStatus: KanbanColumn[] = [
    {
      title: 'To do',
      count: 5,
      cards: [
        {
          title: 'Pricing test',
          dueDate: 'Due Aug 15',
          assignee: 'AO',
          progressPercent: 20,
        },
        {
          title: 'Core savings flow',
          dueDate: 'Due Sep 30',
          assignee: 'DK',
          progressPercent: 0,
        },
        {
          title: 'Payments integration',
          dueDate: 'Due Oct 20',
          assignee: 'DK',
          progressPercent: 0,
        },
        {
          title: 'Closed beta',
          dueDate: 'Due Nov 15',
          assignee: 'AO',
          progressPercent: 0,
        },
        {
          title: 'Public launch',
          dueDate: 'Due Dec 10',
          assignee: 'AO',
          progressPercent: 0,
        },
      ],
    },
    {
      title: 'In progress',
      count: 1,
      cards: [
        {
          title: 'Validate demand',
          dueDate: 'Due Jul 26',
          assignee: 'AO',
          progressPercent: 60,
          hasBorderAccent: true,
        },
      ],
    },
    {
      title: 'Done',
      count: 0,
      cards: [],
    },
  ];

  const milestonesData: MilestoneRow[] = [
    {
      milestone: 'Validate demand',
      phase: 'Validation',
      due: 'Jul 26',
      owner: 'Amara',
      progress: 60,
      status: 'In progress',
    },
    {
      milestone: 'Pricing test',
      phase: 'Validation',
      due: 'Aug 15',
      owner: 'Amara',
      progress: 20,
      status: 'To do',
    },
    {
      milestone: 'Core savings flow',
      phase: 'Build MVP',
      due: 'Sep 30',
      owner: 'Daniel',
      progress: 0,
      status: 'To do',
    },
    {
      milestone: 'Payments integration',
      phase: 'Build MVP',
      due: 'Oct 20',
      owner: 'Daniel',
      progress: 0,
      status: 'To do',
    },
    {
      milestone: 'Closed beta',
      phase: 'Launch',
      due: 'Nov 15',
      owner: 'Amara',
      progress: 0,
      status: 'To do',
    },
    {
      milestone: 'Public launch',
      phase: 'Launch',
      due: 'Dec 10',
      owner: 'Amara',
      progress: 0,
      status: 'To do',
    },
  ];

  const currentKanbanColumns =
    kanbanFilter === 'phase' ? kanbanByPhase : kanbanByStatus;

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] text-[#1E2923] relative">
      {/* Top Preview Badge */}
      {previewingTemplateTitle && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172E21] text-white px-5 py-2.5 rounded-modal shadow-raised flex items-center gap-2.5 transition-all duration-300 border border-[#2B4736]">
          <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-medium tracking-tight">
            Previewing &ldquo;{previewingTemplateTitle}&rdquo;.
          </span>
          <button
            onClick={() => setPreviewingTemplateTitle(null)}
            className="ml-2 text-sage-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Floating Notification Badge (Used for AI Re-plan and Templates) */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172E21] text-white px-6 py-3 rounded-modal shadow-raised flex items-center gap-3 transition-all duration-300 border border-[#2B4736]">
          <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold tracking-tight">
            {showNotification}
          </span>
          <button
            onClick={() => setShowNotification(null)}
            className="ml-2 text-sage-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Header & Navigation Wrapper */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6]">
          {/* Main Top Navbar */}
          <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-card">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
                aria-label="Open sidebar"
              >
                C
              </button>

              <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                <span className="text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="text-[#1E2923] font-bold truncate">Roadmap</h1>
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

          {/* Sticky Header Page Content */}
          <div className="px-4 md:px-8 pt-6 pb-2 bg-[#F7F7F5] flex flex-col gap-5">
            {/* Title Row with Alert Pill */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
                  Roadmap
                </h2>
                <p className="text-xs text-[#617065] mt-1">
                  Your path from Validation to profitability. I re-plan it when reality changes.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('AI Re-plan')}
                className="flex items-center gap-2 bg-[#F5EEDC] hover:bg-[#EAD5C6] text-[#8A5330] px-4 py-2 rounded-card text-xs font-medium transition-colors border border-[#EAD5C6] self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>3 tasks slipped, review re-plan</span>
              </button>
            </div>

            {/* Stages Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {stages.map((stage) => {
                const isSelected = selectedStage === stage.name;
                return (
                  <button
                    key={stage.name}
                    onClick={() => setSelectedStage(stage.name)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#183B28] text-white font-semibold'
                        : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#D89A6E]' : 'bg-[#C5CFC7]'
                      }`}
                    />
                    {stage.name}
                  </button>
                );
              })}
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-6 border-b border-[#EBEBE6] pt-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${
                      isActive
                        ? 'text-[#1E2923]'
                        : 'text-[#768478] hover:text-[#1E2923]'
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183B28] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-6">
          {/* AI RE-PLAN VIEW */}
          {activeTab === 'AI Re-plan' && (
            <div className="flex flex-col gap-8">
              {/* Main Card Container */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
                {/* Banner Header */}
                <div className="bg-[#F5EEDC] p-6 border-b border-[#EAD5C6] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-[#8A5330]/10 text-[#8A5330] flex items-center justify-center shrink-0 border border-[#8A5330]/20 mt-0.5">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-[#1E2923]">
                      3 tasks have slipped. Want me to re-plan?
                    </h3>
                    <p className="text-xs text-[#768478]">
                      Validate demand ran long, so I&apos;d shift three downstream milestones. Nothing applies until you approve.
                    </p>
                  </div>
                </div>

                {/* Proposed Changes Section */}
                <div className="flex flex-col">
                  <div className="px-6 py-4 border-b border-[#EBEBE6] bg-white">
                    <h4 className="text-sm font-bold text-[#1E2923]">
                      Proposed changes
                    </h4>
                  </div>

                  <div className="divide-y divide-[#EBEBE6]">
                    {rePlanItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleRePlanItem(item.id)}
                        className="p-6 flex items-start gap-4 hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                      >
                        {/* Custom Checkbox */}
                        <button
                          type="button"
                          className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                            item.selected
                              ? 'bg-[#183B28] text-white'
                              : 'border-2 border-[#C5CFC7] bg-white group-hover:border-[#183B28]'
                          }`}
                        >
                          {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex flex-col gap-1.5 flex-1">
                          <h5 className="text-sm font-bold text-[#1E2923]">
                            {item.title}
                          </h5>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="line-through text-[#B26B6B] font-medium">
                              {item.oldDue}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#8E9B90]" />
                            <span className="text-[#183B28] font-bold">
                              {item.newDue}
                            </span>
                          </div>

                          <p className="text-xs text-[#768478] mt-0.5">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 border-t border-[#EBEBE6] bg-white flex items-center justify-end gap-3">
                    <button
                      onClick={() => setActiveTab('Timeline')}
                      className="bg-white border border-[#EBEBE6] hover:bg-[#F5F5F0] text-[#1E2923] text-xs font-bold px-6 py-2.5 rounded-card transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleApplyRePlanChanges}
                      disabled={selectedChangesCount === 0}
                      className="bg-[#9C5B34] hover:bg-[#8A5330] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-card transition-colors shadow-card"
                    >
                      Apply {selectedChangesCount}{' '}
                      {selectedChangesCount === 1 ? 'change' : 'changes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Past Re-plans Section */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#768478]">
                  PAST RE-PLANS
                </h4>

                <div className="flex flex-col gap-3">
                  <div className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col gap-1">
                    <h5 className="text-sm font-bold text-[#1E2923]">
                      Re-planned 2 milestones
                    </h5>
                    <p className="text-xs text-[#768478]">
                      Jun 30 · Smoke test took longer than planned.
                    </p>
                  </div>

                  <div className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col gap-1">
                    <h5 className="text-sm font-bold text-[#1E2923]">
                      Re-planned 1 milestone
                    </h5>
                    <p className="text-xs text-[#768478]">
                      Jun 12 · Legal setup moved earlier at your request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE VIEW */}
          {activeTab === 'Timeline' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <div className="flex items-center bg-white p-1 rounded-card border border-[#EBEBE6] shadow-card">
                  {['Week', 'Month', 'Quarter'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded-input text-xs font-medium transition-all ${
                        viewMode === mode
                          ? 'bg-[#EAD5C6] text-[#1E2923] font-bold'
                          : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 border-b border-[#EBEBE6] bg-[#F7F7F5] text-[11px] font-bold text-[#768478] uppercase">
                      <div className="py-3 px-6 border-r border-[#EBEBE6]">
                        PHASE & MILESTONE
                      </div>
                      {months.map((m) => (
                        <div
                          key={m}
                          className="py-3 px-4 text-center border-r border-[#EBEBE6] last:border-r-0"
                        >
                          {m}
                        </div>
                      ))}
                    </div>

                    <div className="relative divide-y divide-[#F0F0EC]">
                      <div
                        className="absolute top-0 bottom-0 w-[1.5px] bg-[#9C5B34] z-10 pointer-events-none"
                        style={{ left: '35.5%' }}
                      />

                      {roadmapData.map((group, groupIdx) => (
                        <React.Fragment key={groupIdx}>
                          <div className="bg-[#FAF9F6] px-6 py-2.5 text-xs font-bold text-[#1E2923] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-xs bg-[#183B28]" />
                            {group.phaseTitle}
                          </div>

                          {group.tasks.map((task, taskIdx) => (
                            <div
                              key={taskIdx}
                              className="grid grid-cols-7 items-center text-xs text-[#1E2923] hover:bg-[#FAF9F6] transition-colors"
                            >
                              <div className="py-4 px-6 font-medium border-r border-[#F0F0EC] truncate">
                                {task.name}
                              </div>

                              <div className="col-span-6 grid grid-cols-6 h-full relative">
                                {months.map((m) => (
                                  <div
                                    key={m}
                                    className="border-r border-[#F0F0EC] last:border-r-0 h-full min-h-[52px]"
                                  />
                                ))}

                                {task.bar && (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 h-9 rounded-card bg-[#E6EFEA] border border-[#B8D5C4] flex items-center justify-between px-3 text-xs font-bold text-[#183B28] shadow-card z-20"
                                    style={{
                                      left:
                                        task.bar.startCol === 'Jul'
                                          ? '2%'
                                          : task.bar.startCol === 'Aug'
                                          ? '18.6%'
                                          : task.bar.startCol === 'Sep'
                                          ? '35.2%'
                                          : task.bar.startCol === 'Oct'
                                          ? '52%'
                                          : task.bar.startCol === 'Nov'
                                          ? '68.5%'
                                          : '85%',
                                      width:
                                        task.bar.spanCols === 1
                                          ? '14%'
                                          : task.bar.spanCols === 1.5
                                          ? '22%'
                                          : '28%',
                                    }}
                                  >
                                    <span className="truncate">
                                      {task.bar.title}
                                    </span>
                                    <span className="text-[10px] text-[#2D5A3F] font-semibold ml-1">
                                      {task.bar.progress}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#768478] font-medium pt-1">
                <span className="w-3 h-0.5 bg-[#9C5B34]" />
                <span>Today</span>
              </div>
            </div>
          )}

          {/* KANBAN VIEW */}
          {activeTab === 'Kanban' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKanbanFilter('phase')}
                  className={`px-4 py-1.5 rounded-card text-xs font-semibold transition-all ${
                    kanbanFilter === 'phase'
                      ? 'bg-[#EAD5C6] text-[#1E2923]'
                      : 'bg-white border border-[#EBEBE6] text-[#617065] hover:bg-[#F5F5F0]'
                  }`}
                >
                  By phase
                </button>
                <button
                  onClick={() => setKanbanFilter('status')}
                  className={`px-4 py-1.5 rounded-card text-xs font-semibold transition-all ${
                    kanbanFilter === 'status'
                      ? 'bg-[#EAD5C6] text-[#1E2923]'
                      : 'bg-white border border-[#EBEBE6] text-[#617065] hover:bg-[#F5F5F0]'
                  }`}
                >
                  By status
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {currentKanbanColumns.map((col, colIdx) => (
                  <div
                    key={colIdx}
                    className="bg-[#F2F4F1] rounded-modal p-4 border border-[#EBEBE6] flex flex-col gap-4 min-h-[380px]"
                  >
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-[#1E2923]">
                        {col.title}
                      </h3>
                      <span className="bg-white text-[#556358] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#EBEBE6]">
                        {col.count}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {col.cards.map((card, cardIdx) => (
                        <div
                          key={cardIdx}
                          className={`bg-white rounded-modal p-4 shadow-card border relative overflow-hidden flex flex-col gap-3 ${
                            card.hasBorderAccent
                              ? 'border-[#D89A6E]'
                              : 'border-[#EBEBE6]'
                          }`}
                        >
                          {card.hasBorderAccent && (
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#9C5B34] rounded-l-2xl" />
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-[#1E2923] leading-snug">
                              {card.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#768478]">
                            <span>{card.dueDate}</span>
                            <span className="w-6 h-6 rounded-full bg-[#173B28] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shrink-0">
                              {card.assignee}
                            </span>
                          </div>

                          <div className="w-full bg-[#EAEFEA] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-[#2D5A3F] h-full rounded-full transition-all duration-300"
                              style={{ width: `${card.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MILESTONES VIEW */}
          {activeTab === 'Milestones' && (
            <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#F7F7F5] border-b border-[#EBEBE6] text-[11px] font-bold text-[#768478] uppercase">
                      <th className="py-4 px-6 font-bold">MILESTONE</th>
                      <th className="py-4 px-6 font-bold">PHASE</th>
                      <th className="py-4 px-6 font-bold">DUE</th>
                      <th className="py-4 px-6 font-bold">OWNER</th>
                      <th className="py-4 px-6 font-bold">PROGRESS</th>
                      <th className="py-4 px-6 font-bold">DEPS</th>
                      <th className="py-4 px-4 font-bold text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EC] text-xs font-medium text-[#1E2923]">
                    {milestonesData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#FAF9F6] transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-[#1E2923]">
                          {row.milestone}
                        </td>
                        <td className="py-4 px-6 text-[#556358]">{row.phase}</td>
                        <td className="py-4 px-6 text-[#556358]">{row.due}</td>
                        <td className="py-4 px-6 text-[#556358]">{row.owner}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <div className="w-24 bg-[#EAEFEA] h-2 rounded-full overflow-hidden shrink-0">
                              <div
                                className="bg-[#2D5A3F] h-full rounded-full"
                                style={{ width: `${row.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-[#556358] w-8">
                              {row.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium inline-block ${
                              row.status === 'In progress'
                                ? 'bg-[#F2EADA] text-[#8A5330]'
                                : 'bg-[#F0F0EC] text-[#617065]'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="text-[#8E9B90] hover:text-[#1E2923] p-1 rounded-[6px] transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEPENDENCIES VIEW */}
          {activeTab === 'Dependencies' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-modal border border-[#EBEBE6] p-6 md:p-10 shadow-card flex flex-col gap-8">
                <h3 className="text-xs font-bold text-[#1E2923]">
                  Dependency graph
                </h3>

                <div className="py-8 overflow-x-auto flex items-center justify-center">
                  <div className="min-w-[650px] flex items-center justify-center relative">
                    <svg
                      className="w-full h-16 max-w-[700px]"
                      viewBox="0 0 600 60"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        x1="50"
                        y1="30"
                        x2="150"
                        y2="30"
                        stroke="#A2B7AA"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="150"
                        y1="30"
                        x2="250"
                        y2="30"
                        stroke="#A2B7AA"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="250"
                        y1="30"
                        x2="350"
                        y2="30"
                        stroke="#A2B7AA"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="350"
                        y1="30"
                        x2="450"
                        y2="30"
                        stroke="#A2B7AA"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="450"
                        y1="30"
                        x2="520"
                        y2="30"
                        stroke="#A2B7AA"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M512 25L524 30L512 35"
                        stroke="#A2B7AA"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="50"
                        cy="30"
                        r="22"
                        fill="#E6EFEA"
                        stroke="#183B28"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="150"
                        cy="30"
                        r="22"
                        fill="#E6EFEA"
                        stroke="#183B28"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="250"
                        cy="30"
                        r="22"
                        fill="#E6EFEA"
                        stroke="#183B28"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="350"
                        cy="30"
                        r="22"
                        fill="#E6EFEA"
                        stroke="#183B28"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="450"
                        cy="30"
                        r="22"
                        fill="#E6EFEA"
                        stroke="#183B28"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="540"
                        cy="30"
                        r="22"
                        fill="#E6EFEA"
                        stroke="#183B28"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-modal border border-[#EBEBE6] p-6 md:p-8 shadow-card flex flex-col gap-6">
                <h3 className="text-xs font-bold text-[#1E2923]">
                  Add a dependency
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[200px]">
                    <select
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#EBEBE6] rounded-card px-4 py-2.5 text-xs font-medium text-[#1E2923] pr-10 focus:outline-none focus:border-[#183B28]"
                    >
                      {allTaskOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#768478] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <span className="text-xs font-medium text-[#768478]">
                    depends on
                  </span>

                  <div className="relative min-w-[200px]">
                    <select
                      value={selectedDependencyTarget}
                      onChange={(e) =>
                        setSelectedDependencyTarget(e.target.value)
                      }
                      className="w-full appearance-none bg-white border border-[#EBEBE6] rounded-card px-4 py-2.5 text-xs font-medium text-[#1E2923] pr-10 focus:outline-none focus:border-[#183B28]"
                    >
                      {allTaskOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#768478] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={handleAddDependency}
                    className="bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold px-5 py-2.5 rounded-card transition-colors shadow-card"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-col gap-3.5 pt-2">
                  {dependenciesList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-xs text-[#1E2923]"
                    >
                      <span className="font-bold">{item.task}</span>
                      <span className="text-[#8E9B90]">→ depends on →</span>
                      <span className="font-bold">{item.dependsOn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES VIEW */}
          {activeTab === 'Templates' && (
            <div className="flex flex-col gap-6">
              <p className="text-xs text-[#768478]">
                Start from a proven path. Applying a template merges it into your roadmap. Nothing gets deleted.
              </p>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templatesData.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6 hover:shadow-card transition-shadow"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Icon Circle */}
                      <div className="w-10 h-10 rounded-modal bg-[#E6EFEA] flex items-center justify-center shrink-0">
                        {tmpl.icon}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-sm font-bold text-[#1E2923]">
                          {tmpl.title}
                        </h3>
                        <span className="text-xs font-medium text-[#9C5B34]">
                          {tmpl.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#8E9B90] mt-1">
                        {tmpl.tasksCount} tasks · {tmpl.milestonesCount} milestones
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handlePreview(tmpl.title)}
                        className="w-full bg-white border border-[#EBEBE6] hover:bg-[#F5F5F0] text-[#1E2923] text-xs font-bold py-2.5 rounded-card transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleApplyClick(tmpl)}
                        className="w-full bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold py-2.5 rounded-card transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Apply Template Overlay Modal */}
      {applyingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-md w-full p-6 md:p-8 shadow-raised border border-[#EBEBE6] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-display font-bold text-[#1E2923]">
                Apply this template?
              </h3>
              <p className="text-xs text-[#768478] leading-relaxed">
                Applying merges this template into your roadmap. Nothing gets deleted.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setApplyingTemplate(null)}
                className="flex-1 bg-white border border-[#EBEBE6] hover:bg-[#F5F5F0] text-[#1E2923] text-xs font-bold py-3 rounded-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplyTemplate}
                className="flex-1 bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold py-3 rounded-card transition-colors"
              >
                Apply template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}