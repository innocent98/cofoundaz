'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Flag, 
  Sliders, 
  Users, 
  Boxes, 
  Shield, 
  AlertTriangle, 
  ChevronDown 
} from 'lucide-react';

type SuperAdminTab = 
  | 'Overview' 
  | 'Feature flags' 
  | 'AI configuration' 
  | 'Staff access' 
  | 'Tenant operations' 
  | 'Security' 
  | 'Danger zone';

interface FeatureFlag {
  id: string;
  name: string;
  badge: string;
  badgeType: 'beta' | 'ga' | 'internal';
  description: string;
  enabled: boolean;
  percentage: number;
}

interface AIModelConfig {
  surface: string;
  model: string;
  credits: number;
  latency: string;
}

interface StaffMember {
  name: string;
  email: string;
  initial: string;
  initialBg: string;
  role: string;
  roleBg: string;
  mfa: string;
  lastAccess: string;
}

interface TenantWorkspace {
  name: string;
  region: string;
  residency: string;
  storage: string;
  status: 'Active' | 'Dormant' | 'Suspended';
}

interface AuditLogEntry {
  actor: string;
  action: string;
  actionBg: string;
  target: string;
  when: string;
}

interface DangerAction {
  title: string;
  description: string;
  buttonText: string;
  modalTitle: string;
  modalDescription: string;
  blastRadius: string;
}

export default function SuperAdminDashboard(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('Danger zone');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Configuration Dropdown State
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState<boolean>(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('Balanced tier');

  // Danger Zone Modal State
  const [activeModalAction, setActiveModalAction] = useState<DangerAction | null>(null);
  const [reasonText, setReasonText] = useState<string>('');
  const [selectedApprover, setSelectedApprover] = useState<string>('Ope Adeyemi (CEO)');

  // Feature Flags State
  const [features, setFeatures] = useState<FeatureFlag[]>([
    {
      id: 'ff-1',
      name: 'AI voice notes',
      badge: 'Beta',
      badgeType: 'beta',
      description: 'Dictate journal entries and mission updates.',
      enabled: true,
      percentage: 25,
    },
    {
      id: 'ff-2',
      name: 'Grant matching',
      badge: 'GA',
      badgeType: 'ga',
      description: 'AI fit scoring against a grant database.',
      enabled: true,
      percentage: 100,
    },
    {
      id: 'ff-3',
      name: 'Roadmap Kanban v2',
      badge: 'Internal',
      badgeType: 'internal',
      description: 'Rebuilt board with swimlanes and WIP limits.',
      enabled: false,
      percentage: 0,
    },
    {
      id: 'ff-4',
      name: 'Cohort benchmarks',
      badge: 'Beta',
      badgeType: 'beta',
      description: 'Anonymized peer comparison in Analytics.',
      enabled: true,
      percentage: 50,
    },
    {
      id: 'ff-5',
      name: 'Expert marketplace',
      badge: 'GA',
      badgeType: 'ga',
      description: 'Human experts, bookings, and escrow.',
      enabled: true,
      percentage: 100,
    },
    {
      id: 'ff-6',
      name: 'Journal reflections',
      badge: 'Internal',
      badgeType: 'internal',
      description: 'AI patterns drawn from journal entries.',
      enabled: false,
      percentage: 0,
    },
  ]);

  // Security Toggles State
  const [securityToggles, setSecurityToggles] = useState({
    requireMfa: true,
    ipAllowlist: false,
    capSessions: true,
    alertAnomalous: true,
    founderExport: true,
  });

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleFeature = (id: string): void => {
    setFeatures(prev => prev.map(f => {
      if (f.id === id) {
        const nextEnabled = !f.enabled;
        return {
          ...f,
          enabled: nextEnabled,
          percentage: nextEnabled ? (f.percentage === 0 ? 25 : f.percentage) : 0
        };
      }
      return f;
    }));
    showToast('Feature flag updated successfully.');
  };

  const handleSetPercentage = (id: string, pct: number): void => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, percentage: pct, enabled: pct > 0 } : f));
    showToast(`Rollout set to ${pct}%`);
  };

  // Static Data
  const recentPrivilegedActions = [
    { action: 'Rolled AI voice notes to 25% of workspaces', actor: 'Lena Cho · 2h ago', type: 'badge' },
    { action: 'Rotated the document store encryption key', actor: 'Lena Cho · Yesterday', type: 'key' },
    { action: 'Granted support admin role to Marcus Reyes', actor: 'Ope Adeyemi · 3d ago', type: 'role' },
    { action: 'Revoked staff access for a departing contractor', actor: 'Lena Cho · 1w ago', type: 'revoke' },
  ];

  const aiSurfaces: AIModelConfig[] = [
    { surface: 'AI Co-Founder chat', model: selectedAiModel, credits: 5, latency: '1.2s' },
    { surface: 'Business plan generation', model: 'Reasoning tier', credits: 550, latency: '48s' },
    { surface: 'Contract review', model: 'Reasoning tier', credits: 80, latency: '12s' },
    { surface: 'Marketing copy', model: 'Fast tier', credits: 12, latency: '0.8s' },
    { surface: 'Deck analysis', model: 'Reasoning tier', credits: 100, latency: '22s' },
    { surface: 'Daily mission ranking', model: 'Fast tier', credits: 2, latency: '4.2s' },
  ];

  const staffMembers: StaffMember[] = [
    { name: 'Lena Cho', email: 'lena@cofoundaz.com', initial: 'LC', initialBg: 'bg-[#B34024]', role: 'Super admin', roleBg: 'bg-[#FDF0ED] text-[#A63326]', mfa: 'Hardware key', lastAccess: 'Now' },
    { name: 'Ope Adeyemi', email: 'ope@cofoundaz.com', initial: 'OA', initialBg: 'bg-[#B34024]', role: 'Super admin', roleBg: 'bg-[#FDF0ED] text-[#A63326]', mfa: 'Hardware key', lastAccess: '2h ago' },
    { name: 'Marcus Reyes', email: 'marcus@cofoundaz.com', initial: 'MR', initialBg: 'bg-[#594B30]', role: 'Support admin', roleBg: 'bg-[#F9F6EE] text-[#8C6D28]', mfa: 'Authenticator', lastAccess: '18 min ago' },
    { name: 'Sara Bello', email: 'sara@cofoundaz.com', initial: 'SB', initialBg: 'bg-[#183B28]', role: 'Content admin', roleBg: 'bg-[#EBF5ED] text-[#137333]', mfa: 'Authenticator', lastAccess: 'Yesterday' },
    { name: 'Tomi Williams', email: 'tomi@cofoundaz.com', initial: 'TW', initialBg: 'bg-[#594B30]', role: 'Support admin', roleBg: 'bg-[#F9F6EE] text-[#8C6D28]', mfa: 'Not enrolled', lastAccess: '3d ago' },
  ];

  const tenantWorkspaces: TenantWorkspace[] = [
    { name: 'Kolo', region: 'af-west-1', residency: 'Nigeria', storage: '2.1 GB', status: 'Active' },
    { name: 'Payflow', region: 'af-west-1', residency: 'Nigeria', storage: '8.4 GB', status: 'Active' },
    { name: 'Shamba', region: 'af-east-1', residency: 'Kenya', storage: '640 MB', status: 'Active' },
    { name: 'Tradeline', region: 'af-west-1', residency: 'Nigeria', storage: '3.2 GB', status: 'Active' },
    { name: 'Sendly', region: 'af-west-1', residency: 'Ghana', storage: '180 MB', status: 'Dormant' },
    { name: 'BodaCare', region: 'af-east-1', residency: 'Kenya', storage: '5.6 GB', status: 'Suspended' },
  ];

  const auditLogs: AuditLogEntry[] = [
    { actor: 'Lena Cho', action: 'Flag change', actionBg: 'bg-[#F9F6EE] text-[#8C6D28]', target: 'AI voice notes → 25%', when: 'Today 08:12' },
    { actor: 'Lena Cho', action: 'Key rotation', actionBg: 'bg-[#FDF0ED] text-[#A63326]', target: 'Document store master key', when: 'Yesterday 22:40' },
    { actor: 'Ope Adeyemi', action: 'Role grant', actionBg: 'bg-[#EBF5ED] text-[#137333]', target: 'Marcus Reyes → Support admin', when: 'Jul 24 10:15' },
    { actor: 'System', action: 'Policy enforced', actionBg: 'bg-[#EBF5ED] text-[#137333]', target: 'MFA required, 1 staff blocked', when: 'Jul 23 09:00' },
    { actor: 'Lena Cho', action: 'Access revoked', actionBg: 'bg-[#FDF0ED] text-[#A63326]', target: 'contractor@vendor.io', when: 'Jul 20 17:32' },
    { actor: 'Marcus Reyes', action: 'Credit grant', actionBg: 'bg-[#EBF5ED] text-[#137333]', target: 'Payflow · 2,000 credits', when: 'Jul 19 14:08' },
  ];

  const dangerActions: DangerAction[] = [
    { 
      title: 'Enable maintenance mode', 
      description: 'Puts every workspace into read-only and shows founders a status message.', 
      buttonText: 'Enable',
      modalTitle: 'Enable maintenance mode?',
      modalDescription: 'All 2,847 workspaces become read-only immediately. Founders mid-task will lose unsaved work.',
      blastRadius: 'Every workspace on the platform'
    },
    { 
      title: 'Force global sign-out', 
      description: 'Terminates every active session, founders and staff alike. Used during a suspected credential breach.', 
      buttonText: 'Sign out all',
      modalTitle: 'Force a global sign-out?',
      modalDescription: 'Every user on the platform is signed out and must re-authenticate. Use this only during a security incident.',
      blastRadius: 'All users, all sessions'
    },
    { 
      title: 'Rotate all encryption keys', 
      description: 'Re-encrypts document storage with new keys. Runs for roughly four hours in the background.', 
      buttonText: 'Rotate',
      modalTitle: 'Rotate all encryption keys?',
      modalDescription: 'Initiates a cluster-wide key rotation for all tenant document stores. Background encryption jobs will run for several hours.',
      blastRadius: 'Document storage encryption keys'
    },
    { 
      title: 'Purge deleted workspaces', 
      description: 'Permanently destroys 14 workspaces past their 90-day retention window. Irreversible.', 
      buttonText: 'Purge now',
      modalTitle: 'Purge deleted workspaces?',
      modalDescription: 'Permanently erases all database records and file storage for workspaces past their 90-day soft-delete retention window. This cannot be undone.',
      blastRadius: '14 marked workspaces'
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1E2923] font-sans antialiased flex relative selection:bg-[#EAD5C6]">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#121413] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-sm font-medium border border-[#2A2E2C]">
          <span className="w-4 h-4 rounded-full bg-[#1C4230] flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DANGER ZONE APPROVAL MODAL */}
      {activeModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121413]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E2] rounded-3xl max-w-lg w-full p-7 space-y-6 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-start space-x-4">
              <div className="w-9 h-9 rounded-2xl bg-[#FDF0ED] text-[#A63326] flex items-center justify-center font-bold text-base shrink-0 border border-[#F3D5CE]">
                !
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-medium text-[#1E2923]">{activeModalAction.modalTitle}</h3>
                <p className="text-xs text-[#8E9B90] leading-relaxed">{activeModalAction.modalDescription}</p>
              </div>
            </div>

            {/* Blast Radius Box */}
            <div className="bg-[#F7F7F5] border border-[#E8E8E2] rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Blast radius</span>
              <div className="text-xs font-bold text-[#A63326]">{activeModalAction.blastRadius}</div>
            </div>

            {/* Reason input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1E2923] block">
                Reason (required, permanently logged)
              </label>
              <input
                type="text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Why is this necessary?"
                className="w-full bg-white border border-[#E8E8E2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2923] focus:outline-none focus:border-[#B34024] transition-colors"
              />
            </div>

            {/* Second Approver select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1E2923] block">
                Second approver
              </label>
              <div className="relative">
                <select
                  value={selectedApprover}
                  onChange={(e) => setSelectedApprover(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2923] focus:outline-none focus:border-[#B34024] appearance-none cursor-pointer"
                >
                  <option value="Ope Adeyemi (CEO)">Ope Adeyemi (CEO)</option>
                  <option value="Marcus Reyes (Support Lead)">Marcus Reyes (Support Lead)</option>
                  <option value="Sara Bello (Content Lead)">Sara Bello (Content Lead)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E9B90] pointer-events-none" />
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setActiveModalAction(null); setReasonText(''); }}
                className="py-2.5 rounded-xl text-xs font-semibold border border-[#E8E8E2] text-[#1E2923] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`Approval requested for: ${activeModalAction.title}`);
                  setActiveModalAction(null);
                  setReasonText('');
                }}
                className="py-2.5 rounded-xl text-xs font-semibold bg-[#D59A8D] hover:bg-[#C98A7D] text-white transition-colors cursor-pointer shadow-xs"
              >
                Request approval
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#121413] text-[#A3A8A4] flex flex-col justify-between shrink-0 select-none border-r border-[#1E2220]">
        
        {/* Top Header & Links */}
        <div className="p-6 space-y-8">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#B34024] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-white font-serif font-medium text-base tracking-tight leading-none">Cofoundaz</h1>
              <span className="text-[10px] font-bold tracking-widest text-[#B34024] uppercase">SUPER ADMIN</span>
            </div>
          </div>

          {/* Nav Categories */}
          <div className="space-y-6">
            
            {/* PLATFORM */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686D6A] px-3">Platform</span>
              
              <button
                type="button"
                onClick={() => { setActiveTab('Overview'); showToast('Switched to Overview'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Overview' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} className={activeTab === 'Overview' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('Feature flags'); showToast('Switched to Feature flags'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Feature flags' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Flag size={16} className={activeTab === 'Feature flags' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>Feature flags</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('AI configuration'); showToast('Switched to AI configuration'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'AI configuration' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Sliders size={16} className={activeTab === 'AI configuration' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>AI configuration</span>
              </button>
            </div>

            {/* GOVERNANCE */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686D6A] px-3">Governance</span>
              
              <button
                type="button"
                onClick={() => { setActiveTab('Staff access'); showToast('Switched to Staff access'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Staff access' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Users size={16} className={activeTab === 'Staff access' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>Staff access</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('Tenant operations'); showToast('Switched to Tenant operations'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Tenant operations' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Boxes size={16} className={activeTab === 'Tenant operations' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>Tenant operations</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('Security'); showToast('Switched to Security'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Security' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <Shield size={16} className={activeTab === 'Security' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>Security</span>
              </button>
            </div>

            {/* CRITICAL */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686D6A] px-3">Critical</span>
              
              <button
                type="button"
                onClick={() => { setActiveTab('Danger zone'); showToast('Switched to Danger zone'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Danger zone' ? 'bg-[#1C211F] text-white font-semibold' : 'hover:bg-[#181C1A] hover:text-white'
                }`}
              >
                <AlertTriangle size={16} className={activeTab === 'Danger zone' ? 'text-[#B34024]' : 'text-[#8E9B90]'} />
                <span>Danger zone</span>
              </button>
            </div>

          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#1E2220] flex items-center justify-between bg-[#101211]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#B34024] text-white font-bold text-xs flex items-center justify-center shrink-0">
              LC
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-xs font-semibold truncate">Lena Cho</div>
              <div className="text-[10px] text-[#7A8580] truncate">Super admin · CTO</div>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-[#E8E8E2] px-8 py-3.5 flex items-center justify-between bg-white w-full">
          <div className="flex items-center space-x-2 text-sm sm:text-base font-semibold tracking-tight">
            <span className="text-[#617065] font-normal">Super admin</span>
            <span className="text-[#8E9B90] font-normal">/</span>
            <span className="text-[#1E2923] font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-[#FDF0ED] text-[#A63326] border border-[#F3D5CE] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#A63326]"></span>
              <span>Full access · session ends in 42 min</span>
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto overflow-y-auto">

          {/* 1. OVERVIEW VIEW */}
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-medium text-[#1E2923]">Platform control</h2>
                <p className="text-xs text-[#8E9B90]">Everything below applies across all 2,847 workspaces.</p>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Workspaces</span>
                  <div className="text-3xl font-serif font-medium text-[#1E2923]">2,847</div>
                  <div className="text-xs text-[#8E9B90]">across 4 regions</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Uptime, 30d</span>
                  <div className="text-3xl font-serif font-medium text-[#1E2923]">99.97%</div>
                  <div className="text-xs font-semibold text-[#137333]">within SLA</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">AI spend, MTD</span>
                  <div className="text-3xl font-serif font-medium text-[#1E2923]">$18.4K</div>
                  <div className="text-xs text-[#8E9B90]">74% of budget</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Open incidents</span>
                  <div className="text-3xl font-serif font-medium text-[#1E2923]">1</div>
                  <div className="text-xs font-semibold text-[#A63326]">AI gateway degraded</div>
                </div>
              </div>

              {/* Infrastructure & Recent Privileged Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Infrastructure Box */}
                <div className="lg:col-span-7 bg-white border border-[#E8E8E2] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-[#1E2923]">Infrastructure</h3>

                  <div className="space-y-4 text-xs font-medium text-[#1E2923]">
                    <div className="flex items-center justify-between py-2 border-b border-[#F0F0EC]">
                      <div className="flex items-center space-x-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
                        <span>API cluster</span>
                      </div>
                      <span className="text-[#8E9B90] font-normal">142ms p95</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-[#F0F0EC]">
                      <div className="flex items-center space-x-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B39353]"></span>
                        <span>AI gateway</span>
                      </div>
                      <span className="text-[#B39353] font-semibold">Degraded · 4.2s p95</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-[#F0F0EC]">
                      <div className="flex items-center space-x-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
                        <span>Primary database</span>
                      </div>
                      <span className="text-[#8E9B90] font-normal">18% capacity</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-[#F0F0EC]">
                      <div className="flex items-center space-x-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
                        <span>Document store</span>
                      </div>
                      <span className="text-[#8E9B90] font-normal">2.4 TB used</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
                        <span>Background jobs</span>
                      </div>
                      <span className="text-[#8E9B90] font-normal">312 queued</span>
                    </div>
                  </div>
                </div>

                {/* Recent Privileged Actions Box */}
                <div className="lg:col-span-5 bg-white border border-[#E8E8E2] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-[#1E2923]">Recent privileged actions</h3>

                  <div className="space-y-4">
                    {recentPrivilegedActions.map((act, i) => (
                      <div key={i} className="flex items-start space-x-3 pb-3 border-b border-[#F0F0EC] last:border-0 last:pb-0">
                        <div className="w-6 h-6 rounded-lg bg-[#F7F7F5] border border-[#E8E8E2] flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {act.type === 'badge' ? '⚑' : act.type === 'key' ? '§' : act.type === 'role' ? '≡' : '✕'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E2923] leading-snug">{act.action}</div>
                          <div className="text-[11px] text-[#8E9B90] mt-0.5">{act.actor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. FEATURE FLAGS VIEW */}
          {activeTab === 'Feature flags' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-medium text-[#1E2923]">Feature flags</h2>
                <p className="text-xs text-[#8E9B90]">Ship carefully. Percentages roll out to a stable hash of workspace ID.</p>
              </div>

              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.id} className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-4 shadow-xs">
                    
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-bold text-[#1E2923]">{feature.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          feature.badgeType === 'beta' ? 'bg-[#F9F6EE] text-[#8C6D28]' :
                          feature.badgeType === 'ga' ? 'bg-[#EBF5ED] text-[#137333]' : 'bg-[#EFEFEA] text-[#7A8580]'
                        }`}>
                          {feature.badge}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-[#617065]">
                          {feature.enabled ? `${feature.percentage}%` : 'Off'}
                        </span>
                        
                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(feature.id)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            feature.enabled ? 'bg-[#183B28]' : 'bg-[#D0D0CA]'
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            feature.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#8E9B90]">{feature.description}</p>

                    {/* Percentage buttons */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {[0, 5, 25, 50, 100].map((pct) => {
                        const isSelected = feature.enabled && feature.percentage === pct;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleSetPercentage(feature.id, pct)}
                            className={`py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-[#183B28] text-white border-[#183B28] shadow-xs' 
                                : 'bg-white text-[#1E2923] border-[#E8E8E2] hover:bg-[#FAFAF8]'
                            }`}
                          >
                            {pct}%
                          </button>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. AI CONFIGURATION VIEW */}
          {activeTab === 'AI configuration' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-medium text-[#1E2923]">AI configuration</h2>
                <p className="text-xs text-[#8E9B90]">Model routing and cost controls for every AI surface in the product.</p>
              </div>

              {/* Surfaces Table */}
              <div className="bg-white border border-[#E8E8E2] rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                        <th className="py-4 px-6">Surface</th>
                        <th className="py-4 px-6">Model</th>
                        <th className="py-4 px-6">Credits / run</th>
                        <th className="py-4 px-6">Avg latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                      {aiSurfaces.map((item, index) => (
                        <tr key={index} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-4 px-6 font-semibold text-[#1E2923]">{item.surface}</td>
                          <td className="py-4 px-6 relative">
                            {index === 0 ? (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setIsAiDropdownOpen(!isAiDropdownOpen)}
                                  className="w-full max-w-xs bg-white border border-[#B39353] rounded-xl px-3.5 py-2 text-xs font-medium text-[#1E2923] flex items-center justify-between shadow-xs cursor-pointer focus:outline-none"
                                >
                                  <span>{selectedAiModel}</span>
                                  <ChevronDown size={14} className="text-[#8E9B90]" />
                                </button>

                                {isAiDropdownOpen && (
                                  <div className="absolute top-full left-0 mt-1 w-full max-w-xs bg-white border border-[#E8E8E2] rounded-xl shadow-lg z-30 overflow-hidden">
                                    {['Balanced tier', 'Fast tier', 'Reasoning tier'].map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { setSelectedAiModel(opt); setIsAiDropdownOpen(false); showToast(`Model set to ${opt}`); }}
                                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                                          selectedAiModel === opt ? 'bg-[#1E2923] text-white font-semibold' : 'hover:bg-[#F7F7F5] text-[#1E2923]'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-[#F7F7F5] border border-[#E8E8E2] rounded-xl px-3.5 py-2 w-full max-w-xs flex items-center justify-between text-[#1E2923]">
                                <span>{item.model}</span>
                                <ChevronDown size={14} className="text-[#8E9B90]" />
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-[#1E2923] font-bold">{item.credits}</td>
                          <td className="py-4 px-6 text-[#A63326] font-medium">{item.latency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Guardrails & Spend Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Guardrails Card */}
                <div className="lg:col-span-7 bg-white border border-[#E8E8E2] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[#1E2923]">Guardrails</h3>

                  <div className="space-y-5">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#1E2923]">Strip PII before model calls</div>
                        <div className="text-[11px] text-[#8E9B90]">Redact identifiers from prompts in transit.</div>
                      </div>
                      <div className="w-11 h-6 flex items-center bg-[#183B28] rounded-full p-1 cursor-pointer">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#1E2923]">Never send workspace data for training</div>
                        <div className="text-[11px] text-[#8E9B90]">Enforced at the gateway, not by policy alone.</div>
                      </div>
                      <div className="w-11 h-6 flex items-center bg-[#183B28] rounded-full p-1 cursor-pointer">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#1E2923]">Force disclaimers on legal and finance output</div>
                        <div className="text-[11px] text-[#8E9B90]">Cannot be disabled per workspace.</div>
                      </div>
                      <div className="w-11 h-6 flex items-center bg-[#183B28] rounded-full p-1 cursor-pointer">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#1E2923]">Prompt-injection filtering</div>
                        <div className="text-[11px] text-[#8E9B90]">Screens uploaded documents before processing.</div>
                      </div>
                      <div className="w-11 h-6 flex items-center bg-[#183B28] rounded-full p-1 cursor-pointer">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-5" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Spend this month Card */}
                <div className="lg:col-span-5 bg-white border border-[#E8E8E2] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-[#1E2923]">Spend this month</h3>

                  <div className="space-y-2">
                    <div className="text-3xl font-serif font-medium text-[#1E2923]">$18,420</div>
                    <div className="text-[11px] text-[#8E9B90]">of $25,000 budget</div>
                  </div>

                  <div className="w-full bg-[#EFEFEA] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#B39353] h-full rounded-full w-[74%]"></div>
                  </div>

                  <p className="text-xs text-[#617065] leading-relaxed pt-2">
                    Plan generation is 41% of spend on 3% of runs. Worth routing its outline pass to the fast tier.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* 4. STAFF ACCESS VIEW */}
          {activeTab === 'Staff access' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-serif font-medium text-[#1E2923]">Staff access</h2>

                <button
                  type="button"
                  onClick={() => showToast('Opened add staff member modal')}
                  className="bg-[#B34024] hover:bg-[#9E351C] text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer w-fit"
                >
                  + Add staff member
                </button>
              </div>

              {/* Staff Table */}
              <div className="bg-white border border-[#E8E8E2] rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                        <th className="py-4 px-6">Staff member</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">MFA</th>
                        <th className="py-4 px-6">Last access</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                      {staffMembers.map((staff, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-4 px-6 flex items-center space-x-3.5">
                            <div className={`w-8 h-8 rounded-xl ${staff.initialBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                              {staff.initial}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1E2923]">{staff.name}</div>
                              <div className="text-[11px] text-[#8E9B90] font-normal">{staff.email}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${staff.roleBg}`}>
                              {staff.role}
                            </span>
                          </td>
                          <td className={`py-4 px-6 font-medium ${staff.mfa === 'Not enrolled' ? 'text-[#A63326]' : 'text-[#4A5550]'}`}>
                            {staff.mfa}
                          </td>
                          <td className="py-4 px-6 text-[#8E9B90]">{staff.lastAccess}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => showToast(`Revoked access for ${staff.name}`)}
                              className="text-[#A63326] hover:text-[#80251A] font-semibold cursor-pointer"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Info Banner */}
              <div className="bg-[#F9F6EE] border border-[#EEDFB8] rounded-2xl p-4 text-xs text-[#6B5A35] font-medium">
                No staff role, including super admin, can read workspace documents or the Founder Journal. That boundary is enforced in the data layer, not in this UI.
              </div>
            </div>
          )}

          {/* 5. TENANT OPERATIONS VIEW */}
          {activeTab === 'Tenant operations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-medium text-[#1E2923]">Tenant operations</h2>
                <p className="text-xs text-[#8E9B90]">Region, data residency, and lifecycle for individual workspaces.</p>
              </div>

              <div className="bg-white border border-[#E8E8E2] rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                        <th className="py-4 px-6">Workspace</th>
                        <th className="py-4 px-6">Region</th>
                        <th className="py-4 px-6">Data residency</th>
                        <th className="py-4 px-6">Storage</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                      {tenantWorkspaces.map((t, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-4 px-6 font-semibold text-[#1E2923]">{t.name}</td>
                          <td className="py-4 px-6 text-[#617065]">{t.region}</td>
                          <td className="py-4 px-6 text-[#617065]">{t.residency}</td>
                          <td className="py-4 px-6 text-[#617065]">{t.storage}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium ${
                              t.status === 'Active' ? 'bg-[#EBF5ED] text-[#137333]' :
                              t.status === 'Dormant' ? 'bg-[#EFEFEA] text-[#7A8580]' : 'bg-[#FDF0ED] text-[#A63326]'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. SECURITY VIEW */}
          {activeTab === 'Security' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Failed logins, 24h</span>
                  <div className="text-3xl font-serif font-medium text-[#1E2923]">38</div>
                  <div className="text-xs text-[#8E9B90]">no pattern detected</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Staff without MFA</span>
                  <div className="text-3xl font-serif font-medium text-[#A63326]">1</div>
                  <div className="text-xs text-[#1E2923]">Tomi Williams</div>
                </div>

                <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Last penetration test</span>
                  <div className="text-3xl font-serif font-medium text-[#1E2923]">May 2026</div>
                  <div className="text-xs text-[#137333]">no criticals</div>
                </div>
              </div>

              {/* Security Toggles Card */}
              <div className="bg-white border border-[#E8E8E2] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
                
                <div className="space-y-5">
                  
                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1E2923]">Require MFA for all staff</div>
                      <div className="text-[11px] text-[#8E9B90]">Blocks portal access until enrolled.</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSecurityToggles(p => ({...p, requireMfa: !p.requireMfa}))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${securityToggles.requireMfa ? 'bg-[#183B28]' : 'bg-[#D0D0CA]'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${securityToggles.requireMfa ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1E2923]">IP allowlist for admin portals</div>
                      <div className="text-[11px] text-[#8E9B90]">Restrict staff access to office and VPN ranges.</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSecurityToggles(p => ({...p, ipAllowlist: !p.ipAllowlist}))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${securityToggles.ipAllowlist ? 'bg-[#183B28]' : 'bg-[#D0D0CA]'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${securityToggles.ipAllowlist ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1E2923]">Cap super admin sessions at 60 minutes</div>
                      <div className="text-[11px] text-[#8E9B90]">Re-authentication required after expiry.</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSecurityToggles(p => ({...p, capSessions: !p.capSessions}))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${securityToggles.capSessions ? 'bg-[#183B28]' : 'bg-[#D0D0CA]'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${securityToggles.capSessions ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EC]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1E2923]">Alert on anomalous data access</div>
                      <div className="text-[11px] text-[#8E9B90]">Pages on-call for unusual export volume.</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSecurityToggles(p => ({...p, alertAnomalous: !p.alertAnomalous}))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${securityToggles.alertAnomalous ? 'bg-[#183B28]' : 'bg-[#D0D0CA]'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${securityToggles.alertAnomalous ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1E2923]">Allow founder self-serve data export</div>
                      <div className="text-[11px] text-[#8E9B90]">Founders can export their workspace any time.</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSecurityToggles(p => ({...p, founderExport: !p.founderExport}))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${securityToggles.founderExport ? 'bg-[#183B28]' : 'bg-[#D0D0CA]'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${securityToggles.founderExport ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                </div>

              </div>

              {/* Global Audit Log */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#1E2923]">Global audit log</h3>

                <div className="bg-white border border-[#E8E8E2] rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E8E8E2] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]">
                          <th className="py-4 px-6">Actor</th>
                          <th className="py-4 px-6">Action</th>
                          <th className="py-4 px-6">Target</th>
                          <th className="py-4 px-6">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8E2] text-xs font-medium text-[#1E2923]">
                        {auditLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-4 px-6 font-semibold text-[#1E2923]">{log.actor}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium ${log.actionBg}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-[#617065]">{log.target}</td>
                            <td className="py-4 px-6 text-[#8E9B90]">{log.when}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 7. DANGER ZONE VIEW */}
          {activeTab === 'Danger zone' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-medium text-[#A63326]">Danger zone</h2>
                <p className="text-xs text-[#8E9B90]">These actions affect every workspace on the platform. Each requires a second super admin to approve.</p>
              </div>

              <div className="space-y-4">
                {dangerActions.map((danger, index) => (
                  <div key={index} className="bg-white border border-[#F3D5CE] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1 max-w-2xl">
                      <h3 className="text-sm font-bold text-[#1E2923]">{danger.title}</h3>
                      <p className="text-xs text-[#8E9B90] leading-relaxed">{danger.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveModalAction(danger)}
                      className="bg-white hover:bg-[#FDF0ED] text-[#A63326] border border-[#F3D5CE] px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      {danger.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}