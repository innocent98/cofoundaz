'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import { 
  Bell,
  Plus,
  Menu,
  X
} from 'lucide-react';

// --- TYPESCRIPT INTERFACES & TYPES ---
type TeamSubTab = 'Members' | 'Roles' | 'Activity' | 'Comments' | 'Audit log';
type ActivityFilter = 'All' | 'Edits' | 'Comments' | 'Documents';
type MemberRole = 'Owner' | 'Co-Founder' | 'Team Member' | 'Advisor' | 'Accountant or Legal advisor';

interface TeamMemberItem {
  name: string;
  email: string;
  role: string;
  badgeClass: string;
  lastActive: string;
  isYou?: boolean;
  status?: string;
}

interface CapabilityRow {
  capability: string;
  owner: 'full' | 'view' | 'none';
  coFdr: 'full' | 'view' | 'none';
  member: 'full' | 'view' | 'none';
  advisor: 'full' | 'view' | 'none';
  pro: 'full' | 'view' | 'none';
}

interface ActivityItem {
  id: string;
  user: string;
  initials: string;
  action: string;
  target: string;
  timeAgo: string;
  category: 'Edits' | 'Comments' | 'Documents';
  day: 'TODAY' | 'YESTERDAY';
  iconType: 'comment' | 'check' | 'edit' | 'doc';
  bgColor: string;
}

interface CommentThread {
  id: string;
  tag: string;
  location: string;
  status: 'open' | 'resolved';
  author: string;
  authorInitials: string;
  timeAgo: string;
  message: string;
  replies?: { author: string; initials: string; timeAgo: string; message: string }[];
}

interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  actionBadgeClass: string;
  target: string;
  when: string;
}

// --- MOCK DATA ---
const INITIAL_TEAM_MEMBERS: TeamMemberItem[] = [
  { name: 'Amara Okafor', email: 'amara@kolo.africa', role: 'Owner', badgeClass: 'bg-neutral-xf5efea text-accent-x7a6025', lastActive: 'Active now', isYou: true },
  { name: 'Daniel Kariuki', email: 'daniel@kolo.africa', role: 'Co-Founder', badgeClass: 'bg-neutral-xe5efea text-brand-strong', lastActive: '12 min ago' },
  { name: 'Grace Adeyemi', email: 'grace@ledgerworks.ng', role: 'Accountant', badgeClass: 'bg-accent-xf2ece1 text-accent-x7a6025', lastActive: '2 days ago' },
  { name: 'Tayo Nwachukwu', email: 'tayo@lawfirm.ng', role: 'Legal advisor', badgeClass: 'bg-accent-xf2ece1 text-accent-x7a6025', lastActive: 'Yesterday' },
  { name: 'Sara Bello', email: 'sara@kolo.africa', role: 'Team Member', badgeClass: 'bg-surface-muted text-ink-muted', lastActive: 'Not yet joined', status: 'invite pending' },
];

const CAPABILITIES_DATA: CapabilityRow[] = [
  { capability: 'View dashboard and roadmap', owner: 'full', coFdr: 'full', member: 'full', advisor: 'view', pro: 'view' },
  { capability: 'Edit business artifacts', owner: 'full', coFdr: 'full', member: 'full', advisor: 'none', pro: 'none' },
  { capability: 'View financial data', owner: 'full', coFdr: 'full', member: 'view', advisor: 'view', pro: 'full' },
  { capability: 'Edit financial data', owner: 'full', coFdr: 'full', member: 'none', advisor: 'none', pro: 'full' },
  { capability: 'Access Funding Hub and data room', owner: 'full', coFdr: 'full', member: 'none', advisor: 'view', pro: 'none' },
  { capability: 'Send documents for signature', owner: 'full', coFdr: 'full', member: 'none', advisor: 'none', pro: 'view' },
  { capability: 'Manage team and billing', owner: 'full', coFdr: 'view', member: 'none', advisor: 'none', pro: 'none' },
  { capability: 'Read the Founder Journal', owner: 'none', coFdr: 'none', member: 'none', advisor: 'none', pro: 'none' },
];

const ACTIVITIES_DATA: ActivityItem[] = [
  {
    id: '1',
    user: 'Daniel Kariuki',
    initials: 'DK',
    action: 'commented on the Lean Canvas',
    target: 'Business Builder · 12 min ago',
    timeAgo: '12 min ago',
    category: 'Comments',
    day: 'TODAY',
    iconType: 'comment',
    bgColor: 'bg-brand-strong text-white'
  },
  {
    id: '2',
    user: 'Amara Okafor',
    initials: 'AO',
    action: 'completed a mission task',
    target: "Today's Mission · 2h ago",
    timeAgo: '2h ago',
    category: 'Edits',
    day: 'TODAY',
    iconType: 'check',
    bgColor: 'bg-brand-strong text-white'
  },
  {
    id: '3',
    user: 'Grace Adeyemi',
    initials: 'GA',
    action: 'categorized 14 transactions',
    target: 'Finance Hub · 4h ago',
    timeAgo: '4h ago',
    category: 'Edits',
    day: 'TODAY',
    iconType: 'edit',
    bgColor: 'bg-brand-strong text-white'
  },
  {
    id: '4',
    user: 'Amara Okafor',
    initials: 'AO',
    action: 'uploaded the contractor agreement',
    target: 'Documents · 5h ago',
    timeAgo: '5h ago',
    category: 'Documents',
    day: 'TODAY',
    iconType: 'doc',
    bgColor: 'bg-brand-strong text-white'
  },
  {
    id: '5',
    user: 'Tayo Nwachukwu',
    initials: 'TN',
    action: 'returned the SAFE draft with comments',
    target: 'Legal & Compliance · Yesterday',
    timeAgo: 'Yesterday',
    category: 'Comments',
    day: 'YESTERDAY',
    iconType: 'comment',
    bgColor: 'bg-accent-x8f6b38 text-white'
  },
  {
    id: '6',
    user: 'Daniel Kariuki',
    initials: 'DK',
    action: 'moved Thrive SACCO to Closed Won',
    target: 'Sales Hub · Yesterday',
    timeAgo: 'Yesterday',
    category: 'Edits',
    day: 'YESTERDAY',
    iconType: 'edit',
    bgColor: 'bg-brand-strong text-white'
  },
  {
    id: '7',
    user: 'Amara Okafor',
    initials: 'AO',
    action: 'shared the data room with Sahel Fund',
    target: 'Funding Hub · Yesterday',
    timeAgo: 'Yesterday',
    category: 'Documents',
    day: 'YESTERDAY',
    iconType: 'doc',
    bgColor: 'bg-brand-strong text-white'
  },
];

const INITIAL_THREADS: CommentThread[] = [
  {
    id: 't1',
    tag: 'Lean Canvas',
    location: 'Unfair advantage block',
    status: 'open',
    author: 'Daniel Kariuki',
    authorInitials: 'DK',
    timeAgo: '12 min ago',
    message: 'I think our unfair advantage is the agent network, not the tech. Nobody can buy 340 agents who already handle these riders’ cash.'
  },
  {
    id: 't2',
    tag: 'Pre-seed deck v3',
    location: 'Slide 5, Traction',
    status: 'resolved',
    author: 'Tayo Nwachukwu',
    authorInitials: 'TN',
    timeAgo: '2 days ago',
    message: 'Worth adding the retention cohort here before you send this to Sahel.',
    replies: [
      {
        author: 'Amara Okafor',
        initials: 'AO',
        timeAgo: 'Yesterday',
        message: 'Added. Thanks Tayo.'
      }
    ]
  },
  {
    id: 't3',
    tag: 'Financial model',
    location: 'Burn assumptions tab',
    status: 'open',
    author: 'Grace Adeyemi',
    authorInitials: 'GA',
    timeAgo: '3 days ago',
    message: 'Your Q4 hire is in the model twice. I have flagged the row, take a look before this goes in the data room.'
  }
];

const AUDIT_LOGS_DATA: AuditLogItem[] = [
  {
    id: 'a1',
    actor: 'Amara Okafor',
    action: 'Data room shared',
    actionBadgeClass: 'bg-neutral-xf5efea text-accent-x7a6025',
    target: 'Sahel Fund · Financials',
    when: 'Today 10:04'
  },
  {
    id: 'a2',
    actor: 'Daniel Kariuki',
    action: 'Login',
    actionBadgeClass: 'bg-neutral-xe5efea text-brand-strong',
    target: 'Chrome · Nairobi',
    when: 'Today 09:12'
  },
  {
    id: 'a3',
    actor: 'Amara Okafor',
    action: 'Permission change',
    actionBadgeClass: 'bg-danger-xfceaea text-danger-x9e3b3b',
    target: 'Grace Adeyemi → Accountant',
    when: 'Yesterday 16:40'
  },
  {
    id: 'a4',
    actor: 'Thrive SACCO',
    action: 'Document signed',
    actionBadgeClass: 'bg-neutral-xf5efea text-accent-x7a6025',
    target: 'Mutual NDA',
    when: 'Jul 18 14:22'
  },
  {
    id: 'a5',
    actor: 'Amara Okafor',
    action: 'Invite sent',
    actionBadgeClass: 'bg-neutral-xe5efea text-brand-strong',
    target: 'sara@kolo.africa',
    when: 'Jul 17 11:05'
  },
  {
    id: 'a6',
    actor: 'Grace Adeyemi',
    action: 'Export',
    actionBadgeClass: 'bg-neutral-xe5efea text-brand-strong',
    target: 'Financial data · XLSX',
    when: 'Jul 15 09:33'
  },
  {
    id: 'a7',
    actor: 'Amara Okafor',
    action: 'Member removed',
    actionBadgeClass: 'bg-danger-xfceaea text-danger-x9e3b3b',
    target: 'contractor@temp.ng',
    when: 'Jul 2 15:18'
  }
];

export default function TeamSectionPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  
  const [teamSubTab, setTeamSubTab] = useState<TeamSubTab>('Audit log'); // Default to Audit log as per current task view
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal and Team States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('Team Member');
  const [teamMembersList, setTeamMembersList] = useState<TeamMemberItem[]>(INITIAL_TEAM_MEMBERS);

  // Comments state
  const [threads, setThreads] = useState<CommentThread[]>(INITIAL_THREADS);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendInvite = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: TeamMemberItem = {
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      badgeClass: inviteRole === 'Owner' ? 'bg-neutral-xf5efea text-accent-x7a6025' : inviteRole === 'Co-Founder' ? 'bg-neutral-xe5efea text-brand-strong' : inviteRole === 'Accountant or Legal advisor' ? 'bg-accent-xf2ece1 text-accent-x7a6025' : 'bg-surface-muted text-ink-muted',
      lastActive: 'Not yet joined',
      status: 'invite pending'
    };

    setTeamMembersList([newMember, ...teamMembersList]);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    
    setTeamSubTab('Members');
    showToast(`Invite sent as ${inviteRole}.`);
  };

  const handleReplyChange = (threadId: string, val: string) => {
    setReplyInputs(prev => ({ ...prev, [threadId]: val }));
  };

  const handleReplySubmit = (threadId: string) => {
    const text = replyInputs[threadId];
    if (!text || !text.trim()) return;

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const existingReplies = t.replies || [];
        return {
          ...t,
          replies: [
            ...existingReplies,
            {
              author: 'Amara Okafor',
              initials: 'AO',
              timeAgo: 'Just now',
              message: text.trim()
            }
          ]
        };
      }
      return t;
    }));

    setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
    showToast('Reply posted.');
  };

  const handleResolveThread = (threadId: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, status: 'resolved' };
      }
      return t;
    }));
    showToast('Thread resolved.');
  };

  const renderPermissionIcon = (type: 'full' | 'view' | 'none') => {
    if (type === 'full') {
      return <span className="text-brand-strong font-bold text-sm">✓</span>;
    }
    if (type === 'view') {
      return <span className="text-accent-bronze font-bold text-sm">◐</span>;
    }
    return <span className="text-neutral-xa3ada5 font-light text-xs">·</span>;
  };

  const renderActivityIcon = (iconType: string) => {
    if (iconType === 'comment') {
      return (
        <svg className="w-3.5 h-3.5 text-accent-x9e7b38" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    }
    if (iconType === 'check') {
      return (
        <svg className="w-3.5 h-3.5 text-brand-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (iconType === 'edit') {
      return (
        <svg className="w-3.5 h-3.5 text-brand-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5 text-brand-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const filteredActivities = ACTIVITIES_DATA.filter(item => {
    if (activityFilter === 'All') return true;
    return item.category === activityFilter;
  });

  const todayActivities = filteredActivities.filter(item => item.day === 'TODAY');
  const yesterdayActivities = filteredActivities.filter(item => item.day === 'YESTERDAY');

  const openThreadsCount = threads.filter(t => t.status === 'open').length;

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">
      
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-2.5 rounded-modal shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300">
          <span className="bg-brand-strong text-white rounded-full p-0.5 text-xs">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-line px-4 md:px-6 py-3 flex items-center justify-between bg-white w-full">
        {/* Left Breadcrumb */}
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={openSidebar}
            className="md:hidden w-8 h-8 rounded-card border border-line-stone bg-white text-brand-strong hover:bg-neutral-50 flex items-center justify-center transition-colors shrink-0 shadow-card"
            aria-label="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center space-x-2 text-xs md:text-sm font-medium tracking-tight">
            <span className="text-ink font-semibold">Workspace</span>
            <span className="text-ink-subtle">/</span>
            <span className="text-ink font-semibold">Team</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5 md:space-x-3">
          <button 
            onClick={() => showToast('Notifications opened.')}
            className="relative w-8 h-8 rounded-full border border-line-stone bg-white flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors shadow-card shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-neutral-x66756f" />
            <span className="absolute -top-1 -right-1 bg-brand-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              5
            </span>
          </button>

          <div className="flex items-center -space-x-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-strong text-white flex items-center justify-center text-[10px] font-bold border border-white">AO</div>
            <div className="w-6 h-6 rounded-full bg-brand-strong text-white flex items-center justify-center text-[10px] font-bold border border-white">DK</div>
          </div>

          <button 
            onClick={() => { 
              setTeamSubTab('Roles'); 
              setIsInviteModalOpen(true); 
            }}
            className="bg-accent-gold hover:bg-accent-xa38346 text-white px-2.5 md:px-4 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[34px] shrink-0"
          >
            <Plus size={15} />
            <span className="font-medium"> Invite</span>
          </button>
        </div>
      </header>

      {/* Team Navigation Bar */}
      <nav className="w-full bg-surface-subtle border-b border-line px-4 md:px-6 py-2.5 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {(['Members', 'Roles', 'Activity', 'Comments', 'Audit log'] as TeamSubTab[]).map((tab) => {
          const isActive = teamSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setTeamSubTab(tab);
                showToast(`Switched to ${tab} tab.`);
              }}
              className={
                isActive
                  ? "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors"
                  : "px-3.5 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors"
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {teamSubTab === 'Audit log' ? (
          /* --- AUDIT LOG PAGE --- */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Audit log</h1>
                <p className="text-xs text-ink-muted">Every sensitive action, immutable and timestamped.</p>
              </div>
              <button
                onClick={() => showToast('Audit log exported.')}
                className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px] w-fit"
              >
                Export log
              </button>
            </div>

            <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
              <div className="grid grid-cols-12 border-b border-line bg-neutral-xf9f9f6 text-[10px] font-bold text-ink-subtle uppercase tracking-wider px-6 py-3.5">
                <div className="col-span-3">Actor</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-4">Target</div>
                <div className="col-span-2 text-right">When</div>
              </div>

              <div className="divide-y divide-line">
                {AUDIT_LOGS_DATA.map((log) => (
                  <div key={log.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-xfaf9f5 transition-colors text-xs">
                    <div className="col-span-3 font-semibold text-ink">{log.actor}</div>
                    <div className="col-span-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${log.actionBadgeClass}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="col-span-4 text-ink-muted">{log.target}</div>
                    <div className="col-span-2 text-right text-ink-subtle">{log.when}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : teamSubTab === 'Comments' ? (
          /* --- COMMENTS AND MENTIONS PAGE --- */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Comments and mentions</h1>
              <span className="text-xs text-ink-muted font-medium">{openThreadsCount} threads open</span>
            </div>

            <div className="space-y-4">
              {threads.map((thread) => {
                const isResolved = thread.status === 'resolved';
                return (
                  <div key={thread.id} className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
                    <div className="px-6 py-3 bg-neutral-xf9f9f6 border-b border-line flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="bg-neutral-xeaefea text-brand-strong font-semibold px-2.5 py-0.5 rounded-input text-[11px]">{thread.tag}</span>
                        <span className="text-ink-subtle">·</span>
                        <span className="text-ink-muted font-medium">{thread.location}</span>
                      </div>
                      <div>
                        {isResolved ? (
                          <span className="bg-neutral-xeaefea text-brand-strong font-semibold px-2.5 py-0.5 rounded-input text-[11px]">Resolved</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {thread.authorInitials}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-ink">{thread.author}</span>
                            <span className="text-[11px] text-ink-subtle">{thread.timeAgo}</span>
                          </div>
                          <p className="text-xs text-neutral-x334138 leading-relaxed">{thread.message}</p>
                        </div>
                      </div>

                      {thread.replies && thread.replies.map((reply, rIdx) => (
                        <div key={rIdx} className="pl-11 pt-3 border-t border-neutral-xf2f2ec flex items-start space-x-3.5">
                          <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {reply.initials}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-ink">{reply.author}</span>
                              <span className="text-[11px] text-ink-subtle">{reply.timeAgo}</span>
                            </div>
                            <p className="text-xs text-neutral-x334138 leading-relaxed">{reply.message}</p>
                          </div>
                        </div>
                      ))}

                      {!isResolved && (
                        <div className="pt-3 border-t border-line flex flex-col md:flex-row items-center gap-3">
                          <input 
                            type="text"
                            placeholder="Reply..."
                            value={replyInputs[thread.id] || ''}
                            onChange={(e) => handleReplyChange(thread.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleReplySubmit(thread.id); }}
                            className="w-full bg-white border border-line rounded-card px-3.5 py-2 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-brand-strong"
                          />
                          <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 justify-end">
                            <button
                              onClick={() => handleReplySubmit(thread.id)}
                              className="px-4 py-2 bg-brand-strong hover:bg-brand-900 text-white rounded-card text-xs font-semibold shadow-card transition-colors"
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => handleResolveThread(thread.id)}
                              className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-card text-xs font-semibold shadow-card transition-colors"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : teamSubTab === 'Activity' ? (
          /* --- ACTIVITY SECTION --- */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Activity</h1>
              
              <div className="flex items-center space-x-1.5 bg-neutral-xf4f4f1 p-1 rounded-modal w-fit border border-line">
                {(['All', 'Edits', 'Comments', 'Documents'] as ActivityFilter[]).map((filter) => {
                  const isFilterActive = activityFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      className={
                        isFilterActive
                          ? "px-3 py-1 rounded-card text-xs font-semibold bg-brand-strong text-white shadow-card transition-colors"
                          : "px-3 py-1 rounded-card text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                      }
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {todayActivities.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Today</h3>
                <div className="space-y-2.5">
                  {todayActivities.map((act) => (
                    <div key={act.id} className="bg-white border border-line rounded-[24px] p-4 flex items-center justify-between shadow-card hover:border-neutral-xd0d0ca transition-all">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-8 h-8 rounded-full ${act.bgColor} flex items-center justify-center font-bold text-xs shrink-0`}>
                          {act.initials}
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-ink">{act.user}</span>{' '}
                          <span className="text-ink-muted">{act.action}</span>
                          <p className="text-[11px] text-ink-subtle mt-0.5">{act.target}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-surface-subtle border border-line flex items-center justify-center shrink-0">
                        {renderActivityIcon(act.iconType)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {yesterdayActivities.length > 0 && (
              <div className="space-y-3 pt-3">
                <h3 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Yesterday</h3>
                <div className="space-y-2.5">
                  {yesterdayActivities.map((act) => (
                    <div key={act.id} className="bg-white border border-line rounded-[24px] p-4 flex items-center justify-between shadow-card hover:border-neutral-xd0d0ca transition-all">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-8 h-8 rounded-full ${act.bgColor} flex items-center justify-center font-bold text-xs shrink-0`}>
                          {act.initials}
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-ink">{act.user}</span>{' '}
                          <span className="text-ink-muted">{act.action}</span>
                          <p className="text-[11px] text-ink-subtle mt-0.5">{act.target}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-surface-subtle border border-line flex items-center justify-center shrink-0">
                        {renderActivityIcon(act.iconType)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : teamSubTab === 'Roles' ? (
          /* --- ROLES MATRIX PAGE --- */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1 pt-2">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Roles and permissions</h1>
              <p className="text-xs text-ink-muted">Everyone sees only what their work needs. Your journal is invisible to all of them.</p>
            </div>

            <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
              <div className="grid grid-cols-12 border-b border-line bg-neutral-xf9f9f6 text-[10px] font-bold text-ink-subtle uppercase tracking-wider px-6 py-3.5">
                <div className="col-span-4">Capability</div>
                <div className="col-span-2 text-center">Owner</div>
                <div className="col-span-2 text-center">Co-Fdr</div>
                <div className="col-span-2 text-center">Member</div>
                <div className="col-span-1 text-center">Advisor</div>
                <div className="col-span-1 text-center">Pro</div>
              </div>

              <div className="divide-y divide-line">
                {CAPABILITIES_DATA.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-neutral-xfaf9f5 transition-colors text-xs">
                    <div className="col-span-4 font-medium text-ink">{row.capability}</div>
                    <div className="col-span-2 text-center">{renderPermissionIcon(row.owner)}</div>
                    <div className="col-span-2 text-center">{renderPermissionIcon(row.coFdr)}</div>
                    <div className="col-span-2 text-center">{renderPermissionIcon(row.member)}</div>
                    <div className="col-span-1 text-center">{renderPermissionIcon(row.advisor)}</div>
                    <div className="col-span-1 text-center">{renderPermissionIcon(row.pro)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-ink-muted px-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-brand-strong font-bold">✓</span>
                <span>Full access</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-accent-bronze font-bold">◐</span>
                <span>View only</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-neutral-xa3ada5">·</span>
                <span>No access</span>
              </div>
            </div>
          </div>
        ) : (
          /* --- MEMBERS SECTION OR OTHER TABS --- */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Your team</h1>
                <p className="text-xs text-ink-muted mt-1">3 of 5 seats used · 2 professional collaborators (free)</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => { setTeamSubTab('Roles'); showToast('Switched to Roles view.'); }}
                  className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px]"
                >
                  Manage roles
                </button>
                <button 
                  onClick={() => { 
                    setTeamSubTab('Roles'); 
                    setIsInviteModalOpen(true); 
                  }}
                  className="px-4 py-2 bg-accent-gold hover:bg-accent-xa38346 text-white rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px]"
                >
                  + Invite someone
                </button>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
              <div className="grid grid-cols-12 border-b border-line bg-neutral-xf9f9f6 text-[10px] font-bold text-ink-subtle uppercase tracking-wider px-6 py-3">
                <div className="col-span-5">Member</div>
                <div className="col-span-4">Role</div>
                <div className="col-span-3 text-right">Last active</div>
              </div>

              <div className="divide-y divide-line">
                {teamMembersList.map((member, idx) => (
                  <div key={idx} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-xfaf9f5 transition-colors">
                    <div className="col-span-5 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs text-ink">{member.name}</span>
                          {member.isYou && <span className="text-[10px] text-ink-subtle font-normal">you</span>}
                        </div>
                        <p className="text-xs text-ink-muted">{member.email}</p>
                      </div>
                    </div>

                    <div className="col-span-4 flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${member.badgeClass}`}>
                        {member.role}
                      </span>
                      {member.status && (
                        <span className="text-[10px] text-danger-bold italic font-medium">{member.status}</span>
                      )}
                    </div>

                    <div className="col-span-3 flex items-center justify-end space-x-3">
                      <span className="text-xs text-ink-muted">{member.lastActive}</span>
                      {!member.isYou && (
                        <button onClick={() => showToast(`Manage member: ${member.name}`)} className="text-xs font-semibold text-accent-gold hover:underline">
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-xfbf6ed border border-accent-xebdcc2 rounded-[24px] p-4 flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-accent-gold text-white flex items-center justify-center text-xs font-bold shrink-0">i</span>
              <p className="text-xs text-accent-x7a6025">Professional collaborators, your lawyer and accountant, are free on every plan and do not use a seat.</p>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: INVITE SOMEONE IN */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-line rounded-[24px] p-6 md:p-8 shadow-accent max-w-lg w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display text-ink">Invite someone in</h2>
                <p className="text-xs text-ink-muted mt-1">They will get an email with a secure link. You can change or revoke their access any time.</p>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-1 rounded-card text-ink-muted hover:bg-surface-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Email</label>
                <input 
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border border-line rounded-card px-3 py-2.5 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Role</label>
                
                <div className="space-y-2">
                  {[
                    { role: 'Co-Founder' as MemberRole, title: 'Co-Founder', desc: 'Full access to everything except billing.' },
                    { role: 'Team Member' as MemberRole, title: 'Team Member', desc: 'Build and edit, no financials or fundraising.' },
                    { role: 'Advisor' as MemberRole, title: 'Advisor', desc: 'View-only across the workspace.' },
                    { role: 'Accountant or Legal advisor' as MemberRole, title: 'Accountant or Legal advisor', desc: 'Scoped access to their area only.', noSeat: true },
                  ].map((item) => {
                    const isSelected = inviteRole === item.role;
                    return (
                      <div 
                        key={item.role}
                        onClick={() => setInviteRole(item.role)}
                        className={`p-3.5 rounded-modal border cursor-pointer flex items-start justify-between transition-all ${isSelected ? 'border-brand-strong bg-neutral-xf4f7f5' : 'border-line bg-white hover:bg-neutral-xfaf9f5'}`}
                      >
                        <div className="flex items-start space-x-3">
                          <input 
                            type="radio" 
                            name="inviteRole" 
                            checked={isSelected} 
                            onChange={() => setInviteRole(item.role)}
                            className="mt-0.5 accent-brand-strong" 
                          />
                          <div>
                            <p className="font-semibold text-xs text-ink">{item.title}</p>
                            <p className="text-[11px] text-ink-muted mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        {item.noSeat && (
                          <span className="bg-brand-tint text-brand-strong text-[10px] font-semibold px-2 py-0.5 rounded-input h-fit">No seat</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-accent-gold hover:bg-accent-xa38346 text-white rounded-modal text-xs font-semibold shadow-card transition-colors"
                >
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}