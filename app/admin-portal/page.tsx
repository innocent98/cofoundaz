'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  LifeBuoy, 
  ShieldCheck, 
  Library, 
  Search, 
  ArrowUpRight 
} from 'lucide-react';

type AdminTab = 'Dashboard' | 'Workspaces' | 'Users' | 'Support' | 'Expert vetting' | 'Content library';
type UserFilterTab = 'All' | 'Active' | 'Past due' | 'Trialing';
type SupportTab = 'Open' | 'Mine' | 'Resolved';

interface WorkspaceItem {
  name: string;
  owner: string;
  initial: string;
  initialBg: string;
  stage: string;
  seats: string;
  health: number;
  healthColor: string;
  lastActive: string;
}

interface UserItem {
  name: string;
  email: string;
  initial: string;
  initialBg: string;
  workspace: string;
  plan: string;
  planBg: string;
  status: 'Active' | 'Past due' | 'Trialing' | 'Dormant';
  statusBg: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  priority: 'Urgent' | 'High' | 'Normal';
  priorityBadgeBg: string;
  title: string;
  user: string;
  workspace: string;
  plan: string;
  timeAgo: string;
  message: string;
}

interface ExpertApplication {
  id: string;
  name: string;
  initial: string;
  initialBg: string;
  role: string;
  location: string;
  rate: string;
  bio: string;
  tags: { text: string; type: 'success' | 'warning' }[];
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  stage: string;
  status: 'Published' | 'In review' | 'Draft';
  statusBg: string;
}

export default function AdminDashboardPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AdminTab>('Content library');
  const [userFilter, setUserFilter] = useState<UserFilterTab>('All');
  const [supportTab, setSupportTab] = useState<SupportTab>('Open');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('4821');
  const [replyText, setReplyText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expert Vetting State
  const [experts, setExperts] = useState<ExpertApplication[]>([
    {
      id: 'exp-1',
      name: 'Adaeze Bello',
      initial: 'AB',
      initialBg: 'bg-[#183B28]',
      role: 'Corporate lawyer',
      location: 'Abuja, Nigeria',
      rate: '₦30,000 / hr',
      bio: 'Fourteen years in venture financing, formerly at a Lagos firm advising Series A rounds. I want to work with founders earlier, when the advice actually changes outcomes.',
      tags: [
        { text: 'Bar licence verified', type: 'success' },
        { text: 'References checked', type: 'success' },
        { text: 'Sample work reviewed', type: 'warning' },
      ],
      status: 'Pending'
    },
    {
      id: 'exp-2',
      name: 'Joseph Mwangi',
      initial: 'JM',
      initialBg: 'bg-[#B39353]',
      role: 'Growth marketer',
      location: 'Nairobi, Kenya',
      rate: '₦20,000 / hr',
      bio: 'I have run acquisition for three East African fintechs from zero to 100k users. Referral and USSD are my specialities.',
      tags: [
        { text: 'Portfolio verified', type: 'success' },
        { text: 'References checked', type: 'warning' },
        { text: 'Rate within range', type: 'success' },
      ],
      status: 'Approved'
    },
    {
      id: 'exp-3',
      name: 'Chinwe Eze',
      initial: 'CE',
      initialBg: 'bg-[#183B28]',
      role: 'Fractional CFO',
      location: 'Remote',
      rate: '₦45,000 / hr',
      bio: 'Ex-Big Four, now helping seed-stage companies build models investors do not argue with.',
      tags: [
        { text: 'ACCA verified', type: 'success' },
        { text: 'References checked', type: 'success' },
        { text: 'Rate within range', type: 'warning' },
      ],
      status: 'Pending'
    }
  ]);

  // Content Library State
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: 'cnt-1',
      title: 'Pricing experiments that actually tell you something',
      type: 'Course',
      stage: 'Validation',
      status: 'Published',
      statusBg: 'bg-[#EBF5ED] text-[#137333]'
    },
    {
      id: 'cnt-2',
      title: 'Contractor agreement (Nigeria)',
      type: 'Template',
      stage: 'All',
      status: 'Published',
      statusBg: 'bg-[#EBF5ED] text-[#137333]'
    },
    {
      id: 'cnt-3',
      title: 'Your first 100 users in a low-trust market',
      type: 'Course',
      stage: 'Launch',
      status: 'In review',
      statusBg: 'bg-[#F9F6EE] text-[#8C6D28]'
    },
    {
      id: 'cnt-4',
      title: 'Kenya incorporation checklist',
      type: 'Playbook',
      stage: 'Idea',
      status: 'Draft',
      statusBg: 'bg-[#EFEFEA] text-[#7A8580]'
    },
    {
      id: 'cnt-5',
      title: 'SAFE agreement',
      type: 'Template',
      stage: 'Funding',
      status: 'Published',
      statusBg: 'bg-[#EBF5ED] text-[#137333]'
    },
    {
      id: 'cnt-6',
      title: 'Reading your runway like a CFO',
      type: 'Course',
      stage: 'Growth',
      status: 'In review',
      statusBg: 'bg-[#F9F6EE] text-[#8C6D28]'
    }
  ]);

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateExpertStatus = (id: string, newStatus: 'Approved' | 'Rejected'): void => {
    setExperts(prev => prev.map(exp => exp.id === id ? { ...exp, status: newStatus } : exp));
    showToast(`Expert application ${newStatus.toLowerCase()} successfully.`);
  };

  // Mock chart heights for Dashboard
  const signupsBars = [
    { signups: 50, activated: 30 },
    { signups: 60, activated: 40 },
    { signups: 55, activated: 35 },
    { signups: 70, activated: 50 },
    { signups: 75, activated: 55 },
    { signups: 65, activated: 45 },
    { signups: 80, activated: 60 },
    { signups: 85, activated: 65 },
    { signups: 75, activated: 55 },
    { signups: 95, activated: 70 },
  ];

  // Workspaces data table
  const workspacesList: WorkspaceItem[] = [
    { name: 'Kolo', owner: 'Amara Okafor', initial: 'K', initialBg: 'bg-[#183B28]', stage: 'Validation', seats: '3 of 5', health: 72, healthColor: 'text-[#137333]', lastActive: 'Today' },
    { name: 'Payflow', owner: 'Fatima Adeyemi', initial: 'P', initialBg: 'bg-[#183B28]', stage: 'Growth', seats: '9', health: 81, healthColor: 'text-[#137333]', lastActive: 'Today' },
    { name: 'Shamba', owner: 'Samuel Mwangi', initial: 'S', initialBg: 'bg-[#B39353]', stage: 'Idea', seats: '1 of 1', health: 48, healthColor: 'text-[#B39353]', lastActive: '2d ago' },
    { name: 'Tradeline', owner: 'Ngozi Balogun', initial: 'T', initialBg: 'bg-[#183B28]', stage: 'Validation', seats: '4 of 5', health: 66, healthColor: 'text-[#B39353]', lastActive: 'Yesterday' },
    { name: 'Sendly', owner: 'Kofi Owusu', initial: 'S', initialBg: 'bg-[#B39353]', stage: 'Idea', seats: '1 of 1', health: 31, healthColor: 'text-[#A63326]', lastActive: '6w ago' },
    { name: 'BodaCare', owner: 'Ifeoma Nnaji', initial: 'B', initialBg: 'bg-[#183B28]', stage: 'Growth', seats: '7', health: 77, healthColor: 'text-[#137333]', lastActive: 'Today' },
  ];

  // Users data list
  const usersList: UserItem[] = [
    { name: 'Amara Okafor', email: 'amara@kolo.africa', initial: 'AO', initialBg: 'bg-[#183B28]', workspace: 'Kolo', plan: 'Growth', planBg: 'bg-[#EAECE9] text-[#2C3530]', status: 'Past due', statusBg: 'bg-[#FDF0ED] text-[#A63326]' },
    { name: 'Daniel Kariuki', email: 'daniel@kolo.africa', initial: 'DK', initialBg: 'bg-[#183B28]', workspace: 'Kolo', plan: 'Growth', planBg: 'bg-[#EAECE9] text-[#2C3530]', status: 'Active', statusBg: 'bg-[#EBF5ED] text-[#137333]' },
    { name: 'Fatima Adeyemi', email: 'fatima@payflow.io', initial: 'FA', initialBg: 'bg-[#183B28]', workspace: 'Payflow', plan: 'Scale', planBg: 'bg-[#F2EFE9] text-[#594B30]', status: 'Active', statusBg: 'bg-[#EBF5ED] text-[#137333]' },
    { name: 'Samuel Mwangi', email: 'sam@shamba.co.ke', initial: 'SM', initialBg: 'bg-[#B39353]', workspace: 'Shamba', plan: 'Starter', planBg: 'bg-[#EAECE9] text-[#2C3530]', status: 'Trialing', statusBg: 'bg-[#F9F6EE] text-[#8C6D28]' },
    { name: 'Ngozi Balogun', email: 'ngozi@tradeline.ng', initial: 'NB', initialBg: 'bg-[#183B28]', workspace: 'Tradeline', plan: 'Growth', planBg: 'bg-[#EAECE9] text-[#2C3530]', status: 'Active', statusBg: 'bg-[#EBF5ED] text-[#137333]' },
    { name: 'Kofi Owusu', email: 'kofi@sendly.gh', initial: 'KO', initialBg: 'bg-[#594B30]', workspace: 'Sendly', plan: 'Starter', planBg: 'bg-[#EAECE9] text-[#2C3530]', status: 'Dormant', statusBg: 'bg-[#EFEFEA] text-[#7A8580]' },
  ];

  // Support tickets data matching screenshot exactly
  const supportTickets: SupportTicket[] = [
    {
      id: '4821',
      ticketNumber: '#4821',
      priority: 'Urgent',
      priorityBadgeBg: 'bg-[#A63326] text-white',
      title: 'Cannot access workspace after payment failed',
      user: 'Amara Okafor',
      workspace: 'Kolo',
      plan: 'Growth',
      timeAgo: '18 min ago',
      message: 'My card failed and now the Finance Hub is locked. I have an investor meeting in two hours and I need the runway numbers. Please help.'
    },
    {
      id: '4819',
      ticketNumber: '#4819',
      priority: 'High',
      priorityBadgeBg: 'bg-[#B39353] text-white',
      title: 'AI credits used up faster than expected',
      user: 'Fatima Adeyemi',
      workspace: 'Payflow',
      plan: 'Scale',
      timeAgo: '2h ago',
      message: 'We noticed our monthly AI credit allocation depleted within 5 days of reset. We would like to request an audit of our usage logs.'
    },
    {
      id: '4814',
      ticketNumber: '#4814',
      priority: 'Normal',
      priorityBadgeBg: 'bg-[#E2E2DC] text-[#1E2923]',
      title: 'Request to export all data',
      user: 'Kofi Owusu',
      workspace: 'Sendly',
      plan: 'Starter',
      timeAgo: 'Yesterday',
      message: 'Hello team, could you please provide a full JSON/CSV export of our workspace documents and generated reports?'
    },
    {
      id: '4808',
      ticketNumber: '#4808',
      priority: 'Normal',
      priorityBadgeBg: 'bg-[#E2E2DC] text-[#1E2923]',
      title: 'Accountant cannot see the Finance Hub',
      user: 'Ngozi Balogun',
      workspace: 'Tradeline',
      plan: 'Growth',
      timeAgo: '2d ago',
      message: 'I added my accountant as a seat member, but they receive an access denied error whenever they click on the Finance Hub module.'
    },
  ];

  const activeTicket = supportTickets.find(t => t.id === selectedTicketId) || supportTickets[0];

  // Filter users
  const filteredUsers = usersList.filter(u => {
    if (userFilter === 'All') return true;
    if (userFilter === 'Active') return u.status === 'Active';
    if (userFilter === 'Past due') return u.status === 'Past due';
    if (userFilter === 'Trialing') return u.status === 'Trialing';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1E2923] font-body antialiased flex relative selection:bg-[#EAD5C6]">

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-[#1E4231]">
          <span className="w-4 h-4 rounded-full bg-[#1C4230] flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#121413] text-[#A3A8A4] flex flex-col justify-between shrink-0 select-none border-r border-[#1E2220]">
        
        {/* Top brand & navigation */}
        <div className="p-6 space-y-8">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-modal bg-[#B39353] flex items-center justify-center text-white font-bold text-sm shadow-card">
              C
            </div>
            <div>
              <h1 className="text-white font-display font-medium text-base tracking-tight leading-none">Cofoundaz</h1>
              <span className="text-[10px] font-bold tracking-widest text-[#B39353] uppercase">ADMIN</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            
            {/* MONITOR SECTION */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686D6A] px-3">Monitor</span>
              
              <button
                type="button"
                onClick={() => { setActiveTab('Dashboard'); showToast('Switched to Dashboard'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-modal text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Dashboard' 
                    ? 'bg-[#1C211F] text-white font-semibold shadow-card' 
                    : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} className={activeTab === 'Dashboard' ? 'text-[#B39353]' : 'text-[#8E9B90]'} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('Workspaces'); showToast('Switched to Workspaces'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-modal text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Workspaces' 
                    ? 'bg-[#1C211F] text-white font-semibold shadow-card' 
                    : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Boxes size={16} className={activeTab === 'Workspaces' ? 'text-[#B39353]' : 'text-[#8E9B90]'} />
                <span>Workspaces</span>
              </button>
            </div>

            {/* PEOPLE SECTION */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686D6A] px-3">People</span>
              
              <button
                type="button"
                onClick={() => { setActiveTab('Users'); showToast('Switched to Users'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-modal text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Users' 
                    ? 'bg-[#1C211F] text-white font-semibold shadow-card' 
                    : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Users size={16} className={activeTab === 'Users' ? 'text-[#B39353]' : 'text-[#8E9B90]'} />
                <span>Users</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('Support'); showToast('Switched to Support'); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-modal text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Support' 
                    ? 'bg-[#1C211F] text-white font-semibold shadow-card' 
                    : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <LifeBuoy size={16} className={activeTab === 'Support' ? 'text-[#B39353]' : 'text-[#8E9B90]'} />
                  <span>Support</span>
                </div>
                <span className="bg-[#A63326] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">4</span>
              </button>
            </div>

            {/* CURATION SECTION */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686D6A] px-3">Curation</span>
              
              <button
                type="button"
                onClick={() => { setActiveTab('Expert vetting'); showToast('Switched to Expert vetting'); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-modal text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Expert vetting' 
                    ? 'bg-[#1C211F] text-white font-semibold shadow-card' 
                    : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ShieldCheck size={16} className={activeTab === 'Expert vetting' ? 'text-[#B39353]' : 'text-[#8E9B90]'} />
                  <span>Expert vetting</span>
                </div>
                <span className="bg-[#B39353] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('Content library'); showToast('Switched to Content library'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-modal text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Content library' 
                    ? 'bg-[#1C211F] text-white font-semibold shadow-card' 
                    : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Library size={16} className={activeTab === 'Content library' ? 'text-[#B39353]' : 'text-[#8E9B90]'} />
                <span>Content library</span>
              </button>
            </div>

          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#1E2220] flex items-center justify-between bg-[#101211]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#2A332E] text-[#B39353] font-bold text-xs flex items-center justify-center shrink-0">
              MR
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-xs font-semibold truncate">Marcus Reyes</div>
              <div className="text-[10px] text-[#7A8580] truncate">Support admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-[#E8E8E2] px-8 py-3.5 flex items-center justify-between bg-white w-full">
          <div className="flex items-center space-x-2 text-sm md:text-base font-semibold tracking-tight">
            <span className="text-[#617065] font-normal">Admin</span>
            <span className="text-[#8E9B90] font-normal">/</span>
            <span className="text-[#1E2923] font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search bar */}
            <div className="relative hidden md:block w-72">
              <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#8E9B90]" />
              <input
                type="text"
                placeholder="Search users, workspaces, tickets..."
                className="w-full bg-[#F7F7F5] border border-[#E0E0DA] rounded-modal pl-9 pr-3.5 py-1.5 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#B39353]"
              />
            </div>

            <button
              type="button"
              onClick={() => showToast('Read & support actions loaded')}
              className="bg-[#12291F] hover:bg-[#183B28] text-white px-4 py-2 rounded-modal text-xs font-semibold transition-colors shadow-card cursor-pointer flex items-center space-x-1.5"
            >
              <span>Read + support</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto overflow-y-auto">

          {/* DASHBOARD VIEW */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-3xl font-display font-medium text-[#1E2923]">Platform health</h2>
                  <p className="text-xs text-[#8E9B90] mt-0.5">Last 30 days</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-3 shadow-card">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Total workspaces</span>
                  <div className="text-3xl font-display font-medium text-[#1E2923]">2,847</div>
                  <div className="text-xs font-semibold text-[#137333]">+218 this month</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-3 shadow-card">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Activation rate</span>
                  <div className="text-3xl font-display font-medium text-[#1E2923]">64%</div>
                  <div className="text-xs font-semibold text-[#137333]">+3 pts</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-3 shadow-card">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Paid conversion</span>
                  <div className="text-3xl font-display font-medium text-[#1E2923]">18.4%</div>
                  <div className="text-xs font-semibold text-[#A63326]">-0.7 pts</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-3 shadow-card">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">MRR</span>
                  <div className="text-3xl font-display font-medium text-[#1E2923]">₦18.2M</div>
                  <div className="text-xs font-semibold text-[#137333]">+11%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 space-y-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1E2923]">Signups and activations</h3>
                  </div>

                  <div className="h-52 w-full flex items-end justify-between pt-6 pb-2 px-2 gap-2 md:gap-4 border-b border-[#E8E8E2]">
                    {signupsBars.map((bar, index) => (
                      <div key={index} className="w-full flex items-end justify-center space-x-1 h-full">
                        <div className="w-1/2 bg-[#DCDCD6] rounded-t-sm" style={{ height: `${bar.signups}%` }}></div>
                        <div className="w-1/2 bg-[#183B28] rounded-t-sm" style={{ height: `${bar.activated}%` }}></div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-6 text-xs font-medium text-[#617065] pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-[2px] bg-[#DCDCD6]"></span>
                      <span>Signups</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-[2px] bg-[#183B28]"></span>
                      <span>Activated (completed onboarding)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-7 space-y-4 shadow-card">
                  <h3 className="text-sm font-bold text-[#1E2923]">Needs attention</h3>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('Support'); showToast('Opened Support section'); }}
                      className="w-full text-left bg-[#FDF0ED] hover:bg-[#FBE8E4] border border-[#F3D5CE] rounded-[24px] p-4 flex items-center justify-between transition-colors cursor-pointer group shadow-card"
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#A63326] text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
                        <span className="text-xs font-semibold text-[#A63326]">Support tickets open</span>
                      </div>
                      <ArrowUpRight size={16} className="text-[#A63326]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('Expert vetting'); showToast('Opened Expert vetting section'); }}
                      className="w-full text-left bg-[#F9F6EE] hover:bg-[#F4EEDE] border border-[#EEDFB8] rounded-[24px] p-4 flex items-center justify-between transition-colors cursor-pointer group shadow-card"
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#B39353] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                        <span className="text-xs font-semibold text-[#6B5A35]">Expert applications waiting</span>
                      </div>
                      <ArrowUpRight size={16} className="text-[#B39353]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WORKSPACES VIEW */}
          {activeTab === 'Workspaces' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">Workspaces</h2>

              <div className="bg-white border border-[#E8E8E2] rounded-[24px] overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                        <th className="py-4 px-6">Workspace</th>
                        <th className="py-4 px-6">Stage</th>
                        <th className="py-4 px-6">Seats</th>
                        <th className="py-4 px-6">Health</th>
                        <th className="py-4 px-6">Last active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                      {workspacesList.map((ws, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-4 px-6 flex items-center space-x-3.5">
                            <div className={`w-8 h-8 rounded-modal ${ws.initialBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-card`}>
                              {ws.initial}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1E2923]">{ws.name}</div>
                              <div className="text-[11px] text-[#8E9B90] font-normal">{ws.owner}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[#4A5550]">{ws.stage}</td>
                          <td className="py-4 px-6 text-[#4A5550]">{ws.seats}</td>
                          <td className={`py-4 px-6 font-bold ${ws.healthColor}`}>{ws.health}</td>
                          <td className="py-4 px-6 text-[#8E9B90]">{ws.lastActive}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS VIEW */}
          {activeTab === 'Users' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-display font-medium text-[#1E2923]">Users</h2>

                <div className="flex items-center space-x-2 bg-white border border-[#E8E8E2] p-1 rounded-full shadow-card">
                  {(['All', 'Active', 'Past due', 'Trialing'] as UserFilterTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setUserFilter(tab); showToast(`Filtered users by: ${tab}`); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        userFilter === tab 
                          ? 'bg-[#1E2923] text-white shadow-card' 
                          : 'text-[#617065] hover:text-[#1E2923]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E8E8E2] rounded-[24px] overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                        <th className="py-4 px-6">User</th>
                        <th className="py-4 px-6">Workspace</th>
                        <th className="py-4 px-6">Plan</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                      {filteredUsers.map((u, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-4 px-6 flex items-center space-x-3.5">
                            <div className={`w-8 h-8 rounded-modal ${u.initialBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-card`}>
                              {u.initial}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1E2923]">{u.name}</div>
                              <div className="text-[11px] text-[#8E9B90] font-normal">{u.email}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[#4A5550]">{u.workspace}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-input text-[11px] font-medium ${u.planBg}`}>
                              {u.plan}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-input text-[11px] font-medium ${u.statusBg}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              type="button"
                              onClick={() => showToast(`Opened profile for ${u.name}`)}
                              className="text-[#617065] hover:text-[#1E2923] font-semibold cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT VIEW */}
          {activeTab === 'Support' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center space-x-2 bg-white border border-[#E8E8E2] p-1 rounded-full w-fit shadow-card">
                {(['Open', 'Mine', 'Resolved'] as SupportTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setSupportTab(tab); showToast(`Switched support view to: ${tab}`); }}
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      supportTab === tab 
                        ? 'bg-[#1E2923] text-white shadow-card' 
                        : 'text-[#617065] hover:text-[#1E2923]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Master-Detail Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Ticket List Column */}
                <div className="lg:col-span-5 space-y-3">
                  {supportTickets.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`bg-white border rounded-[24px] p-5 space-y-3 transition-all cursor-pointer shadow-card ${
                          isSelected 
                            ? 'border-[#1E2923] ring-1 ring-[#1E2923]' 
                            : 'border-[#E8E8E2] hover:border-[#D0D0CA]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-input ${ticket.priorityBadgeBg}`}>
                            {ticket.priority}
                          </span>
                          <span className="text-xs font-bold text-[#8E9B90]">{ticket.ticketNumber}</span>
                        </div>

                        <h3 className="text-xs font-bold text-[#1E2923] leading-snug">
                          {ticket.title}
                        </h3>

                        <div className="text-[11px] text-[#8E9B90]">
                          {ticket.user} · {ticket.timeAgo}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Ticket Thread & Action Pane */}
                <div className="lg:col-span-7 bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 space-y-6 shadow-card">
                  
                  {/* Ticket Header Meta */}
                  <div className="space-y-2 border-b border-[#E8E8E2] pb-6">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-input ${activeTicket.priorityBadgeBg}`}>
                        {activeTicket.priority}
                      </span>
                      <span className="text-xs font-bold text-[#8E9B90]">{activeTicket.ticketNumber}</span>
                    </div>

                    <h2 className="text-xl font-display font-medium text-[#1E2923]">
                      {activeTicket.title}
                    </h2>

                    <div className="text-xs text-[#8E9B90]">
                      {activeTicket.user} · {activeTicket.workspace} · {activeTicket.plan}
                    </div>
                  </div>

                  {/* Customer Message Bubble */}
                  <div className="bg-[#F7F7F5] border border-[#E8E8E2] rounded-[24px] p-4 md:p-5 space-y-3 text-xs text-[#1E2923]">
                    <p className="leading-relaxed">{activeTicket.message}</p>
                    <div className="text-[10px] text-[#8E9B90] font-medium">
                      {activeTicket.user} · {activeTicket.timeAgo}
                    </div>
                  </div>

                  {/* Reply Input Box & Action Buttons */}
                  <div className="space-y-4 pt-2">
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full bg-[#F7F7F5] border border-[#E8E8E2] rounded-[24px] p-4 text-xs text-[#1E2923] focus:outline-none focus:border-[#B39353] resize-none"
                    ></textarea>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (!replyText.trim()) {
                            showToast('Please type a reply first.');
                            return;
                          }
                          showToast(`Reply sent for ticket ${activeTicket.ticketNumber}!`);
                          setReplyText('');
                        }}
                        className="bg-[#594B30] hover:bg-[#4A3E26] text-white px-5 py-2.5 rounded-modal text-xs font-semibold transition-colors shadow-card cursor-pointer"
                      >
                        Send reply
                      </button>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => showToast(`Ticket ${activeTicket.ticketNumber} marked as resolved.`)}
                          className="bg-white hover:bg-sage-50 text-[#1E2923] border border-[#E8E8E2] px-4 py-2.5 rounded-modal text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>

                        <button
                          type="button"
                          onClick={() => showToast(`Ticket ${activeTicket.ticketNumber} escalated.`)}
                          className="bg-white hover:bg-[#FDF0ED] text-[#A63326] border border-[#F3D5CE] px-4 py-2.5 rounded-modal text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* EXPERT VETTING VIEW */}
          {activeTab === 'Expert vetting' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-medium text-[#1E2923]">Expert applications</h2>
                <p className="text-xs text-[#8E9B90]">Every expert is vetted before they appear to founders.</p>
              </div>

              <div className="space-y-5">
                {experts.map((exp) => (
                  <div key={exp.id} className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-7 space-y-5 shadow-card relative overflow-hidden">
                    
                    {/* Top Info Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-modal ${exp.initialBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-card`}>
                          {exp.initial}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1E2923]">{exp.name}</h3>
                          <p className="text-xs text-[#8E9B90]">{exp.role} · {exp.location} · {exp.rate}</p>
                        </div>
                      </div>

                      {exp.status === 'Approved' ? (
                        <span className="bg-[#EBF5ED] text-[#137333] border border-[#D3EED8] text-xs font-semibold px-3.5 py-1 rounded-full w-fit">
                          Approved
                        </span>
                      ) : exp.status === 'Rejected' ? (
                        <span className="bg-[#FDF0ED] text-[#A63326] border border-[#F3D5CE] text-xs font-semibold px-3.5 py-1 rounded-full w-fit">
                          Rejected
                        </span>
                      ) : null}
                    </div>

                    {/* Bio Description */}
                    <p className="text-xs text-[#1E2923] leading-relaxed max-w-4xl">
                      {exp.bio}
                    </p>

                    {/* Verification Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {exp.tags.map((tag, idx) => {
                        const isSuccess = tag.type === 'success';
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-input text-[11px] font-medium border ${
                              isSuccess 
                                ? 'bg-[#F2F7F4] text-[#183B28] border-[#D8E6DE]' 
                                : 'bg-[#FCF8EE] text-[#7A6124] border-[#EFE3BE]'
                            }`}
                          >
                            <span>{isSuccess ? '✓' : '!'}</span>
                            <span>{tag.text}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    {exp.status === 'Pending' && (
                      <div className="flex items-center space-x-3 pt-2 border-t border-[#F0F0EC]">
                        <button
                          type="button"
                          onClick={() => handleUpdateExpertStatus(exp.id, 'Approved')}
                          className="bg-[#183B28] hover:bg-[#12291F] text-white px-5 py-2 rounded-modal text-xs font-semibold transition-colors cursor-pointer shadow-card"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateExpertStatus(exp.id, 'Rejected')}
                          className="bg-white hover:bg-[#FDF0ED] text-[#A63326] border border-[#E8E8E2] px-5 py-2 rounded-modal text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => showToast(`Requested more info from ${exp.name}`)}
                          className="bg-white hover:bg-sage-50 text-[#1E2923] border border-[#E8E8E2] px-5 py-2 rounded-modal text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Request more info
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTENT LIBRARY VIEW */}
          {activeTab === 'Content library' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">Content library</h2>

              <div className="bg-white border border-[#E8E8E2] rounded-[24px] overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                        <th className="py-4 px-6">Item</th>
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6">Stage</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                      {contentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-4 px-6 font-semibold text-[#1E2923]">{item.title}</td>
                          <td className="py-4 px-6 text-[#617065]">{item.type}</td>
                          <td className="py-4 px-6 text-[#617065]">{item.stage}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-input text-[11px] font-medium ${item.statusBg}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => showToast(`Editing content item: ${item.title}`)}
                              className="text-[#617065] hover:text-[#1E2923] font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}