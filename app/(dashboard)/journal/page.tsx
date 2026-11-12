'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import { NotificationBell } from '@/components/notification-bell';
import {
  useJournal,
  type MoodType,
  getLocalTodayDateIso,
} from '@/hooks/useJournal';
import { API_TO_FE_MOOD, type JournalMood } from '@/lib/api/journal';
import {
  Menu,
  Lock,
  Search,
  X,
} from 'lucide-react';

type JournalSubTab = 'Today' | 'All entries' | 'Mood' | 'Reflections' | 'Privacy';

const MOODS: Array<{ name: MoodType; emoji: string }> = [
  { name: 'Rough', emoji: '😞' },
  { name: 'Heavy', emoji: '😥' },
  { name: 'Steady', emoji: '😐' },
  { name: 'Good', emoji: '🙂' },
  { name: 'Great', emoji: '😁' },
];

function formatDisplayDate(dateIso: string): string {
  if (!dateIso) return '';
  const [yyyy, mm, dd] = dateIso.split('-');
  if (!yyyy || !mm || !dd) return dateIso;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatShortDate(dateIso: string): string {
  if (!dateIso) return '';
  const [yyyy, mm, dd] = dateIso.split('-');
  if (!yyyy || !mm || !dd) return dateIso;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function JournalPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();

  const {
    isForbidden,
    isLocked,
    lockedUntil,
    settings,
    settingsError,
    fetchSettings,
    unlock,
    lock,
    updatePasscode,
    removePasscode,
    updateSettings,

    stats,
    statsError,
    prompt,
    promptError,
    dismissPrompt,
    nextLibraryPrompt,
    todayEntry,
    todayEntryLoading,
    todayError,
    loadTodayTab,
    saveToday,
    saving,
    discardToday,

    entries,
    entriesTotal,
    entriesLoading,
    entriesError,
    hasMoreEntries,
    loadMoreEntries,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    months,
    expandedEntryDetails,
    expandEntry,

    moodData,
    moodLoading,
    moodError,
    moodRange,
    setMoodRange,
    loadMood,

    insightsData,
    insightsLoading,
    insightsError,
    loadInsights,
    dismissSupportive,

    deleteEntireJournal,
    exportJournal,
    exporting,

    refetchAll,
  } = useJournal();

  // Navigation tab (default is 'Today' per handoff)
  const [subTab, setSubTab] = useState<JournalSubTab>('Today');

  // Lockout countdown timer
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      if (new Date(lockedUntil).getTime() - now <= 0) {
        void fetchSettings();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, fetchSettings]);

  // Lock screen inputs
  const [pinInput, setPinInput] = useState<string>('');
  const [lockError, setLockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  // Today editor states
  const [journalText, setJournalText] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Track if user has modified local editor state
  const isDirtyRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  // Autosave tracking ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTextRef = useRef<string>('');
  const lastSavedMoodRef = useRef<MoodType | null>(null);
  const lastSavedStressRef = useRef<number>(5);

  // Sync today's entry into editor ONLY when not dirty or on initial load
  useEffect(() => {
    if (isDirtyRef.current) {
      // User is typing/editing; do NOT overwrite!
      return;
    }
    queueMicrotask(() => {
      if (todayEntry) {
        setJournalText(todayEntry.content || '');
        const feMood = API_TO_FE_MOOD[todayEntry.mood] || 'Steady';
        setSelectedMood(feMood);
        setStressLevel(todayEntry.stress ?? 5);
        lastSavedTextRef.current = todayEntry.content || '';
        lastSavedMoodRef.current = feMood;
        lastSavedStressRef.current = todayEntry.stress ?? 5;
        initialSyncDoneRef.current = true;
      } else if (!initialSyncDoneRef.current) {
        setJournalText('');
        setSelectedMood(null);
        setStressLevel(5);
        lastSavedTextRef.current = '';
        lastSavedMoodRef.current = null;
        lastSavedStressRef.current = 5;
        initialSyncDoneRef.current = true;
      }
    });
  }, [todayEntry]);

  // Toast notification with memory leak guard
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string): void => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Today local date heading
  const localTodayIso = useMemo(() => getLocalTodayDateIso(), []);
  const todayDisplayHeading = useMemo(() => formatDisplayDate(localTodayIso), [localTodayIso]);

  // Track modifications
  const handleTextChange = (text: string) => {
    setJournalText(text);
    isDirtyRef.current = true;
    if (fieldErrors.content) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.content;
        return next;
      });
    }
  };

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    isDirtyRef.current = true;
    if (fieldErrors.mood) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.mood;
        return next;
      });
    }
  };

  const handleStressChange = (stress: number) => {
    setStressLevel(stress);
    isDirtyRef.current = true;
    if (fieldErrors.stress) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.stress;
        return next;
      });
    }
  };

  // Autosave effect (2 s debounce after last change when text + mood present)
  useEffect(() => {
    if (!journalText.trim() || !selectedMood || isLocked || isForbidden) {
      return;
    }

    // Check if dirty
    const isDirty =
      journalText !== lastSavedTextRef.current ||
      selectedMood !== lastSavedMoodRef.current ||
      stressLevel !== lastSavedStressRef.current;

    if (!isDirty) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const res = await saveToday(journalText, selectedMood, stressLevel);
      if (res.ok) {
        lastSavedTextRef.current = journalText;
        lastSavedMoodRef.current = selectedMood;
        lastSavedStressRef.current = stressLevel;
        isDirtyRef.current = false;
        setSaveStatus('saved');
        setSaveError(null);
        setFieldErrors({});
      } else {
        setSaveStatus('error');
        setSaveError(res.error || 'Could not save your entry.');
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [journalText, selectedMood, stressLevel, isLocked, isForbidden, saveToday]);

  // Manual save handler
  const handleSaveEntry = async () => {
    if (!journalText.trim()) {
      showToast('Please write something before saving.');
      return;
    }
    if (!selectedMood) {
      showToast('Please pick a mood before saving.');
      return;
    }

    setSaveStatus('saving');
    const res = await saveToday(journalText, selectedMood, stressLevel);
    if (res.ok) {
      lastSavedTextRef.current = journalText;
      lastSavedMoodRef.current = selectedMood;
      lastSavedStressRef.current = stressLevel;
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setSaveError(null);
      setFieldErrors({});
      setSubTab('All entries');
      showToast('Entry saved.');
    } else {
      setSaveStatus('error');
      setSaveError(res.error || 'Could not save your entry. Try again.');
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      showToast(res.error || 'Could not save your entry.');
    }
  };

  // Discard handler
  const handleDiscardClick = () => {
    if (todayEntry) {
      setShowDiscardConfirm(true);
    } else {
      setJournalText('');
      setSelectedMood(null);
      setStressLevel(5);
      isDirtyRef.current = false;
      setSaveStatus('idle');
      showToast('Entry discarded.');
    }
  };

  const handleConfirmDiscard = async () => {
    setShowDiscardConfirm(false);
    isDirtyRef.current = false;
    await discardToday();
    if (todayEntry) {
      setJournalText(todayEntry.content || '');
      setSelectedMood(API_TO_FE_MOOD[todayEntry.mood] || null);
      setStressLevel(todayEntry.stress ?? 5);
      lastSavedTextRef.current = todayEntry.content || '';
      lastSavedMoodRef.current = API_TO_FE_MOOD[todayEntry.mood] || null;
      lastSavedStressRef.current = todayEntry.stress ?? 5;
    }
    setSaveStatus('idle');
    setFieldErrors({});
    setSaveError(null);
    showToast('Changes discarded.');
  };

  // Word count
  const wordCount = useMemo(() => {
    const trimmed = journalText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [journalText]);

  // All entries expand state
  const [expandedEntryIds, setExpandedEntryIds] = useState<Record<string, boolean>>({});
  const toggleExpand = async (id: string) => {
    const next = !expandedEntryIds[id];
    setExpandedEntryIds((prev) => ({ ...prev, [id]: next }));
    if (next) {
      await expandEntry(id);
    }
  };

  // Privacy tab modals
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeMode, setPasscodeMode] = useState<'set' | 'change' | 'remove'>('set');
  const [currentPasscodeInput, setCurrentPasscodeInput] = useState('');
  const [newPasscodeInput, setNewPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [passcodeModalError, setPasscodeModalError] = useState<string | null>(null);
  const [passcodeModalBusy, setPasscodeModalBusy] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  // Escape key handler for open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardConfirm) setShowDiscardConfirm(false);
        if (showPasscodeModal) setShowPasscodeModal(false);
        if (showDeleteModal) setShowDeleteModal(false);
        if (showForgotModal) setShowForgotModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDiscardConfirm, showPasscodeModal, showDeleteModal, showForgotModal]);

  // Lock screen unlock
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setUnlocking(true);
    setLockError(null);
    const res = await unlock(pinInput);
    setUnlocking(false);
    if (!res.ok) {
      setLockError(res.error || 'That passcode did not match.');
    } else {
      setPinInput('');
    }
  };

  // Forgot passcode submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPassword) return;
    setForgotBusy(true);
    setForgotError(null);
    const res = await removePasscode(forgotPassword);
    setForgotBusy(false);
    if (res.ok) {
      setShowForgotModal(false);
      setForgotPassword('');
      showToast('Passcode removed.');
    } else {
      setForgotError(res.error || 'That password did not match.');
    }
  };

  // Passcode modal submit (Set, Change, Remove)
  const handlePasscodeModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeModalError(null);

    if (passcodeMode === 'remove') {
      if (!currentPasscodeInput) {
        setPasscodeModalError('Please enter your account password.');
        return;
      }
      setPasscodeModalBusy(true);
      const res = await removePasscode(currentPasscodeInput);
      setPasscodeModalBusy(false);
      if (res.ok) {
        setShowPasscodeModal(false);
        showToast('Passcode removed.');
      } else {
        setPasscodeModalError(res.error || 'That password did not match.');
      }
      return;
    }

    if (newPasscodeInput.length < 4 || newPasscodeInput.length > 12) {
      setPasscodeModalError('Passcode must be between 4 and 12 digits.');
      return;
    }
    if (newPasscodeInput !== confirmPasscodeInput) {
      setPasscodeModalError('Passcodes do not match.');
      return;
    }

    setPasscodeModalBusy(true);
    const res = await updatePasscode(newPasscodeInput, passcodeMode === 'change' ? currentPasscodeInput : undefined);
    setPasscodeModalBusy(false);

    if (res.ok) {
      setShowPasscodeModal(false);
      showToast(passcodeMode === 'change' ? 'Passcode updated.' : 'Passcode set.');
    } else {
      setPasscodeModalError(res.error || 'Could not update passcode.');
    }
  };

  // Delete journal submit
  const handleDeleteJournalSubmit = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteBusy(true);
    setDeleteModalError(null);
    const res = await deleteEntireJournal();
    setDeleteBusy(false);
    if (res.ok) {
      setShowDeleteModal(false);
      setSubTab('Today');
      showToast('Journal deleted permanently.');
    } else {
      setDeleteModalError(res.error || 'Could not delete journal.');
    }
  };

  // Export journal click
  const handleExportClick = async () => {
    const res = await exportJournal();
    if (res.ok) {
      showToast('Journal exported successfully.');
    } else {
      showToast(res.error || 'Could not download export. Please try again.');
    }
  };

  // 1. FORBIDDEN (NON-FOUNDER ACCESS) STATE
  if (isForbidden) {
    return (
      <div className="min-h-screen bg-surface-faint text-ink font-body antialiased flex flex-col justify-center items-center px-4">
        <div className="bg-white border border-line rounded-[24px] p-8 max-w-md w-full shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-ink">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-display text-ink tracking-tight">Private Journal</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            The journal is private to the founder.
          </p>
        </div>
      </div>
    );
  }

  // 2. EXPLICIT SETTINGS ERROR STATE
  if (settingsError) {
    return (
      <div className="min-h-screen bg-surface-faint text-ink font-body antialiased flex flex-col justify-center items-center px-4">
        <div className="bg-white border border-line rounded-[24px] p-8 max-w-md w-full shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mx-auto">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-display text-ink tracking-tight">Journal Unavailable</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            {settingsError}
          </p>
          <button
            type="button"
            onClick={() => void fetchSettings()}
            className="px-5 py-2.5 bg-accent-gold hover:bg-accent-xa38346 text-white text-xs font-semibold rounded-modal shadow-card transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. LOCKED SCREEN VIEW
  if (isLocked) {
    const remainingSeconds = lockedUntil
      ? Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - currentTime) / 1000))
      : 0;
    const isLockedOut = remainingSeconds > 0;

    return (
      <div className="min-h-screen bg-brand-x0e231b text-white font-body antialiased flex flex-col justify-between selection:bg-accent-gold">
        <header className="border-b border-brand-x1a382c px-4 md:px-6 py-3.5 flex items-center justify-between bg-brand-x0e231b w-full">
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
              <span className="text-brand-x8fb5a0">/</span>
              <span className="text-white flex items-center space-x-1.5">
                <span>Journal</span>
                <span className="text-accent-500 text-xs">🔒</span>
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-md mx-auto text-center space-y-6 w-full">
          <div className="w-14 h-14 rounded-[24px] bg-brand-x163326 border border-brand-x234f3a flex items-center justify-center text-accent-500 shadow-accent">
            <Lock size={24} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-display font-normal tracking-tight text-white">This one is only yours.</h1>
            <p className="text-xs text-neutral-x8ea094 leading-relaxed">
              Your journal is encrypted at rest. Private to you: your team, mentors and investors cannot see that entries exist.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="w-full space-y-3 pt-2">
            <div>
              <label htmlFor="journal-pin-input" className="sr-only">Passcode</label>
              <input
                id="journal-pin-input"
                type="password"
                disabled={isLockedOut || unlocking}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter your passcode"
                className="w-full bg-brand-x122b21 border border-brand-x1e4233 rounded-modal px-4 py-3 text-center text-sm text-white placeholder-brand-x556f60 focus:outline-none focus:border-accent-gold transition-colors disabled:opacity-50"
              />
              {isLockedOut && (
                <p className="text-xs text-danger-600 mt-2 text-center">
                  Too many wrong tries. Try again in {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s.
                </p>
              )}
              {lockError && !isLockedOut && (
                <p className="text-xs text-danger-600 mt-2 text-center">{lockError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLockedOut || unlocking || !pinInput.trim()}
              className="w-full bg-accent-gold hover:bg-accent-xa38346 text-white font-medium py-3 rounded-modal text-xs tracking-wide uppercase transition-colors shadow-raised cursor-pointer disabled:opacity-50"
            >
              {unlocking ? 'Unlocking...' : 'Unlock journal'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setForgotError(null);
              setForgotPassword('');
              setShowForgotModal(true);
            }}
            className="text-xs text-brand-x529e77 hover:text-brand-x65ba90 transition-colors font-medium cursor-pointer pt-2"
          >
            Forgot your passcode?
          </button>
        </div>

        <div className="pb-6" />

        {/* FORGOT PASSCODE MODAL */}
        {showForgotModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-passcode-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-accent max-w-md w-full space-y-4 text-left text-ink">
              <div className="flex items-center justify-between">
                <h3 id="forgot-passcode-title" className="text-base font-display text-ink">Reset passcode with password</h3>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-ink-muted hover:text-ink cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-ink-muted">
                Enter your account password to verify your identity and remove the journal passcode. Your entries remain safe.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-password-input" className="block text-xs font-bold text-ink mb-1">Account password</label>
                  <input
                    id="forgot-password-input"
                    type="password"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-line rounded-modal px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold"
                    autoFocus
                  />
                  {forgotError && (
                    <p className="text-xs text-danger-700 mt-1">{forgotError}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotBusy || !forgotPassword}
                    className="flex-1 px-4 py-2 bg-brand-strong hover:bg-brand-900 text-white rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                  >
                    {forgotBusy ? 'Verifying...' : 'Remove passcode'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. UNLOCKED MAIN VIEW
  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-brand-x1e4231">
          <span className="w-4 h-4 rounded-full bg-brand-x1c4230 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-line px-4 md:px-6 py-3.5 flex items-center justify-between bg-white w-full">
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
          {settings?.passcode_enabled && (
            <button
              onClick={() => {
                void lock();
                showToast('Journal locked.');
              }}
              className="border border-line-stone bg-white hover:bg-neutral-50 text-ink px-3.5 py-1.5 rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px] cursor-pointer"
            >
              <Lock size={13} className="text-neutral-x7a8a80" />
              <span>Lock journal</span>
            </button>
          )}

          <NotificationBell />
        </div>
      </header>

      {/* Sub-Navbar Tabs */}
      <nav className="w-full bg-surface-subtle border-b border-line px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {(['Today', 'All entries', 'Mood', 'Reflections', 'Privacy'] as JournalSubTab[]).map((tab) => {
            const isActive = subTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={
                  isActive
                    ? 'px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors shrink-0 cursor-pointer'
                    : 'px-4 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors shrink-0 cursor-pointer'
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* ================================= TAB 1: TODAY VIEW ================================= */}
        {subTab === 'Today' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-neutral-xf2f2ec pb-4">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">{todayDisplayHeading}</h1>
                <p className="text-xs text-ink-subtle mt-0.5">
                  {todayEntry ? "Editing today's entry" : 'Nobody reads this but you.'}
                </p>
              </div>
              {stats && stats.entries_this_month > 0 && (
                <div className="bg-neutral-xfaf3ec text-accent-x9e7c3e border border-accent-xf2e5d5 px-3.5 py-1.5 rounded-modal text-xs font-semibold flex items-center space-x-1.5 w-fit">
                  <span>🔥</span>
                  <span>{stats.entries_this_month} {stats.entries_this_month === 1 ? 'entry' : 'entries'} this month</span>
                </div>
              )}
            </div>

            {/* Error banner if stats, prompt, or today read failed */}
            {(statsError || promptError || todayError) && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                <span>{statsError || promptError || todayError}</span>
                <button
                  type="button"
                  onClick={() => void loadTodayTab()}
                  className="font-semibold underline cursor-pointer ml-3 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {todayEntryLoading && !todayEntry && (
              <div className="p-4 bg-white border border-line rounded-[24px] shadow-card text-center text-xs text-ink-subtle">
                Loading today&apos;s entry...
              </div>
            )}

            {/* Mood selector */}
            <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-3">
              <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">How is today going?</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3" role="group" aria-label="Select mood">
                {MOODS.map((m) => {
                  const isSelected = selectedMood === m.name;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={m.name}
                      onClick={() => handleMoodSelect(m.name)}
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
              {fieldErrors.mood && (
                <p className="text-xs text-danger-700">{fieldErrors.mood}</p>
              )}
            </div>

            {/* Stress level slider */}
            <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Stress level</span>
                <span className="text-xs font-semibold text-ink">{stressLevel} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={stressLevel}
                onChange={(e) => handleStressChange(Number(e.target.value))}
                className="w-full accent-accent-gold cursor-pointer"
                aria-label="Stress level"
              />
              <div className="flex justify-between text-[10px] text-ink-subtle">
                <span>1 - Minimal</span>
                <span>5 - Moderate</span>
                <span>10 - Critical</span>
              </div>
              {fieldErrors.stress && (
                <p className="text-xs text-danger-700">{fieldErrors.stress}</p>
              )}
            </div>

            {/* Prompt card */}
            {prompt && !prompt.dismissed && (
              <div className="bg-neutral-xf4efe6 border border-accent-xebe3d3 rounded-[24px] p-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 text-accent-x5a4d35 pr-4">
                  <span className="p-2 bg-accent-xe2d4bc rounded-card">✏️</span>
                  <span className="font-medium">
                    <strong>Today&apos;s prompt:</strong> {prompt.prompt}
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => void nextLibraryPrompt()}
                    className="text-accent-x9e7c3e font-semibold hover:underline cursor-pointer"
                  >
                    Another →
                  </button>
                  <button
                    onClick={() => void dismissPrompt()}
                    className="text-ink-subtle hover:text-ink p-1 cursor-pointer"
                    aria-label="Dismiss prompt"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Editor card */}
            <div className="bg-white border border-line rounded-[24px] shadow-card p-6 space-y-4">
              <label htmlFor="journal-editor-textarea" className="sr-only">Journal entry content</label>
              <textarea
                id="journal-editor-textarea"
                value={journalText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Start anywhere. Half-formed thoughts are still worth keeping."
                rows={12}
                className="w-full focus:outline-none text-sm text-ink placeholder-neutral-xa0a8a2 resize-none leading-relaxed"
              />

              {fieldErrors.content && (
                <p className="text-xs text-danger-700">{fieldErrors.content}</p>
              )}
              {saveError && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                  <span>{saveError}</span>
                  <button
                    type="button"
                    onClick={() => void handleSaveEntry()}
                    className="font-semibold underline cursor-pointer ml-3 shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="border-t border-neutral-xf2f2ec pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-xs text-ink-subtle">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span className="text-brand-strong font-medium flex items-center space-x-1">
                    <span>🔒</span>
                    <span>Encrypted when saved</span>
                  </span>
                  <span>•</span>
                  <span className="text-ink-subtle font-medium">
                    {saveStatus === 'saving'
                      ? 'Saving...'
                      : saveStatus === 'saved'
                      ? 'Saved'
                      : !selectedMood && journalText.trim()
                      ? 'Pick a mood to save'
                      : ''}
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
                  <button
                    onClick={handleDiscardClick}
                    className="px-4 py-2 rounded-modal text-xs font-semibold border border-line-stone bg-white text-ink hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => void handleSaveEntry()}
                    disabled={saving}
                    className="px-5 py-2 rounded-modal text-xs font-semibold bg-accent-gold hover:bg-accent-xa38346 text-white transition-colors shadow-card cursor-pointer disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save entry'}
                  </button>
                </div>
              </div>
            </div>

            {/* DISCARD CONFIRMATION MODAL */}
            {showDiscardConfirm && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="discard-dialog-title"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
              >
                <div className="bg-white border border-line rounded-[24px] p-6 shadow-accent max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
                  <h3 id="discard-dialog-title" className="text-base font-display text-ink">Discard changes?</h3>
                  <p className="text-xs text-ink-muted">
                    Discard your changes? Your saved entry stays.
                  </p>
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(false)}
                      className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors"
                    >
                      Keep editing
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmDiscard()}
                      className="flex-1 px-4 py-2 bg-danger-bold hover:bg-danger-800 text-white rounded-modal text-xs font-semibold shadow-card transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================= TAB 2: ALL ENTRIES VIEW ================================= */}
        {subTab === 'All entries' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">All entries</h1>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                {/* Month Jump Selector */}
                {months.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full md:w-auto bg-white border border-line rounded-modal px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold pr-8 cursor-pointer"
                      aria-label="Filter by month"
                    >
                      <option value="">All months</option>
                      {months.map((m) => (
                        <option key={m.month} value={m.month}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Search Box */}
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
            </div>

            {/* Error state */}
            {entriesError && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                <span>{entriesError}</span>
                <button
                  type="button"
                  onClick={() => void refetchAll()}
                  className="font-semibold underline cursor-pointer ml-3"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading skeletons */}
            {entriesLoading && entries.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-3 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/4" />
                    <div className="h-3 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!entriesLoading && entries.length === 0 && !entriesError && (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card space-y-4">
                <p className="text-xs text-ink-muted leading-relaxed">
                  {searchQuery || selectedMonth
                    ? 'No entries match.'
                    : 'Your first entry is two minutes away.'}
                </p>
                {!searchQuery && !selectedMonth && (
                  <button
                    type="button"
                    onClick={() => setSubTab('Today')}
                    className="px-5 py-2.5 bg-accent-gold hover:bg-accent-xa38346 text-white text-xs font-semibold rounded-modal shadow-card transition-colors cursor-pointer"
                  >
                    Write today&apos;s entry
                  </button>
                )}
              </div>
            )}

            {/* Entries cards */}
            <div className="space-y-4">
              {entries.map((entry) => {
                const isExpanded = !!expandedEntryIds[entry.id];
                const detail = expandedEntryDetails[entry.id];
                const moodObj = MOODS.find((m) => m.name === API_TO_FE_MOOD[entry.mood]);

                return (
                  <div
                    key={entry.id}
                    className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-4 hover:border-neutral-xd1d1cb transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-xf2f2ec pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-card bg-neutral-xfaf3ec flex items-center justify-center text-sm shadow-card">
                          {moodObj?.emoji || '😐'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-ink">{formatShortDate(entry.date)}</h3>
                          <span className="text-[10px] text-ink-subtle">{entry.word_count} words</span>
                        </div>
                      </div>
                      <button
                        onClick={() => void toggleExpand(entry.id)}
                        className="w-7 h-7 rounded-card border border-line-stone bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                        aria-label={isExpanded ? 'Collapse entry' : 'Expand entry'}
                      >
                        {isExpanded ? '-' : '+'}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-ink leading-relaxed">
                      {isExpanded ? (
                        <div className="space-y-3 whitespace-pre-line pt-1">
                          <p className="text-ink font-normal">{detail?.content || entry.preview}</p>
                        </div>
                      ) : (
                        <p className="text-ink-muted">{entry.preview || entry.first_line}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more button */}
            {hasMoreEntries && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={entriesLoading}
                  onClick={() => void loadMoreEntries()}
                  className="px-6 py-2.5 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors cursor-pointer shadow-card disabled:opacity-50"
                >
                  {entriesLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================= TAB 3: MOOD VIEW ================================= */}
        {subTab === 'Mood' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Mood over time</h1>
              <p className="text-xs text-ink-subtle mt-0.5">The founder journey has a shape. Seeing it helps.</p>
            </div>

            {moodError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                <span>{moodError}</span>
                <button
                  type="button"
                  onClick={() => void loadMood(moodRange)}
                  className="font-semibold underline cursor-pointer ml-3 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {moodLoading && !moodData && (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card text-xs text-ink-subtle">
                Loading mood trend...
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Entries this month</span>
                <div className="text-3xl font-display text-ink-strong pt-1">
                  {stats?.entries_this_month ?? 0}
                </div>
                {stats?.entries_per_week !== undefined && (
                  <div className="text-xs text-ink-subtle pt-0.5">
                    about {stats.entries_per_week} a week
                  </div>
                )}
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Average mood</span>
                <div className="text-3xl font-display text-ink-strong pt-1">
                  {stats?.average_mood ? API_TO_FE_MOOD[stats.average_mood] : 'None yet'}
                </div>
                {stats?.previous_month_average_mood?.mood && (
                  <div className="text-xs text-ink-subtle pt-0.5">
                    up from {API_TO_FE_MOOD[stats.previous_month_average_mood.mood]} in {stats.previous_month_average_mood.month || 'previous month'}
                  </div>
                )}
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Longest streak</span>
                <div className="text-3xl font-display text-ink-strong pt-1">
                  {stats?.longest_streak_days ?? 0} {stats?.longest_streak_days === 1 ? 'day' : 'days'}
                </div>
                {stats?.longest_streak_ended_on && (
                  <div className="text-xs text-ink-subtle pt-0.5">
                    in {new Date(stats.longest_streak_ended_on).toLocaleDateString('en-US', { month: 'long' })}
                  </div>
                )}
              </div>
            </div>

            {/* Mood Chart Card */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold tracking-wider text-ink-subtle uppercase">Last 12 weeks</div>
                <div className="flex items-center space-x-1 text-xs">
                  {(['4w', '12w', '6m', '1y'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setMoodRange(r)}
                      className={`px-2 py-1 rounded-card transition-colors ${
                        moodRange === r ? 'bg-accent-200 font-semibold text-ink' : 'text-ink-subtle hover:text-ink'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {(!moodData || moodData.points.length < 2) ? (
                <div className="py-12 text-center text-xs text-ink-muted">
                  Write a few more entries to see your shape.
                </div>
              ) : (
                <div className="relative h-48 w-full pt-4 pb-2">
                  <div className="absolute inset-x-0 top-8 border-t border-neutral-xf2f2ec" />
                  <div className="absolute inset-x-0 top-20 border-t border-neutral-xf2f2ec" />
                  <div className="absolute inset-x-0 top-32 border-t border-neutral-xf2f2ec" />

                  {/* SVG Line based on real points */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 160">
                    {(() => {
                      const pts = moodData.points;
                      const moodMap: Record<JournalMood, number> = { rough: 1, meh: 2, okay: 3, good: 4, great: 5 };
                      const coords = pts.map((p, idx) => {
                        const x = pts.length > 1 ? (idx / (pts.length - 1)) * 720 + 40 : 400;
                        const yVal = moodMap[p.mood] ?? 3;
                        // yVal 5 is top (30px), 1 is bottom (130px)
                        const y = 130 - (yVal - 1) * 25;
                        return { x, y, point: p };
                      });

                      const dPath = coords.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x},${curr.y}`, '');

                      return (
                        <>
                          <path
                            d={dPath}
                            fill="none"
                            stroke="var(--color-brand-strong)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {coords.map((c, i) => (
                            <circle
                              key={i}
                              cx={c.x}
                              cy={c.y}
                              r="4.5"
                              className="fill-brand-strong stroke-white stroke-2 cursor-pointer hover:scale-150 transition-transform"
                            >
                              <title>{`${c.point.date}: ${API_TO_FE_MOOD[c.point.mood]} (stress: ${c.point.stress})`}</title>
                            </circle>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}

              {/* Month markers at the bottom */}
              {moodData && moodData.points.length >= 2 && (
                <div className="flex justify-between text-[11px] text-ink-subtle pt-2 border-t border-neutral-xf2f2ec">
                  <span>{new Date(moodData.points[0].date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span>{new Date(moodData.points[Math.floor(moodData.points.length / 2)].date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span>{new Date(moodData.points[moodData.points.length - 1].date).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
              )}
            </div>

            {/* Pattern Card (first insight item if present) */}
            {insightsData && insightsData.insights.length > 0 && (
              <div className="bg-brand-x12231b border border-brand-x1a382c rounded-[24px] p-5 flex items-start space-x-4 shadow-raised text-white">
                <div className="w-8 h-8 rounded-modal bg-brand-x1b382c border border-brand-x234d3a flex items-center justify-center text-accent-500 shrink-0 mt-0.5">
                  ✦
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold tracking-wide text-white">{insightsData.insights[0].title}</h4>
                  <p className="text-xs text-neutral-xa3b2a8 leading-relaxed">
                    {insightsData.insights[0].body}
                  </p>
                </div>
              </div>
            )}

            {/* Supportive Card if returned */}
            {insightsData?.supportive_card && (
              <div className="bg-neutral-xf4efe6 border border-accent-xebe3d3 rounded-[24px] p-5 flex items-start justify-between shadow-card text-ink">
                <div className="space-y-1 pr-4">
                  <h4 className="text-xs font-semibold text-ink">{insightsData.supportive_card.title}</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">{insightsData.supportive_card.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void dismissSupportive()}
                  className="text-xs text-ink-subtle hover:text-ink shrink-0 underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================= TAB 4: REFLECTIONS VIEW ================================= */}
        {subTab === 'Reflections' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Reflections</h1>
                <p className="text-xs text-ink-subtle mt-0.5">Patterns drawn from your mood and stress ratings. Nothing here leaves your workspace.</p>
              </div>
              <div className="bg-neutral-xfaf3ec text-accent-x9e7c3e border border-accent-xf2e5d5 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 w-fit shadow-card">
                <span>🔒</span>
                <span>Computed from your mood and stress ratings only</span>
              </div>
            </div>

            {insightsError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                <span>{insightsError}</span>
                <button
                  type="button"
                  onClick={() => void loadInsights()}
                  className="font-semibold underline cursor-pointer ml-3 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {insightsLoading && !insightsData && (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card text-xs text-ink-subtle">
                Analyzing reflections...
              </div>
            )}

            {insightsData && insightsData.entries_needed > 0 && (
              <div className="bg-white border border-line rounded-[24px] p-8 text-center shadow-card text-xs text-ink-muted">
                Write {insightsData.entries_needed} more {insightsData.entries_needed === 1 ? 'entry' : 'entries'} to see patterns.
              </div>
            )}

            {/* Supportive card */}
            {insightsData?.supportive_card && (
              <div className="bg-neutral-xf4efe6 border border-accent-xebe3d3 rounded-[24px] p-5 flex items-start justify-between shadow-card text-ink">
                <div className="space-y-1 pr-4">
                  <h4 className="text-xs font-semibold text-ink">{insightsData.supportive_card.title}</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">{insightsData.supportive_card.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void dismissSupportive()}
                  className="text-xs text-ink-subtle hover:text-ink shrink-0 underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Insights Cards */}
            <div className="space-y-4">
              {insightsData?.insights.map((item, i) => {
                const kicker =
                  item.kind === 'streak' || item.kind === 'great_days'
                    ? 'Worth noticing'
                    : 'Pattern';

                return (
                  <div
                    key={i}
                    className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-3 hover:border-neutral-xd1d1cb transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-input bg-brand-tint flex items-center justify-center text-xs">↗</span>
                      <span className="text-[10px] font-bold tracking-wider text-brand-strong uppercase">{kicker}</span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display text-lg text-ink-strong">{item.title}</h3>
                      <p className="text-xs text-ink-muted leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer disclaimer per brief */}
            <div className="text-center text-[11px] text-ink-subtle pt-4">
              This is reflection, not therapy. Use what helps, leave what does not.
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

            {/* Real Toggles Box */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              {/* Daily prompt notification */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-xf2f2ec">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Daily prompt notification</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">Today&apos;s prompt in your notifications at 9am.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!settings?.daily_prompt_notifications}
                  onClick={() => {
                    const nextVal = !settings?.daily_prompt_notifications;
                    void updateSettings({ daily_prompt_notifications: nextVal });
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    settings?.daily_prompt_notifications ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle daily prompt notifications"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                      settings?.daily_prompt_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Evening writing reminder */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-xf2f2ec">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Evening writing reminder</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">A quiet nudge at 8pm if you have not written that day.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!settings?.evening_reminder}
                  onClick={() => {
                    const nextVal = !settings?.evening_reminder;
                    void updateSettings({ evening_reminder: nextVal });
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    settings?.evening_reminder ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle evening writing reminder"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                      settings?.evening_reminder ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Passcode lock control */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 pr-4">
                  <h3 className="text-xs font-bold text-ink">Passcode lock</h3>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">
                    {settings?.passcode_enabled
                      ? 'Passcode protection is active. Require your PIN to unlock journal entries.'
                      : 'Lock your journal behind a 4 to 12 digit passcode.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {settings?.passcode_enabled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPasscodeMode('change');
                          setCurrentPasscodeInput('');
                          setNewPasscodeInput('');
                          setConfirmPasscodeInput('');
                          setPasscodeModalError(null);
                          setShowPasscodeModal(true);
                        }}
                        className="px-3 py-1.5 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        Change passcode
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasscodeMode('remove');
                          setCurrentPasscodeInput('');
                          setPasscodeModalError(null);
                          setShowPasscodeModal(true);
                        }}
                        className="px-3 py-1.5 bg-white border border-danger-200 text-danger-700 hover:bg-danger-50 rounded-modal text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Remove passcode
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPasscodeMode('set');
                        setCurrentPasscodeInput('');
                        setNewPasscodeInput('');
                        setConfirmPasscodeInput('');
                        setPasscodeModalError(null);
                        setShowPasscodeModal(true);
                      }}
                      className="px-4 py-1.5 bg-brand-strong hover:bg-brand-900 text-white rounded-modal text-xs font-semibold shadow-card transition-colors cursor-pointer"
                    >
                      Set a passcode
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* How your journal is protected Box - Exact copy per handoff */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-4">
              <h3 className="text-xs font-bold text-ink">How your journal is protected</h3>
              <div className="space-y-2.5 text-xs text-neutral-x55635c">
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Encrypted at rest. We store your entries as ciphertext, not plain text.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Private to you. Your team, mentors and investors cannot see that entries exist.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Never used to train AI models, ours or anyone else&apos;s.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-tint text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Our assistant and every Cofoundaz feature are blocked from reading your entries.</span>
                </div>
              </div>
            </div>

            {/* Export and Delete Action Buttons */}
            <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
              <button
                type="button"
                disabled={exporting}
                onClick={() => void handleExportClick()}
                className="w-full md:w-1/2 bg-white border border-neutral-xd5d5cf hover:bg-neutral-50 text-ink font-medium py-3 rounded-modal text-xs tracking-wide transition-colors shadow-card cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {exporting ? 'Downloading...' : 'Download all entries'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setDeleteModalError(null);
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

      {/* PASSCODE SET / CHANGE / REMOVE MODAL */}
      {showPasscodeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="passcode-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white border border-line rounded-[24px] p-6 md:p-8 max-w-md w-full shadow-accent space-y-5">
            <div className="flex items-center justify-between">
              <h3 id="passcode-dialog-title" className="text-base font-display text-ink">
                {passcodeMode === 'set' && 'Set journal passcode'}
                {passcodeMode === 'change' && 'Change journal passcode'}
                {passcodeMode === 'remove' && 'Remove journal passcode'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPasscodeModal(false)}
                className="text-ink-muted hover:text-ink cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasscodeModalSubmit} className="space-y-4">
              {passcodeMode === 'remove' ? (
                <div>
                  <label htmlFor="passcode-remove-password" className="block text-xs font-bold text-ink mb-1">Account password</label>
                  <input
                    id="passcode-remove-password"
                    type="password"
                    value={currentPasscodeInput}
                    onChange={(e) => setCurrentPasscodeInput(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full border border-line rounded-modal px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  {passcodeMode === 'change' && (
                    <div>
                      <label htmlFor="passcode-current" className="block text-xs font-bold text-ink mb-1">Current passcode</label>
                      <input
                        id="passcode-current"
                        type="password"
                        value={currentPasscodeInput}
                        onChange={(e) => setCurrentPasscodeInput(e.target.value)}
                        placeholder="Current passcode"
                        className="w-full border border-line rounded-modal px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold"
                        autoFocus
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="passcode-new" className="block text-xs font-bold text-ink mb-1">
                      {passcodeMode === 'change' ? 'New passcode (4 to 12 digits)' : 'Passcode (4 to 12 digits)'}
                    </label>
                    <input
                      id="passcode-new"
                      type="password"
                      value={newPasscodeInput}
                      onChange={(e) => setNewPasscodeInput(e.target.value)}
                      placeholder="4 to 12 digits"
                      className="w-full border border-line rounded-modal px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold"
                      autoFocus={passcodeMode === 'set'}
                    />
                  </div>

                  <div>
                    <label htmlFor="passcode-confirm" className="block text-xs font-bold text-ink mb-1">Confirm passcode</label>
                    <input
                      id="passcode-confirm"
                      type="password"
                      value={confirmPasscodeInput}
                      onChange={(e) => setConfirmPasscodeInput(e.target.value)}
                      placeholder="Repeat passcode"
                      className="w-full border border-line rounded-modal px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                </>
              )}

              {passcodeModalError && (
                <p className="text-xs text-danger-700">{passcodeModalError}</p>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passcodeModalBusy}
                  className="flex-1 px-4 py-2 bg-brand-strong hover:bg-brand-900 text-white rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                >
                  {passcodeModalBusy ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PERMANENTLY MODAL */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-journal-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-in fade-in duration-200"
        >
          <div className="bg-white border border-line rounded-[24px] p-6 md:p-8 max-w-md w-full shadow-accent space-y-6 relative">
            <div className="space-y-2">
              <h2 id="delete-journal-dialog-title" className="text-2xl font-display text-danger-x991b1b tracking-tight">Delete your journal permanently?</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                All {stats?.total_entries ?? entriesTotal} entries will be destroyed. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="delete-confirm-input" className="block text-xs font-bold text-ink">Type DELETE to confirm</label>
              <input
                id="delete-confirm-input"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-white border border-neutral-xd5d5cf rounded-modal px-4 py-2.5 text-xs text-ink placeholder-neutral-xa0a8a2 focus:outline-none focus:border-danger-x991b1b"
                autoFocus
              />
              {deleteModalError && (
                <p className="text-xs text-danger-700">{deleteModalError}</p>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 bg-white border border-neutral-xd5d5cf hover:bg-neutral-50 text-ink font-medium py-3 rounded-modal text-xs tracking-wide transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep my journal
              </button>

              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deleteBusy}
                onClick={() => void handleDeleteJournalSubmit()}
                className={`w-1/2 font-medium py-3 rounded-modal text-xs tracking-wide transition-colors ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-danger-x991b1b hover:bg-danger-x7f1d1d text-white cursor-pointer shadow-raised'
                    : 'bg-neutral-xd1d5db text-white cursor-not-allowed opacity-60'
                }`}
              >
                {deleteBusy ? 'Deleting...' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
