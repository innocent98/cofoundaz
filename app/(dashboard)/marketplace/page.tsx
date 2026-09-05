// app/(dashboard)/marketplace/page.tsx
'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';

interface Expert {
  id: number;
  name: string;
  role: string;
  initials: string;
  category: 'Legal' | 'Accounting' | 'Marketing' | 'Design' | 'Engineering';
  tags: string[];
  rating: number;
  reviewsCount: number;
  price: string;
  availability: string;
  location: string;
  bio: string;
  responseTime: string;
  foundersServed: string;
  repeatRate: string;
  services: { title: string; description: string; price: string }[];
  reviews: { author: string; rating: number; comment: string }[];
}

interface Booking {
  id: number;
  initials: string;
  title: string;
  subtitle: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  actionLabel: string;
}

interface MessageThread {
  id: string;
  name: string;
  initials: string;
  preview: string;
  unread: boolean;
  messages: { sender: 'them' | 'me'; text: string }[];
}

const expertsData: Expert[] = [
  {
    id: 1,
    name: 'Tayo Nwachukwu',
    role: 'Corporate lawyer',
    initials: 'TN',
    category: 'Legal',
    tags: ['Contracts', 'Fundraising'],
    rating: 4.9,
    reviewsCount: 47,
    price: '₦25,000 / hr',
    availability: 'Available this week',
    location: 'Lagos, Nigeria',
    bio: 'Twelve years advising African startups on formation, contracts, and venture financing. I have papered over 60 pre-seed and seed rounds, and I explain things in plain language, not legalese.',
    responseTime: 'Under 4 hrs',
    foundersServed: '90+',
    repeatRate: '68%',
    services: [
      { title: 'Contract review', description: 'One document, marked up with plain-language notes.', price: '₦40,000' },
      { title: 'Formation package', description: 'Incorporation, filings, and founder agreements.', price: '₦180,000' },
      { title: 'Hourly consult', description: 'Bring any question, 60 minutes.', price: '₦25,000' },
    ],
    reviews: [
      { author: 'Chidi A.', rating: 5, comment: 'Turned my contractor agreement around in a day and caught a non-compete that would have bitten me.' },
      { author: 'Funke O.', rating: 5, comment: 'Explained our SAFE terms without making me feel stupid. Worth every naira.' },
    ],
  },
  {
    id: 2,
    name: 'Grace Adeyemi',
    role: 'Startup accountant',
    initials: 'GA',
    category: 'Accounting',
    tags: ['Bookkeeping', 'Tax'],
    rating: 4.8,
    reviewsCount: 62,
    price: '₦18,000 / hr',
    availability: 'Available next week',
    location: 'Abuja, Nigeria',
    bio: 'Specialized financial management and tax strategy for scaling tech startups across West Africa.',
    responseTime: 'Under 24 hrs',
    foundersServed: '120+',
    repeatRate: '75%',
    services: [
      { title: 'Monthly bookkeeping', description: 'Clean financial records reconciled monthly.', price: '₦60,000' },
      { title: 'Tax audit prep', description: 'Ensure full regulatory compliance.', price: '₦150,000' },
    ],
    reviews: [
      { author: 'Tunde B.', rating: 5, comment: 'Lifesaver during tax season.' },
    ],
  },
  {
    id: 3,
    name: 'Kwame Mensah',
    role: 'Growth marketer',
    initials: 'KM',
    category: 'Marketing',
    tags: ['Paid social', 'Retention'],
    rating: 4.7,
    reviewsCount: 38,
    price: '₦22,000 / hr',
    availability: 'Available this week',
    location: 'Accra, Ghana',
    bio: 'Scaling user acquisition channels for B2B and consumer fintech startups.',
    responseTime: 'Under 6 hrs',
    foundersServed: '50+',
    repeatRate: '60%',
    services: [
      { title: 'Growth audit', description: 'Full funnel breakdown and optimization plan.', price: '₦90,000' },
    ],
    reviews: [
      { author: 'Efe M.', rating: 5, comment: 'Great insights on CAC optimization.' },
    ],
  },
  {
    id: 4,
    name: 'Ifeoma Balogun',
    role: 'Product designer',
    initials: 'IB',
    category: 'Design',
    tags: ['Mobile', 'Onboarding'],
    rating: 5.0,
    reviewsCount: 24,
    price: '₦20,000 / hr',
    availability: 'Booked until Aug 5',
    location: 'Lagos, Nigeria',
    bio: 'Crafting intuitive product experiences and high-conversion user onboarding flows for mobile apps.',
    responseTime: 'Under 12 hrs',
    foundersServed: '40+',
    repeatRate: '80%',
    services: [
      { title: 'UX teardown', description: 'Comprehensive audit of your onboarding flow.', price: '₦70,000' },
    ],
    reviews: [
      { author: 'Kemi L.', rating: 5, comment: 'Our signup conversion jumped 20% after her teardown.' },
    ],
  },
  {
    id: 5,
    name: 'David Okonkwo',
    role: 'Fractional CTO',
    initials: 'DO',
    category: 'Engineering',
    tags: ['Architecture', 'Hiring'],
    rating: 4.9,
    reviewsCount: 31,
    price: '₦35,000 / hr',
    availability: 'Available this week',
    location: 'Lagos, Nigeria',
    bio: 'Guiding technical architecture, scaling engineering teams, and hardening cloud infrastructure.',
    responseTime: 'Under 3 hrs',
    foundersServed: '35+',
    repeatRate: '90%',
    services: [
      { title: 'Architecture review', description: 'Codebase and infrastructure scalability review.', price: '₦120,000' },
    ],
    reviews: [
      { author: 'Emeka N.', rating: 5, comment: 'Invaluable architectural advice before our big launch.' },
    ],
  },
  {
    id: 6,
    name: 'Aisha Ndiaye',
    role: 'Fundraising advisor',
    initials: 'AN',
    category: 'Legal', // or general consulting/marketing/etc.
    tags: ['Pre-seed', 'Pitch'],
    rating: 4.8,
    reviewsCount: 29,
    price: '₦28,000 / hr',
    availability: 'Available next week',
    location: 'Dakar, Senegal',
    bio: 'Helping early-stage tech founders refine pitch decks and connect with African and global angel networks.',
    responseTime: 'Under 5 hrs',
    foundersServed: '65+',
    repeatRate: '70%',
    services: [
      { title: 'Deck review', description: 'Pitch deck teardown and investor narrative.', price: '₦50,000' },
    ],
    reviews: [
      { author: 'Zainab K.', rating: 5, comment: 'Helped us tighten our narrative right before closing.' },
    ],
  },
];

const initialBookings: Booking[] = [
  {
    id: 1,
    initials: 'TN',
    title: 'Contract review',
    subtitle: 'Tayo Nwachukwu · Tomorrow, 10:00',
    status: 'Confirmed',
    actionLabel: 'Join call',
  },
  {
    id: 2,
    initials: 'GA',
    title: 'Monthly bookkeeping',
    subtitle: 'Grace Adeyemi · Starts Aug 1',
    status: 'Pending',
    actionLabel: 'Message',
  },
  {
    id: 3,
    initials: 'KM',
    title: 'Channel audit',
    subtitle: 'Kwame Mensah · Jun 18, completed',
    status: 'Completed',
    actionLabel: 'Leave review',
  },
];

const initialThreads: MessageThread[] = [
  {
    id: '1',
    name: 'Tayo Nwachukwu',
    initials: 'TN',
    preview: 'I have marked up clause 8.2, ta...',
    unread: true,
    messages: [
      { sender: 'them', text: 'Thanks for sending the contractor agreement over.' },
      { sender: 'me', text: 'No rush, but the non-compete worries me.' },
      { sender: 'them', text: 'You are right to worry. Five years and worldwide will not hold up. I have marked up clause 8.2, take a look.' },
    ],
  },
  {
    id: '2',
    name: 'Grace Adeyemi',
    initials: 'GA',
    preview: "Send me last month's statements w...",
    unread: false,
    messages: [
      { sender: 'them', text: 'Hello! Ready to kick off the monthly bookkeeping?' },
      { sender: 'me', text: 'Hi Grace! Yes, gathering everything now.' },
      { sender: 'them', text: "Send me last month's statements whenever you're ready." },
    ],
  },
  {
    id: '3',
    name: 'Kwame Mensah',
    initials: 'KM',
    preview: 'Audit is done, summary attached.',
    unread: false,
    messages: [
      { sender: 'them', text: 'Audit is done, summary attached.' },
      { sender: 'me', text: 'Thanks Kwame, looking over it now.' },
    ],
  },
];

export default function MarketplacePage() {
  const { openSidebar } = useSidebar();
  const [activeNavTab, setActiveNavTab] = useState('Browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  
  // Booking Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState<{ title: string; price: string } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('Tue 10:00');
  const [helpNote, setHelpNote] = useState('');

  // Bookings & Messages States
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Become an expert form state
  const [expertFormSubmitted, setExpertFormSubmitted] = useState(false);
  const [expertFullName, setExpertFullName] = useState('');
  const [expertDiscipline, setExpertDiscipline] = useState('Legal');
  const [expertHourlyRate, setExpertHourlyRate] = useState('₦25,000');
  const [expertBio, setExpertBio] = useState('');

  const categories = ['All', 'Legal', 'Accounting', 'Marketing', 'Design', 'Engineering'];

  const filteredExperts = expertsData.filter((expert) => {
    const matchesCategory = selectedCategory === 'All' || expert.category === selectedCategory;
    const matchesSearch =
      expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const triggerNotification = (text: string) => {
    setActionNotification(text);
    setTimeout(() => {
      setActionNotification(null);
    }, 4000);
  };

  const handleOpenBookingModal = (service: { title: string; price: string }) => {
    setSelectedServiceToBook(service);
    setIsBookingModalOpen(true);
  };

  const handleConfirmAndPay = () => {
    if (!selectedExpert || !selectedServiceToBook) return;

    const newBooking: Booking = {
      id: Date.now(),
      initials: selectedExpert.initials,
      title: selectedServiceToBook.title,
      subtitle: `${selectedExpert.name} · ${selectedSlot === 'Tue 10:00' ? 'Tomorrow, 10:00' : selectedSlot}`,
      status: 'Confirmed',
      actionLabel: 'Join call',
    };

    setBookings([newBooking, ...bookings]);
    setIsBookingModalOpen(false);
    setActiveNavTab('My bookings');
    triggerNotification('Booked. Payment held until the session is done.');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    const updated = threads.map((th) => {
      if (th.id === activeThreadId) {
        return {
          ...th,
          preview: messageInput,
          messages: [...th.messages, { sender: 'me' as const, text: messageInput }],
        };
      }
      return th;
    });

    setThreads(updated);
    setMessageInput('');
  };

  const handleExpertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExpertFormSubmitted(true);
  };

  const activeThread = threads.find((th) => th.id === activeThreadId) || threads[0];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923] font-sans antialiased flex flex-col w-full overflow-x-hidden rounded-none relative">
      
      {/* Floating Action Notification Banner */}
      {actionNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center space-x-2 text-sm font-medium border border-[#D89A6E]/30 transition-all">
          <span className="text-[#059669] font-bold">✓</span>
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 w-full rounded-none">
        
        {/* Main Navbar Row */}
        <div className="bg-[#FFFFFF] border-b border-[#EBEBE6] px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* Left Side: Logo Trigger & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={openSidebar}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-[#183B28] text-[#D89A6E] rounded-modal focus:outline-none transition-opacity hover:opacity-90"
              aria-label="Open sidebar"
            >
              <span className="font-bold text-sm">C</span>
            </button>

            <div className="flex items-center space-x-2 text-base sm:text-lg md:text-xl font-semibold tracking-tight">
              <span className="text-[#1E2923]">Workspace</span>
              <span className="text-[#8E9B90]">/</span>
              <span className="text-[#8E9B90]">Marketplace</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-[#E3EFE9] border border-[#D5DDD6] rounded-full text-xs font-medium text-[#12291F]">
              <span className="text-[#617065]">Health</span>
              <span className="font-bold text-[#12291F]">72</span>
              <span className="text-[#059669] font-bold">↑</span>
            </div>

            <button 
              className="relative w-9 h-9 flex items-center justify-center text-[#66756F] hover:text-[#1E2923] transition-colors bg-[#FFFFFF] border border-[#DCE6E1] rounded-full"
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#12291F] text-[#FFFFFF] rounded-full text-[10px] font-bold flex items-center justify-center">5</span>
            </button>

            <button 
              className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-medium px-3 md:px-4 py-2 rounded-[8px] text-sm flex items-center transition-colors"
              aria-label="Invite"
            >
              <span className="md:hidden font-bold text-base leading-none">+</span>
              <span className="hidden md:inline">+ Invite</span>
            </button>
          </div>
        </div>

        {/* Secondary Marketplace Sub-navbar Row */}
        <div className="bg-[#F8F8F4] border-b border-[#EBEBE6] px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['Browse', 'Expert profile', 'My bookings', 'Messages', 'Become an expert'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveNavTab(tab);
                if (tab === 'Browse') setSelectedExpert(null);
                if (tab === 'Expert profile' && !selectedExpert) setSelectedExpert(expertsData[0]);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeNavTab === tab
                  ? 'bg-[#EAD5C6] text-[#1E2923] border border-[#D5DDD6]'
                  : 'bg-[#FFFFFF] text-[#8E9B90] hover:text-[#1E2923] border border-[#EBEBE6]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Conditional Content Views */}
      {activeNavTab === 'Expert profile' && selectedExpert ? (
        
        /* EXPERT PROFILE VIEW */
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 space-y-6 relative">
          <div>
            <button 
              onClick={() => {
                setSelectedExpert(null);
                setActiveNavTab('Browse');
              }} 
              className="text-xs text-[#617065] hover:text-[#1E2923] transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              ← Back to marketplace
            </button>
          </div>

          <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 md:p-8 shadow-card space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#EBEBE6]">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-[#183B28] text-[#D89A6E] flex items-center justify-center font-bold text-xl shrink-0">
                  {selectedExpert.initials}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-semibold text-[#1E2923]">{selectedExpert.name}</h1>
                    <span className="inline-flex items-center gap-1 bg-[#E2EFE7] text-[#2D5A3F] text-xs px-2.5 py-0.5 rounded-full font-medium">
                      ✓ Vetted
                    </span>
                  </div>
                  <p className="text-sm text-[#617065]">{selectedExpert.role} • {selectedExpert.location}</p>
                  <div className="flex items-center space-x-1.5 text-xs pt-1">
                    <span className="text-[#A8894B] font-bold">★ {selectedExpert.rating.toFixed(1)}</span>
                    <span className="text-[#8E9B90]">{selectedExpert.reviewsCount} reviews</span>
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right">
                <div className="text-2xl font-bold text-[#1E2923]">{selectedExpert.price}</div>
                <div className="text-xs text-[#059669] font-medium mt-1">{selectedExpert.availability}</div>
              </div>
            </div>

            <p className="text-sm text-[#33413B] leading-relaxed">
              {selectedExpert.bio}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F8F8F4] border border-[#EBEBE6] rounded-card p-4 space-y-1">
                <div className="text-xs text-[#8E9B90] uppercase tracking-wider font-semibold">Response time</div>
                <div className="text-lg font-bold text-[#1E2923]">{selectedExpert.responseTime}</div>
              </div>
              <div className="bg-[#F8F8F4] border border-[#EBEBE6] rounded-card p-4 space-y-1">
                <div className="text-xs text-[#8E9B90] uppercase tracking-wider font-semibold">Founders served</div>
                <div className="text-lg font-bold text-[#1E2923]">{selectedExpert.foundersServed}</div>
              </div>
              <div className="bg-[#F8F8F4] border border-[#EBEBE6] rounded-card p-4 space-y-1">
                <div className="text-xs text-[#8E9B90] uppercase tracking-wider font-semibold">Repeat rate</div>
                <div className="text-lg font-bold text-[#1E2923]">{selectedExpert.repeatRate}</div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-xs uppercase tracking-wider text-[#8E9B90] font-bold">Services</h2>
              <div className="space-y-3">
                {selectedExpert.services.map((srv, idx) => (
                  <div key={idx} className="border border-[#EBEBE6] rounded-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#183B28]/30 transition-all">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-[#1E2923]">{srv.title}</h3>
                      <p className="text-xs text-[#617065]">{srv.description}</p>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <span className="font-bold text-sm text-[#1E2923]">{srv.price}</span>
                      <button 
                        onClick={() => handleOpenBookingModal(srv)}
                        className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-medium px-4 py-2 rounded-card text-xs transition-colors cursor-pointer"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-xs uppercase tracking-wider text-[#8E9B90] font-bold">Recent reviews</h2>
              <div className="space-y-3">
                {selectedExpert.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-[#F8F8F4] border border-[#EBEBE6] rounded-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1E2923]">{rev.author}</span>
                      <span className="text-xs text-[#A8894B] font-bold">★ {rev.rating}</span>
                    </div>
                    <p className="text-xs text-[#617065] italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOOKING MODAL OVERLAY */}
          {isBookingModalOpen && selectedServiceToBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="bg-white rounded-modal shadow-2xl border border-[#EBEBE6] w-full max-w-lg p-6 md:p-8 space-y-6 animate-scale-up">
                
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-[#1E2923]">
                    Book {selectedServiceToBook.title}
                  </h2>
                  <p className="text-xs text-[#617065]">
                    with {selectedExpert.name}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">
                    Pick a slot
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Tue 10:00', 'Tue 14:00', 'Wed 09:00', 'Thu 16:00'].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-2 rounded-card text-xs font-medium border transition-colors cursor-pointer ${
                          selectedSlot === slot
                            ? 'bg-[#183B28] text-white border-[#183B28]'
                            : 'bg-white text-[#1E2923] border-[#EBEBE6] hover:bg-[#F8F8F4]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">
                    What do you need help with?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="A sentence is enough."
                    value={helpNote}
                    onChange={(e) => setHelpNote(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#EBEBE6] rounded-card p-3 text-xs text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#9C5B34] resize-none"
                  />
                </div>

                <div className="bg-[#F8F8F4] border border-[#EBEBE6] rounded-card p-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Total</span>
                  <span className="text-lg font-bold text-[#1E2923]">{selectedServiceToBook.price}</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 bg-white hover:bg-[#F8F8F4] text-[#1E2923] border border-[#DCE6E1] font-medium py-3 rounded-card text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAndPay}
                    className="flex-1 bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-semibold py-3 rounded-card text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Confirm and pay
                  </button>
                </div>

                <p className="text-[11px] text-center text-[#8E9B90] pt-1">
                  Payment is held until the session is complete.
                </p>
              </div>
            </div>
          )}
        </main>

      ) : activeNavTab === 'My bookings' ? (

        /* MY BOOKINGS VIEW */
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
          <h1 className="text-2xl font-serif text-[#1E2923] tracking-tight">
            My bookings
          </h1>

          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal px-6 py-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#183B28]/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-[#183B28] text-[#D89A6E] flex items-center justify-center font-bold text-sm shrink-0">
                    {booking.initials}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-semibold text-[#1E2923]">{booking.title}</h3>
                    <p className="text-xs text-[#617065]">{booking.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-0 border-[#EBEBE6]">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      booking.status === 'Confirmed'
                        ? 'bg-[#E3EFE9] text-[#12291F]'
                        : booking.status === 'Pending'
                        ? 'bg-[#FDF6EC] text-[#9C5B34]'
                        : 'bg-[#F2F2EC] text-[#617065]'
                    }`}
                  >
                    {booking.status}
                  </span>

                  <button
                    onClick={() => {
                      if (booking.actionLabel === 'Join call') {
                        triggerNotification('Join call · Tayo Nwachukwu');
                      } else if (booking.actionLabel === 'Message') {
                        setActiveNavTab('Messages');
                      } else if (booking.actionLabel === 'Leave review') {
                        triggerNotification('Leave review · Kwame Mensah');
                      }
                    }}
                    className="bg-[#FFFFFF] hover:bg-[#F8F8F4] text-[#1E2923] border border-[#DCE6E1] font-medium px-4 py-2 rounded-card text-xs transition-colors cursor-pointer"
                  >
                    {booking.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

      ) : activeNavTab === 'Messages' ? (

        /* MESSAGES VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
          <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal shadow-card grid grid-cols-1 md:grid-cols-12 min-h-[580px] overflow-hidden">
            
            {/* Left Thread Sidebar */}
            <div className="md:col-span-4 border-r border-[#EBEBE6] divide-y divide-[#EBEBE6] bg-[#FFFFFF]">
              {threads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setThreads(threads.map(t => t.id === thread.id ? { ...t, unread: false } : t));
                    }}
                    className={`p-4 flex items-start space-x-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#F8F8F4]' : 'hover:bg-[#FCFCFA]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#183B28] text-[#D89A6E] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {thread.initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E2923] truncate">{thread.name}</span>
                        {thread.unread && (
                          <span className="w-2 h-2 rounded-full bg-[#A8894B] shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#617065] truncate">{thread.preview}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Chat Conversation Area */}
            <div className="md:col-span-8 flex flex-col justify-between bg-[#FFFFFF]">
              
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-[#EBEBE6] bg-[#FFFFFF]">
                <h2 className="text-sm font-bold text-[#1E2923]">{activeThread.name}</h2>
              </div>

              {/* Chat Message History */}
              <div className="p-6 space-y-4 flex-1 overflow-y-auto bg-[#FFFFFF]">
                {activeThread.messages.map((msg, idx) => {
                  if (msg.sender === 'them') {
                    return (
                      <div key={idx} className="flex justify-start">
                        <div className="bg-[#F2F2EC] text-[#1E2923] text-xs px-4 py-3 rounded-xl max-w-md leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={idx} className="flex justify-end">
                        <div className="bg-[#183B28] text-white text-xs px-4 py-3 rounded-xl max-w-md leading-relaxed shadow-sm">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Chat Message Input Bar */}
              <div className="p-4 border-t border-[#EBEBE6] bg-[#FFFFFF]">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-[#FFFFFF] border border-[#DCE6E1] rounded-input px-4 py-2.5 text-xs text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#183B28]"
                  />
                  <button
                    type="submit"
                    className="bg-[#183B28] hover:bg-[#12291F] text-white font-medium px-5 py-2.5 rounded-card text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>
          </div>
        </main>

      ) : activeNavTab === 'Become an expert' ? (

        /* BECOME AN EXPERT VIEW */
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif text-[#1E2923] tracking-tight">
              Join the expert bench
            </h1>
            <p className="text-sm text-[#617065]">
              We vet every expert before they appear. Applications take about 10 minutes and we respond within a week.
            </p>
          </div>

          {expertFormSubmitted ? (
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-12 shadow-card text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#183B28] text-[#FFFFFF] flex items-center justify-center font-bold text-xl shadow-sm">
                ✓
              </div>
              <p className="text-base font-semibold text-[#1E2923]">
                Application received. We will be in touch within a week.
              </p>
              <button
                onClick={() => setExpertFormSubmitted(false)}
                className="mt-4 text-xs font-medium text-[#617065] hover:text-[#1E2923] underline cursor-pointer"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 md:p-8 shadow-card">
              <form onSubmit={handleExpertSubmit} className="space-y-6">
                
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1E2923] uppercase tracking-wider">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={expertFullName}
                    onChange={(e) => setExpertFullName(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DCE6E1] rounded-input px-4 py-3 text-xs text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#9C5B34]"
                  />
                </div>

                {/* Discipline Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1E2923] uppercase tracking-wider">
                    Discipline
                  </label>
                  <div className="relative">
                    <select
                      value={expertDiscipline}
                      onChange={(e) => setExpertDiscipline(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#DCE6E1] rounded-input px-4 py-3 text-xs text-[#1E2923] focus:outline-none focus:border-[#9C5B34] appearance-none cursor-pointer"
                    >
                      <option value="Legal">Legal</option>
                      <option value="Accounting">Accounting</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Design">Design</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#617065] text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Hourly Rate */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1E2923] uppercase tracking-wider">
                    Hourly rate
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="₦25,000"
                    value={expertHourlyRate}
                    onChange={(e) => setExpertHourlyRate(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DCE6E1] rounded-input px-4 py-3 text-xs text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#9C5B34]"
                  />
                </div>

                {/* Why founders should work with you */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1E2923] uppercase tracking-wider">
                    Why founders should work with you
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Two or three sentences is plenty."
                    value={expertBio}
                    onChange={(e) => setExpertBio(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DCE6E1] rounded-card p-4 text-xs text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#9C5B34] resize-none"
                  />
                </div>

                {/* Submit Application Button */}
                <button
                  type="submit"
                  className="w-full bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-semibold py-3.5 rounded-card text-xs transition-colors cursor-pointer shadow-sm text-center"
                >
                  Submit application
                </button>

              </form>
            </div>
          )}
        </main>

      ) : (

        /* BROWSE DIRECTORY VIEW (Updated with 6 cards matching reference image) */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-normal text-[#1E2923] font-serif tracking-tight">
              When AI is not enough, hire a human who has done it
            </h1>
            <p className="text-sm text-[#617065]">
              Vetted lawyers, accountants, marketers, and designers who work with early-stage founders.
            </p>
          </div>

          <div className="bg-[#183B28] text-white rounded-modal p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-card bg-[#D89A6E]/20 text-[#D89A6E] flex items-center justify-center shrink-0 font-bold text-base border border-[#D89A6E]/30">
                ✦
              </div>
              <p className="text-sm md:text-base text-[#E6F1EB]">
                Based on your open contract review, you likely need a <strong className="text-white font-semibold">corporate lawyer</strong> for 1 to 2 hours.
              </p>
            </div>
            <button 
              onClick={() => setSelectedCategory('Legal')}
              className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-colors whitespace-nowrap text-center cursor-pointer"
            >
              Show me lawyers
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search experts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#9C5B34]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#183B28] text-[#FFFFFF]'
                      : 'bg-[#F2F2EC] text-[#556358] hover:bg-[#E5E5DE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <div
                key={expert.id}
                className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 shadow-card flex flex-col justify-between space-y-6 transition-all hover:border-[#183B28]/30"
              >
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-[#183B28] text-[#D89A6E] flex items-center justify-center font-bold text-sm shrink-0">
                      {expert.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[#1E2923] truncate">
                        {expert.name}
                      </h3>
                      <p className="text-xs text-[#617065] truncate mt-0.5">{expert.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {expert.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#E2EFE7] text-[#2D5A3F] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs pt-0.5">
                    <span className="text-[#A8894B] font-bold">★ {expert.rating.toFixed(1)}</span>
                    <span className="text-[#8E9B90]">{expert.reviewsCount} reviews</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EBEBE6] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#1E2923]">{expert.price}</div>
                    <div className="text-[11px] text-[#8E9B90] mt-0.5">{expert.availability}</div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedExpert(expert);
                      setActiveNavTab('Expert profile');
                    }}
                    className="bg-[#9C5B34] hover:bg-[#8A5330] text-[#FFFFFF] font-medium px-4 py-2 rounded-card text-xs transition-colors cursor-pointer"
                  >
                    View profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredExperts.length === 0 && (
            <div className="text-center py-12 bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal shadow-card">
              <p className="text-[#8E9B90] text-sm">No experts found matching your criteria.</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}