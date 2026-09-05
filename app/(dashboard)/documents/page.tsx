'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context'; 
import { 
  Bell,
  Plus,
  Menu,
  Sparkles,
  X,
  FileText,
  Search,
  Check,
  FileSpreadsheet,
  Mail,
  FileCode,
  DollarSign,
  Briefcase,
  Layers,
  Settings,
  List,
  Grid as GridIcon,
  ChevronRight
} from 'lucide-react';

// --- TYPESCRIPT INTERFACES ---
type DocumentSubTab = 'Library' | 'Document' | 'Templates' | 'Signatures' | 'Shared';

interface VersionHistoryItem {
  version: string;
  description: string;
  author: string;
  date: string;
}

interface SharedUserItem {
  name: string;
  initials: string;
  role: string;
  permission: 'Can comment' | 'Can edit' | 'Can view';
}

interface LibraryItem {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'PPT';
  category: string;
  owner: string;
  modified: string;
  status: string;
  aiGenerated?: boolean;
}

interface SignatureRequestItem {
  title: string;
  meta: string;
  status: 'Awaiting' | 'Complete' | 'Expired';
  actionText: string;
  signers: { name: string; signed: boolean }[];
}

interface SharedListItem {
  document: string;
  sharedWith: string;
  access: 'View' | 'Edit' | 'Comment';
  lastViewed: string;
}

interface TemplateCardItem {
  title: string;
  description: string;
  category: 'BUSINESS' | 'FUNDRAISING' | 'FINANCE' | 'OPERATIONS';
  icon: React.ReactNode;
}

// --- MOCK DATA ---
const VERSION_HISTORY: VersionHistoryItem[] = [
  { version: 'v4', description: 'Narrowed the non-compete to 12 months, Lagos only.', author: 'Amara', date: '2h ago' },
  { version: 'v3', description: 'Legal advisor comments applied.', author: 'Tayo N.', date: 'Yesterday' },
  { version: 'v2', description: 'AI contract review findings addressed.', author: 'Amara', date: '3d ago' },
  { version: 'v1', description: 'Created from the contractor agreement template.', author: 'Amara', date: '5d ago' },
];

const SHARED_USERS: SharedUserItem[] = [
  { name: 'Tayo Nwachukwu', initials: 'TN', role: 'legal advisor', permission: 'Can comment' },
  { name: 'Daniel Kariuki', initials: 'DK', role: 'co-founder', permission: 'Can edit' },
  { name: 'Grace Adeyemi', initials: 'GA', role: 'accountant', permission: 'Can view' },
];

const LIBRARY_DOCS: LibraryItem[] = [
  { id: '1', title: 'Contractor agreement, Tayo review', type: 'PDF', category: 'Legal', owner: 'Amara', modified: '2h ago', status: 'Awaiting signature' },
  { id: '2', title: 'Kolo business plan', type: 'DOC', category: 'Corporate', owner: 'Amara', modified: 'Yesterday', status: 'Final', aiGenerated: true },
  { id: '3', title: 'Financial model, 36 months', type: 'XLS', category: 'Financials', owner: 'Grace', modified: '3d ago', status: 'Final', aiGenerated: true },
  { id: '4', title: 'Pre-seed deck v3', type: 'PPT', category: 'Fundraising', owner: 'Amara', modified: '4d ago', status: 'Draft' },
  { id: '5', title: 'Mutual NDA, Thrive SACCO', type: 'PDF', category: 'Legal', owner: 'Amara', modified: '1w ago', status: 'Signed' },
  { id: '6', title: 'Brand positioning statement', type: 'DOC', category: 'Marketing', owner: 'Amara', modified: '2w ago', status: 'Final', aiGenerated: true },
];

const INITIAL_SIGNATURE_REQUESTS: SignatureRequestItem[] = [
  {
    title: 'Contractor agreement, Chidi A.',
    meta: 'Sent Jul 24 • 1 of 2 signed',
    status: 'Awaiting',
    actionText: 'Remind',
    signers: [
      { name: 'Amara Okafor', signed: true },
      { name: 'Chidi Anigbogu', signed: false }
    ]
  },
  {
    title: 'Mutual NDA, Thrive SACCO',
    meta: 'Sent Jul 18 • 2 of 2 signed',
    status: 'Complete',
    actionText: 'Download',
    signers: [
      { name: 'Amara Okafor', signed: true },
      { name: 'Thrive SACCO', signed: true }
    ]
  },
  {
    title: 'Founder IP assignment',
    meta: 'Sent Jul 2 • 1 of 2 signed',
    status: 'Expired',
    actionText: 'Resend',
    signers: [
      { name: 'Amara Okafor', signed: true },
      { name: 'Daniel Kariuki', signed: false }
    ]
  }
];

const SHARED_LIST_ITEMS: SharedListItem[] = [
  { document: 'Pre-seed deck v3', sharedWith: 'Sahel Fund', access: 'View', lastViewed: 'Today 10:12' },
  { document: 'Financial model, 36 months', sharedWith: 'Grace Adeyemi', access: 'Edit', lastViewed: 'Yesterday' },
  { document: 'Contractor agreement', sharedWith: 'Tayo Nwachukwu', access: 'Comment', lastViewed: '2h ago' },
  { document: 'Data room index', sharedWith: 'Ventures for Africa', access: 'View', lastViewed: '3d ago' },
];

const TEMPLATE_ITEMS: TemplateCardItem[] = [
  { title: 'Business plan', description: 'Full plan, AI-filled from your workspace.', category: 'BUSINESS', icon: <FileText size={16} className="text-[#183B28]" /> },
  { title: 'One-pager', description: 'The whole company on a single page.', category: 'BUSINESS', icon: <Layers size={16} className="text-[#183B28]" /> },
  { title: 'Executive summary', description: 'Two pages for a warm intro.', category: 'BUSINESS', icon: <FileText size={16} className="text-[#183B28]" /> },
  { title: 'Pitch deck', description: 'Twelve slides in the order investors expect.', category: 'FUNDRAISING', icon: <Sparkles size={16} className="text-[#183B28]" /> },
  { title: 'Investor update', description: 'Monthly update with metrics and asks.', category: 'FUNDRAISING', icon: <Mail size={16} className="text-[#183B28]" /> },
  { title: 'Data room index', description: 'The folder structure investors look for.', category: 'FUNDRAISING', icon: <GridIcon size={16} className="text-[#183B28]" /> },
  { title: 'Financial model', description: 'Three statements, 36 months.', category: 'FINANCE', icon: <DollarSign size={16} className="text-[#183B28]" /> },
  { title: 'Invoice', description: 'Branded invoice with payment terms.', category: 'FINANCE', icon: <FileText size={16} className="text-[#183B28]" /> },
  { title: 'Budget tracker', description: 'Budget against actuals by category.', category: 'FINANCE', icon: <FileSpreadsheet size={16} className="text-[#183B28]" /> },
  { title: 'Meeting notes', description: 'Decisions, owners, and next steps.', category: 'OPERATIONS', icon: <FileText size={16} className="text-[#183B28]" /> },
  { title: 'Job description', description: 'Role, scope, and comp band.', category: 'OPERATIONS', icon: <Briefcase size={16} className="text-[#183B28]" /> },
  { title: 'Standard operating procedure', description: 'Write it once, delegate forever.', category: 'OPERATIONS', icon: <Settings size={16} className="text-[#183B28]" /> },
];

export default function DocumentDetailsPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  
  const [activeTab, setActiveTab] = useState<DocumentSubTab>('Library'); 
  const [libraryViewMode, setLibraryViewMode] = useState<'Grid' | 'List'>('List');
  const [selectedCategory, setSelectedCategory] = useState<string>('All documents');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareEmail, setShareEmail] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<'View' | 'Comment' | 'Edit'>('View');
  const [linkExpires, setLinkExpires] = useState<boolean>(true);

  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [signerEmail, setSignerEmail] = useState<string>('tayo@lawfirm.ng');

  const [signatureRequests, setSignatureRequests] = useState<SignatureRequestItem[]>(INITIAL_SIGNATURE_REQUESTS);

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShareSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsShareModalOpen(false);
    showToast('Document shared.');
  };

  const handleSignSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsSignModalOpen(false);
    showToast('Signature request sent.');
  };

  const handleSignatureAction = (index: number): void => {
    const req = signatureRequests[index];
    if (req.actionText === 'Remind') {
      showToast(`Remind • ${req.title}`);
    } else if (req.actionText === 'Download') {
      showToast(`Download • ${req.title}`);
    } else if (req.actionText === 'Resend') {
      showToast(`Resend • ${req.title}`);
    }
  };

  const getStatusBadgeStyles = (status: string): string => {
    switch (status) {
      case 'Awaiting signature': 
      case 'Awaiting': 
        return 'bg-[#F2ECE1] text-[#7A6025]';
      case 'Final': 
      case 'Signed': 
      case 'Complete': 
        return 'bg-[#E5EFEA] text-[#1E3E2B]';
      case 'Draft': 
        return 'bg-[#ECEEEF] text-[#55625A]';
      case 'Expired': 
        return 'bg-[#FDF2F2] text-[#B93838]';
      default: return 'bg-[#F5F5F0] text-[#617065]';
    }
  };

  const getAccessBadgeStyles = (access: string): string => {
    switch (access) {
      case 'View': return 'bg-[#E5EFEA] text-[#1E3E2B]';
      case 'Edit': return 'bg-[#E5EFEA] text-[#1E3E2B]';
      case 'Comment': return 'bg-[#E5EFEA] text-[#1E3E2B]';
      default: return 'bg-[#E5EFEA] text-[#1E3E2B]';
    }
  };

  const filteredLibraryDocs = LIBRARY_DOCS.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.owner.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All documents') return matchesSearch;
    return matchesSearch && doc.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923] font-sans antialiased relative selection:bg-[#EAD5C6]">
      
      {/* Top Banner Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2.5 text-sm font-medium transition-all duration-300">
          <span className="bg-[#183B28] text-white rounded-full p-0.5 text-xs">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E8E2] px-4 md:px-6 py-3 flex items-center justify-between bg-white w-full">
        {/* Left Side */}
        <div className="flex items-center space-x-2.5">
          {/* Tablet/Mobile Logo/Sidebar Trigger button */}
          <button 
            onClick={openSidebar}
            className="md:hidden w-8 h-8 rounded-lg border border-[#E0E0DA] bg-white text-[#183B28] hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 shadow-xs"
            aria-label="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium tracking-tight">
            <span className="text-[#1E2923] font-semibold">Workspace</span>
            <span className="text-[#8E9B90]">/</span>
            <span className="text-[#8E9B90] font-normal">Documents</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Health Indicator (Hidden on mobile) */}
          <div className="hidden md:flex bg-[#EAF2ED] text-[#1E3E2B] px-3 py-1 rounded-full text-xs font-semibold items-center space-x-1.5 border border-[#D5DDD6]">
            <span>Health</span>
            <span className="font-bold">72</span>
            <span className="text-xs">↑</span>
          </div>
          
          {/* Notification Button */}
          <button 
            onClick={() => showToast('Notifications opened.')}
            className="relative w-8 h-8 rounded-full border border-[#E0E0DA] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shadow-xs shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-[#66756F]" />
            <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              5
            </span>
          </button>

          {/* Marketplace Navbar Invite Button (explicitly styled with rounded-[8px] border-radius) */}
          <button 
            onClick={() => showToast('Invite modal opened.')}
            className="bg-[#B39353] hover:bg-[#A38346] text-white px-2.5 sm:px-4 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors h-[34px] shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline font-medium">+ Invite</span>
          </button>
        </div>
      </header>

      {/* Secondary Sub-navbar */}
      <nav className="w-full bg-[#F7F7F5] border-b border-[#E8E8E2] px-4 md:px-6 py-2 flex items-center overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1.5 whitespace-nowrap">
          {(['Library', 'Document', 'Templates', 'Signatures', 'Shared'] as DocumentSubTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'Templates') {
                    showToast('Navigated to template page.');
                  }
                }}
                className={
                  isActive 
                    ? "px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EAD5C6] text-[#1E2923] shadow-xs transition-colors"
                    : "px-3.5 py-1 rounded-full text-xs font-medium text-[#617065] hover:bg-[#EFEFEE] transition-colors"
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* TAB CONTENT: LIBRARY */}
      {activeTab === 'Library' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight mb-1">Documents</h1>
            <p className="text-xs text-[#738279]">Every file your company has produced, versioned and searchable.</p>
          </div>

          <div className="flex justify-end items-center space-x-3 -mt-12 mb-4">
            <button 
              onClick={() => showToast('Upload dialog opened.')}
              className="px-4 py-1.5 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-lg text-xs font-semibold shadow-xs transition-colors h-[34px]"
            >
              Upload
            </button>
            <button 
              onClick={() => {
                setActiveTab('Templates');
                showToast('Navigated to template page.');
              }}
              className="px-4 py-1.5 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors h-[34px]"
            >
              <Plus size={14} />
              <span>+ New document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start pt-2">
            <div className="lg:col-span-1 bg-white border border-[#E8E8E2] rounded-xl p-2 shadow-xs space-y-0.5">
              {[
                { name: 'All documents', count: 38, icon: true },
                { name: 'Corporate', count: 6, arrow: true },
                { name: 'Financials', count: 9, arrow: true },
                { name: 'Legal', count: 7, arrow: true },
                { name: 'Fundraising', count: 8, arrow: true },
                { name: 'Marketing', count: 5, arrow: true },
                { name: 'Archive', count: 3, arrow: true },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isSelected 
                        ? 'bg-[#F2F4F2] text-[#1E2923] font-semibold' 
                        : 'text-[#617065] hover:bg-[#F9F9F6] hover:text-[#1E2923] font-medium'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      {cat.icon && <span className="text-[#8E9B90] text-xs">⊞</span>}
                      {cat.arrow && <ChevronRight size={12} className="text-[#C4C9C5]" />}
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[11px] text-[#8E9B90]">{cat.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#9CA8A0]" size={15} />
                  <input 
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E8E8E2] rounded-lg pl-10 pr-4 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44] shadow-xs"
                  />
                </div>

                <div className="flex items-center space-x-0.5 bg-white border border-[#E8E8E2] p-0.5 rounded-lg shadow-xs shrink-0">
                  <button
                    onClick={() => setLibraryViewMode('Grid')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      libraryViewMode === 'Grid' ? 'bg-[#1C3B2B] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setLibraryViewMode('List')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      libraryViewMode === 'List' ? 'bg-[#1C3B2B] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {libraryViewMode === 'Grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibraryDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      onClick={() => { setActiveTab('Document'); showToast(`Opened ${doc.title}`); }}
                      className="bg-white border border-[#E8E8E2] rounded-xl p-5 shadow-xs flex flex-col justify-between h-44 hover:border-[#D5DDD6] transition-all cursor-pointer relative"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            doc.type === 'PDF' ? 'bg-[#FDF2F2] text-[#B93838]' :
                            doc.type === 'DOC' ? 'bg-[#EFF6FF] text-[#1D4ED8]' :
                            doc.type === 'XLS' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FFF7ED] text-[#C2410C]'
                          }`}>
                            {doc.type}
                          </span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-[#1E2923] leading-snug">{doc.title}</h3>
                          <p className="text-[11px] text-[#8E9B90] mt-1">{doc.owner} • {doc.modified}</p>
                        </div>
                      </div>

                      {doc.aiGenerated && (
                        <div className="flex items-center space-x-1 text-[11px] text-[#A8894B] font-medium pt-2 border-t border-[#F2F2EC]">
                          <Sparkles size={12} />
                          <span>AI generated</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {libraryViewMode === 'List' && (
                <div className="bg-white border border-[#E8E8E2] rounded-xl shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider bg-white">
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Owner</th>
                        <th className="py-3 px-5">Modified</th>
                        <th className="py-3 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs">
                      {filteredLibraryDocs.map((doc) => (
                        <tr 
                          key={doc.id}
                          onClick={() => { setActiveTab('Document'); showToast(`Opened ${doc.title}`); }}
                          className="hover:bg-[#F9F9F6] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-5 font-semibold text-[#1E2923] flex items-center space-x-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                              doc.type === 'PDF' ? 'bg-[#FDF2F2] text-[#B93838]' :
                              doc.type === 'DOC' ? 'bg-[#EFF6FF] text-[#1D4ED8]' :
                              doc.type === 'XLS' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FFF7ED] text-[#C2410C]'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="font-medium">{doc.title}</span>
                          </td>
                          <td className="py-3.5 px-5 text-[#617065]">{doc.owner}</td>
                          <td className="py-3.5 px-5 text-[#617065]">{doc.modified}</td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* TAB CONTENT: DOCUMENT */}
      {activeTab === 'Document' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div>
            <button 
              onClick={() => setActiveTab('Library')}
              className="text-xs font-medium text-[#617065] hover:text-[#1E2923] transition-colors flex items-center space-x-1"
            >
              <span>← Back to documents</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight mb-1">Contractor agreement, Tayo review</h1>
              <p className="text-xs text-[#738279]">PDF • v4 • edited 2h ago by Amara</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-1.5 bg-white border border-[#DCDCD6] rounded-lg text-xs font-semibold text-[#183B28] hover:bg-[#F5F5F0] shadow-xs transition-all"
              >
                Share
              </button>
              <button 
                onClick={() => setIsSignModalOpen(true)}
                className="px-4 py-1.5 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Send for signature
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-[#E8E8E2] rounded-xl p-8 shadow-xs space-y-6 min-h-[520px]">
              <div className="w-3/4 h-5 bg-[#E8E8E2] rounded animate-pulse mb-8" />
              <div className="space-y-4">
                <div className="w-full h-3 bg-[#F2F2EC] rounded animate-pulse" />
                <div className="w-11/12 h-3 bg-[#F2F2EC] rounded animate-pulse" />
                <div className="w-full h-3 bg-[#F2F2EC] rounded animate-pulse" />
                <div className="w-4/5 h-3 bg-[#F2F2EC] rounded animate-pulse" />
                <div className="w-full h-4 bg-[#EAD5C6]/60 rounded animate-pulse my-4" />
                <div className="w-10/12 h-3 bg-[#F2F2EC] rounded animate-pulse" />
                <div className="w-full h-3 bg-[#F2F2EC] rounded animate-pulse" />
                <div className="w-9/12 h-3 bg-[#F2F2EC] rounded animate-pulse" />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-[#E8E8E2] rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Version History</h3>
                <div className="space-y-4">
                  {VERSION_HISTORY.map((item, idx) => (
                    <div key={idx} className="flex space-x-3 items-start text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#E5EFEA] text-[#1E3E2B] shrink-0 mt-0.5">
                        {item.version}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-medium text-[#1E2923] leading-relaxed">{item.description}</p>
                        <p className="text-[10px] text-[#8E9B90]">{item.author} • {item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E8E8E2] rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Shared With</h3>
                <div className="space-y-3.5">
                  {SHARED_USERS.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-full bg-[#1C3B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {user.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E2923]">{user.name}</p>
                          <p className="text-[10px] text-[#8E9B90]">{user.permission} • {user.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* TAB CONTENT: TEMPLATES */}
      {activeTab === 'Templates' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
          <div>
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight mb-1">Templates</h1>
            <p className="text-xs text-[#738279]">Start from a structure that works, then let AI fill it with your data.</p>
          </div>

          {(['BUSINESS', 'FUNDRAISING', 'FINANCE', 'OPERATIONS'] as const).map((cat) => {
            const catTemplates = TEMPLATE_ITEMS.filter((t) => t.category === cat);
            return (
              <div key={cat} className="space-y-4">
                <h2 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catTemplates.map((tmpl, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-[#E8E8E2] rounded-xl p-6 shadow-xs flex flex-col justify-between h-44 hover:border-[#D5DDD6] transition-all"
                    >
                      <div className="space-y-3">
                        <div className="w-7 h-7 rounded-full bg-[#E5EFEA] flex items-center justify-center">
                          {tmpl.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-[#1E2923]">{tmpl.title}</h3>
                          <p className="text-xs text-[#617065] mt-1 leading-relaxed">{tmpl.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast(`Creating a document from ${tmpl.title}.`)}
                        className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors self-start mt-4"
                      >
                        Use template →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </main>
      )}

      {/* TAB CONTENT: SIGNATURES */}
      {activeTab === 'Signatures' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight mb-1">E-signature requests</h1>
            <p className="text-xs text-[#738279]">Track pending and completed document signatures.</p>
          </div>

          <div className="space-y-4">
            {signatureRequests.map((req, idx) => (
              <div key={idx} className="bg-white border border-[#E8E8E2] rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#FDF2F2] text-[#B93838]">PDF</span>
                    <div>
                      <h3 className="font-semibold text-xs text-[#1E2923]">{req.title}</h3>
                      <p className="text-xs text-[#8E9B90] mt-0.5">{req.meta}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 self-end sm:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyles(req.status)}`}>
                      {req.status}
                    </span>
                    <button 
                      onClick={() => handleSignatureAction(idx)}
                      className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors"
                    >
                      {req.actionText}
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#E8E8E2] pt-3 flex flex-wrap gap-4 text-xs text-[#617065]">
                  {req.signers.map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center space-x-1.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${s.signed ? 'bg-[#E5EFEA] text-[#1E3E2B]' : 'bg-[#F5F5F0] text-[#8E9B90]'}`}>
                        {s.signed ? '✓' : '•'}
                      </span>
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* TAB CONTENT: SHARED */}
      {activeTab === 'Shared' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight mb-1">Shared with others</h1>
            <p className="text-xs text-[#738279]">Files shared with external collaborators and advisors.</p>
          </div>

          <div className="bg-white border border-[#E8E8E2] rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#E8E8E2] text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider bg-white">
                  <th className="py-3 px-6">Document</th>
                  <th className="py-3 px-6">Shared with</th>
                  <th className="py-3 px-6">Access</th>
                  <th className="py-3 px-6">Last viewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E2] text-xs">
                {SHARED_LIST_ITEMS.map((item, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => showToast(`Opened shared document: ${item.document}`)}
                    className="hover:bg-[#F9F9F6] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-[#1E2923]">{item.document}</td>
                    <td className="py-4 px-6 text-[#617065]">{item.sharedWith}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${getAccessBadgeStyles(item.access)}`}>
                        {item.access}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#617065]">{item.lastViewed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* MODAL: SHARE DOCUMENT */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E2] rounded-xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-[#1E2923]">Share document</h2>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-[#617065] hover:bg-[#F5F5F0]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Email</label>
                <input 
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-lg px-3 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Access level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['View', 'Comment', 'Edit'] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setAccessLevel(lvl)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        accessLevel === lvl 
                          ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' 
                          : 'bg-white text-[#617065] border-[#E8E8E2] hover:bg-[#F5F5F0]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLinkExpires(!linkExpires)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    linkExpires ? 'bg-[#1C3B2B] border-[#1C3B2B] text-white' : 'bg-white border-[#8E9B90]'
                  }`}
                >
                  {linkExpires && <Check size={10} />}
                </button>
                <span className="text-xs text-[#617065]">Link expires in 30 days</span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#E8E8E2] rounded-lg text-xs font-semibold text-[#1E2923] hover:bg-[#F5F5F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEND FOR SIGNATURE */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E2] rounded-xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-[#1E2923]">Send for signature</h2>
              <button 
                onClick={() => setIsSignModalOpen(false)}
                className="p-1 rounded-lg text-[#617065] hover:bg-[#F5F5F0]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#617065] leading-relaxed">
              Signers receive an email with a secure link. You will be notified as each one signs.
            </p>

            <form onSubmit={handleSignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Signer 1</label>
                <input 
                  type="email"
                  required
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-lg px-3 py-2 text-xs text-[#1E2923] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Signer 2</label>
                <input 
                  type="text"
                  placeholder="Add another signer"
                  className="w-full bg-white border border-[#E8E8E2] rounded-lg px-3 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#E8E8E2] rounded-lg text-xs font-semibold text-[#1E2923] hover:bg-[#F5F5F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Send request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}