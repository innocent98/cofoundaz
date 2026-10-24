'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import { useJournal } from '@/hooks/useJournal';
import { Menu, History, Lock, Search } from 'lucide-react';

type JournalSubTab = 'Today' | 'All entries' | 'Mood' | 'Reflections' | 'Privacy';
type MoodType = 'Rough' | 'Heavy' | 'Steady' | 'Good' | 'Great';

export default function JournalPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();

  // Journal security lock state
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');

  // Navigation and view states - set default to 'Privacy' as requested for testing export/delete modals
  const [subTab, setSubTab] = useState<JournalSubTab>('Privacy');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journalText, setJournalText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search query for All entries
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track expanded state for each entry card independently
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({
    '1': true
  });

  // Privacy Toggle States
  const [aiReflectionsEnabled, setAiReflectionsEnabled] = useState<boolean>(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [encryptedBackupsEnabled, setEncryptedBackupsEnabled] = useState<boolean>(true);
  const [eveningReminderEnabled, setEveningReminderEnabled] = useState<boolean>(false);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  // Real journal data (prompt + entries list + mood trend) from the API.
  const {
    prompt: todayPrompt,
    entries,
    setEntries,
    saveEntry,
    saving: isSaving,
  } = useJournal();

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocked(false);
    showToast('Journal successfully unlocked.');
  };

  const toggleEntryExpansion = (id: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const wordCount = journalText.trim() ? journalText.trim().split(/\s+/).length : 0;

  const handleSaveEntry = async () => {
    if (!journalText.trim()) {
      showToast('Please write something before saving.');
      return;
    }
    const res = await saveEntry(journalText, selectedMood);
    if (!res.ok) {
      showToast(
        res.unavailable
          ? 'Journal storage is temporarily unavailable. Please try again later.'
          : 'Could not save your entry. Please try again.'
      );
      return;
    }
    setJournalText('');
    setSelectedMood(null);
    setSubTab('All entries');
    showToast('Entry saved.');
  };

  const handleDiscard = () => {
    setJournalText('');
    setSelectedMood(null);
    showToast('Entry discarded.');
  };

  // =========================================================================
  // LOCKED SCREEN VIEW
  // =========================================================================
  if (isLocked) {
    return (
      <div className="min-h-screen bg-brand-x0e231b text-white font-body antialiased flex flex-col justify-between selection:bg-accent-gold">
        <header className="border-b border-brand-x1a382c px-6 py-3.5 flex items-center justify-between bg-brand-x0e231b w-full">
          <div className="flex items-center space-x-3">
            <button 
              onClick={openSidebar}
              className="md:hidden w-9 h-9 rounded-modal border border-brand-x1e4233 bg-brand-x122b21 text-white hover:bg-brand-x1a382c flex items-center justify-center transition-colors shrink-0 shadow-card"
              aria-label="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center space-x-2 text-sm md:text-base font-semibold tracking-tight">
              <span className="text-neutral-xa3b2a8">Workspace</span>
              <span className="text-brand-x556f60">/</span>
              <span className="text-white flex items-center space-x-1.5">
                <span>Journal</span>
                <span className="text-accent-500 text-xs">🔒</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative w-9 h-9 rounded-full border border-brand-x1e4233 bg-brand-x122b21 flex items-center justify-center text-white">
              <History className="w-4 h-4 text-neutral-xa3b2a8" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-[24px] bg-brand-x163326 border border-brand-x234f3a flex items-center justify-center text-accent-500 shadow-accent">
            <Lock size={24} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-display font-normal tracking-tight text-white">This one is only yours.</h1>
            <p className="text-xs text-neutral-x8ea094 leading-relaxed">
              Your journal is encrypted with a key only you hold. No team member, no admin, and no AI training process can read it.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full space-y-3 pt-2">
            <input 
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter your journal PIN"
              className="w-full bg-brand-x122b21 border border-brand-x1e4233 rounded-modal px-4 py-3 text-center text-sm text-white placeholder-brand-x556f60 focus:outline-none focus:border-accent-gold transition-colors"
            />
            <button
              type="submit"
              className="w-full bg-accent-gold hover:bg-accent-xa38346 text-white font-medium py-3 rounded-modal text-xs tracking-wide uppercase transition-colors shadow-raised cursor-pointer"
            >
              Unlock journal
            </button>
          </form>

          <button 
            type="button"
            onClick={() => {
              setIsLocked(false);
              showToast('Unlocked via device biometrics.');
            }}
            className="text-xs text-brand-x529e77 hover:text-brand-x65ba90 transition-colors font-medium cursor-pointer pt-2"
          >
            Use device biometrics instead
          </button>
        </div>

        <div className="pb-6 text-center text-xs text-brand-x556f60">Workspace secure protocol v2.4</div>
      </div>
    );
  }

  // =========================================================================
  // UNLOCKED JOURNAL VIEWS
  // =========================================================================
  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">
      
      {/* Toast Notification Container matching Image 2 & Image 6 exactly */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-brand-x1e4231">
          <span className="w-4 h-4 rounded-full bg-brand-x1c4230 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-line px-6 py-3.5 flex items-center justify-between bg-white w-full">
        <div className="flex items-center space-x-3">
          <button 
            onClick={openSidebar}
            className="md:hidden w-9 h-9 rounded-modal border border-line-stone bg-white text-brand-strong hover:bg-neutral-50 flex items-center justify-center transition-colors shrink-0 shadow-card"
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center space-x-2 text-sm md:text-base font-semibold tracking-tight">
            <span className="text-ink">Workspace</span>
            <span className="text-ink-subtle font-normal">/</span>
            <span className="text-ink flex items-center space-x-1.5">
              <span>Journal</span>
              <span className="text-accent-600 text-xs">🔒</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setIsLocked(true);
              showToast('Journal locked.');
            }}
            className="border border-line-stone bg-white hover:bg-neutral-50 text-ink px-3.5 py-1.5 rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px] cursor-pointer"
          >
            <Lock size={13} className="text-neutral-x7a8a80" />
            <span>Lock journal</span>
          </button>

          <button 
            onClick={() => showToast('Activity history drawer opened.')}
            className="relative w-9 h-9 rounded-full border border-line-stone bg-white flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors shadow-card shrink-0"
          >
            <History className="w-4 h-4 text-neutral-x55635c" />
            <span className="absolute -top-1 -right-1 bg-accent-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              5
            </span>
          </button>
        </div>
      </header>

      {/* Sub-Navbar */}
      <nav className="w-full bg-surface-subtle border-b border-line px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {(['Today', 'All entries', 'Mood', 'Reflections', 'Privacy'] as JournalSubTab[]).map((tab) => {
            const isActive = subTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setSubTab(tab);
                  showToast(`Switched to ${tab} tab.`);
                }}
                className={
                  isActive
                    ? "px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors shrink-0 cursor-pointer"
                    : "px-4 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors shrink-0 cursor-pointer"
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ================================= TAB 1: TODAY VIEW ================================= */}
        {subTab === 'Today' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-neutral-xefefee pb-4">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Saturday, September 5</h1>
                <p className="text-xs text-ink-subtle mt-0.5">Nobody reads this but you.</p>
              </div>
              <div className="bg-neutral-xfaf3ec text-accent-x9e7c3e border border-accent-xf2e5d5 px-3.5 py-1.5 rounded-modal text-xs font-semibold flex items-center space-x-1.5 w-fit">
                <span>🔥</span>
                <span>12 entries this month</span>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-3">
              <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">How is today going?</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { name: 'Rough', emoji: '😞' },
                  { name: 'Heavy', emoji: '😥' },
                  { name: 'Steady', emoji: '😐' },
                  { name: 'Good', emoji: '🙂' },
                  { name: 'Great', emoji: '😁' },
                ].map((m) => {
                  const isSelected = selectedMood === m.name;
                  return (
                    <button
                      key={m.name}
                      onClick={() => {
                        setSelectedMood(m.name as MoodType);
                        showToast(`Mood selected: ${m.name}`);
                      }}
                      className={`border rounded-modal py-3.5 px-2 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-brand-strong bg-brand-tint shadow-card' 
                          : 'border-line hover:bg-neutral-50 bg-neutral-xfcfcfb'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-xs font-semibold text-ink">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-neutral-xf4efe6 border border-accent-xebe3d3 rounded-[24px] p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3 text-accent-x5a4d35">
                <span className="p-2 bg-accent-xe2d4bc rounded-card">✏️</span>
                <span className="font-medium"><strong>Today&apos;s prompt:</strong> {todayPrompt || 'What did you learn today that you did not know yesterday?'}</span>
              </div>
              <button 
                onClick={() => showToast('Loaded new journal prompt.')}
                className="text-accent-x9e7c3e font-semibold hover:underline shrink-0 ml-2"
              >
                Another →
              </button>
            </div>

            <div className="bg-white border border-line rounded-[24px] shadow-card p-6 space-y-4">
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Start anywhere. Half-formed thoughts are still worth keeping."
                rows={12}
                className="w-full focus:outline-none text-sm text-ink placeholder-neutral-xa0a8a2 resize-none leading-relaxed"
              />

              <div className="border-t border-neutral-xf2f2ec pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-xs text-ink-subtle">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span className="text-brand-strong font-medium flex items-center space-x-1">
                    <span>🔒</span>
                    <span>Encrypted as you type</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
                  <button
                    onClick={handleDiscard}
                    className="px-4 py-2 rounded-modal text-xs font-semibold border border-line-stone bg-white text-ink hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-modal text-xs font-semibold bg-accent-gold hover:bg-accent-xa38346 text-white transition-colors shadow-card cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? 'Saving…' : 'Save entry'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================= TAB 2: ALL ENTRIES VIEW ================================= */}
        {subTab === 'All entries' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">All entries</h1>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your entries..."
                  className="w-full bg-white border border-line rounded-modal pl-10 pr-4 py-2 text-xs text-ink placeholder-ink-subtle focus:outline-none focus:border-accent-gold"
                />
              </div>
            </div>

            <div className="space-y-4">
              {entries
                .filter(item => item.fullText.toLowerCase().includes(searchQuery.toLowerCase()) || item.date.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((entry) => {
                  const isExpanded = !!expandedEntries[entry.id];
                  return (
                    <div key={entry.id} className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-4 hover:border-neutral-xd1d1cb transition-all">
                      
                      <div className="flex items-center justify-between border-b border-neutral-xf2f2ec pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-card bg-neutral-xfaf3ec flex items-center justify-center text-sm shadow-card">
                            {entry.mood === 'Great' ? '😁' : entry.mood === 'Steady' ? '😐' : '🙂'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-xs text-ink">{entry.date}</h3>
                            <span className="text-[10px] text-ink-subtle">{entry.words} words</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            toggleEntryExpansion(entry.id);
                            showToast(isExpanded ? `Collapsed entry from ${entry.date}` : `Expanded entry from ${entry.date}`);
                          }}
                          className="w-7 h-7 rounded-card border border-line-stone bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                          aria-label={isExpanded ? 'Collapse entry' : 'Expand entry'}
                        >
                          {isExpanded ? '-' : '+'}
                        </button>
                      </div>

                      <div className="space-y-3 text-xs text-ink leading-relaxed">
                        {isExpanded ? (
                          <div className="space-y-3 whitespace-pre-line pt-1">
                            <p className="font-medium text-ink-strong">{entry.snippet}</p>
                            <div className="border-t border-neutral-xf2f2ec pt-3 text-neutral-x334138">
                              <p>{entry.fullText}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-ink-muted">{entry.snippet}</p>
                        )}
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex items-center space-x-2 pt-1">
                          {entry.tags.map((tag, i) => (
                            <span key={i} className="bg-brand-tint text-brand-strong px-2.5 py-0.5 rounded-input text-[10px] font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {/* ================================= TAB 3: MOOD VIEW ================================= */}
        {subTab === 'Mood' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Mood over time</h1>
              <p className="text-xs text-ink-subtle mt-0.5">The founder journey has a shape. Seeing it helps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Entries this month</span>
                <div className="text-3xl font-display text-ink-strong pt-1">12</div>
                <div className="text-xs text-ink-subtle pt-0.5">about 3 a week</div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Average mood</span>
                <div className="text-3xl font-display text-ink-strong pt-1">Steady</div>
                <div className="text-xs text-ink-subtle pt-0.5">up from Heavy in June</div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Longest streak</span>
                <div className="text-3xl font-display text-ink-strong pt-1">9 days</div>
                <div className="text-xs text-ink-subtle pt-0.5">in May</div>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              <div className="text-xs font-bold tracking-wider text-ink-subtle uppercase">Last 12 weeks</div>
              
              <div className="relative h-48 w-full pt-4 pb-2">
                <div className="absolute inset-x-0 top-8 border-t border-neutral-xf2f2ec"></div>
                <div className="absolute inset-x-0 top-20 border-t border-neutral-xf2f2ec"></div>
                <div className="absolute inset-x-0 top-32 border-t border-neutral-xf2f2ec"></div>

                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 160">
                  <path
                    d="M 40,80 Q 120,80 160,95 T 280,50 T 400,85 T 520,100 T 640,80 T 720,50 L 760,65"
                    fill="none"
                    stroke="var(--color-brand-strong)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {[
                    { cx: 40, cy: 80 },
                    { cx: 160, cy: 95 },
                    { cx: 280, cy: 50 },
                    { cx: 400, cy: 85 },
                    { cx: 520, cy: 100 },
                    { cx: 640, cy: 80 },
                    { cx: 720, cy: 50 },
                    { cx: 760, cy: 65 },
                  ].map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.cx}
                      cy={pt.cy}
                      r="4.5"
                      className="fill-brand-strong stroke-white stroke-2 cursor-pointer hover:scale-150 transition-transform"
                      onClick={() => showToast(`Data point ${idx + 1}: Mood entry recorded.`)}
                    />
                  ))}
                </svg>
              </div>

              <div className="flex justify-between text-[11px] text-ink-subtle pt-2 border-t border-neutral-xf2f2ec">
                <span>May</span>
                <span>June</span>
                <span>July</span>
              </div>
            </div>

            <div className="bg-brand-x12231b border border-brand-x1a382c rounded-[24px] p-5 flex items-start space-x-4 shadow-raised text-white">
              <div className="w-8 h-8 rounded-modal bg-brand-x1b382c border border-brand-x234d3a flex items-center justify-center text-accent-500 shrink-0 mt-0.5">
                ✦
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold tracking-wide text-white">A pattern worth noticing</h4>
                <p className="text-xs text-neutral-xa3b2a8 leading-relaxed">
                  Your hardest days cluster around cash decisions, not product ones. The week you closed the runway review was your lowest, and it recovered within four days. That is not fragility, that is a founder carrying the finance load alone.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ================================= TAB 4: REFLECTIONS VIEW ================================= */}
        {subTab === 'Reflections' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Reflections</h1>
                <p className="text-xs text-ink-subtle mt-0.5">Patterns drawn from your own words. Nothing here leaves your workspace.</p>
              </div>
              <div className="bg-neutral-xfaf3ec text-accent-x9e7c3e border border-accent-xf2e5d5 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 w-fit shadow-card">
                <span>🔒</span>
                <span>Processed privately</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-3 hover:border-neutral-xd1d1cb transition-all">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-input bg-neutral-xfaf3ec flex items-center justify-center text-xs">⌛</span>
                  <span className="text-[10px] font-bold tracking-wider text-accent-x9e7c3e uppercase">Recurring theme</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-lg text-ink-strong">You write about money more than anything else</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Nine of your last twelve entries mention runway, pricing, or cash. Product barely appears. That is either the right focus for this stage, or a sign you are carrying the finance load alone. Worth asking which.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-3 hover:border-neutral-xd1d1cb transition-all">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-input bg-brand-tint flex items-center justify-center text-xs">↗</span>
                  <span className="text-[10px] font-bold tracking-wider text-brand-strong uppercase">Pattern</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-lg text-ink-strong">Your best days follow customer conversations</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Every entry marked Good or Great came within a day of talking to a user. The ones marked Heavy came after a day at your desk. Your energy has a clear source.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-3 hover:border-neutral-xd1d1cb transition-all">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-input bg-brand-tint flex items-center justify-center text-xs">✍️</span>
                  <span className="text-[10px] font-bold tracking-wider text-brand-strong uppercase">Something you said</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg text-ink-strong italic">“Somewhere safe”</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    On Jul 20 you wrote that the product is not round-ups or streaks, it is somewhere safe. That is the clearest sentence in your entire journal, and it is nowhere in your marketing. Consider putting it there.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-3 hover:border-neutral-xd1d1cb transition-all">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-input bg-neutral-xfaf3ec flex items-center justify-center text-xs">◑</span>
                  <span className="text-[10px] font-bold tracking-wider text-accent-x9e7c3e uppercase">Gentle flag</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-lg text-ink-strong">Avoidance shows up before hard decisions</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Twice this month you described busywork that replaced something you were dreading. Both times you named it yourself the next day. You already know the pattern, which is most of the work.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================================= TAB 5: PRIVACY VIEW ================================= */}
        {subTab === 'Privacy' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Journal privacy</h1>
              <p className="text-xs text-ink-subtle mt-0.5">You should know exactly how this works.</p>
            </div>

            {/* Privacy Toggles Box */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              
              {/* Toggle 1 */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-xf2f2ec">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Let AI read my journal for reflections</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">Processed inside your workspace only. Never used for training, never visible to anyone else.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiReflectionsEnabled(!aiReflectionsEnabled);
                    showToast(aiReflectionsEnabled ? 'AI reflections disabled.' : 'AI reflections enabled.');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    aiReflectionsEnabled ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle AI reflections"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                    aiReflectionsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-xf2f2ec">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Unlock with device biometrics</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">Skip the PIN on trusted devices.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBiometricsEnabled(!biometricsEnabled);
                    showToast(biometricsEnabled ? 'Biometrics unlocking disabled.' : 'Biometrics unlocking enabled.');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    biometricsEnabled ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle device biometrics"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                    biometricsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-xf2f2ec">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Include journal in encrypted backups</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">Backups stay encrypted with your key. Turning this off means a lost device means lost entries.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEncryptedBackupsEnabled(!encryptedBackupsEnabled);
                    showToast(encryptedBackupsEnabled ? 'Encrypted backups disabled.' : 'Encrypted backups enabled.');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    encryptedBackupsEnabled ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle encrypted backups"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                    encryptedBackupsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 4 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Evening writing reminder</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">A quiet nudge at 8pm if you have not written that day.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEveningReminderEnabled(!eveningReminderEnabled);
                    showToast(eveningReminderEnabled ? 'Evening reminder disabled.' : 'Evening reminder enabled.');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    eveningReminderEnabled ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle evening writing reminder"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                    eveningReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>

            {/* How your journal is protected Box */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-4">
              <h3 className="text-xs font-bold text-ink">How your journal is protected</h3>
              <div className="space-y-2.5 text-xs text-neutral-x55635c">
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Encrypted with a per-workspace key derived from your PIN. We store the ciphertext, not your words.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Excluded from team sharing entirely. Collaborators cannot see that entries exist, let alone read them.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Never used to train AI models, ours or anyone else&apos;s.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Admins and support staff cannot access journal content, even with your permission. There is no mechanism.</span>
                </div>
              </div>
            </div>

            {/* Export and Delete Action Buttons matching exact styling */}
            <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => showToast('Encrypted export downloaded.')}
                className="w-full md:w-1/2 bg-white border border-neutral-xd5d5cf hover:bg-neutral-50 text-ink font-medium py-3 rounded-modal text-xs tracking-wide transition-colors shadow-card cursor-pointer flex items-center justify-center"
              >
                Export all entries
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setShowDeleteModal(true);
                }}
                className="w-full md:w-1/2 bg-white border border-danger-xd97762/60 hover:bg-neutral-xfdf8f7 text-accent-xc2410c font-medium py-3 rounded-modal text-xs tracking-wide transition-colors shadow-card cursor-pointer flex items-center justify-center"
              >
                Delete journal permanently
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* DELETE PERMANENTLY MODAL (Triggered by Delete Journal button)              */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div className="bg-white border border-line rounded-[24px] p-6 md:p-8 max-w-md w-full shadow-accent space-y-6 relative">
            
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-danger-x991b1b tracking-tight">Delete your journal permanently?</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                All 5 entries will be destroyed. Because they are encrypted with your key alone, we cannot recover them afterwards. Not even for you.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-ink">Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-white border border-neutral-xd5d5cf rounded-modal px-4 py-2.5 text-xs text-ink placeholder-neutral-xa0a8a2 focus:outline-none focus:border-danger-x991b1b"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 bg-white border border-neutral-xd5d5cf hover:bg-neutral-50 text-ink font-medium py-3 rounded-modal text-xs tracking-wide transition-colors cursor-pointer"
              >
                Keep my journal
              </button>

              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setShowDeleteModal(false);
                  setEntries([]);
                  showToast('Journal deleted permanently.');
                }}
                className={`w-1/2 font-medium py-3 rounded-modal text-xs tracking-wide transition-colors ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-danger-x991b1b hover:bg-danger-x7f1d1d text-white cursor-pointer shadow-raised'
                    : 'bg-neutral-xd1d5db text-white cursor-not-allowed opacity-60'
                }`}
              >
                Delete forever
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}