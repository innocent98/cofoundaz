import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  getJournalSettings,
  updateJournalSettings,
  unlockJournal,
  lockJournal,
  setJournalPasscode,
  changeJournalPasscode,
  removeJournalPasscodeWithPassword,
  getJournalStats,
  getTodayPrompt,
  dismissTodayPrompt,
  getPromptLibrary,
  getEntryByDate,
  getEntryById,
  saveJournalEntry,
  listJournalEntries,
  getJournalMonths,
  getMoodTrend,
  getJournalInsights,
  dismissSupportiveCard,
  deleteJournal,
  subscribeToLockEvent,
  getJournalToken,
  setJournalToken,
  type JournalSettings,
  type JournalStats,
  type JournalPrompt,
  type JournalEntryListItem,
  type JournalEntryDetail,
  type MonthOption,
  type MoodData,
  type JournalInsightsResponse,
  type FeMood,
  FE_TO_API_MOOD,
} from '@/lib/api/journal';

export type MoodType = FeMood;

export interface UseJournalReturn {
  // Access state
  isForbidden: boolean;
  // Lock state
  isLocked: boolean;
  lockedUntil: string | null;
  settings: JournalSettings | null;
  settingsLoading: boolean;
  unlock: (passcode: string) => Promise<{ ok: boolean; error?: string; lockedOut?: boolean }>;
  lock: () => Promise<void>;
  updatePasscode: (passcode: string, currentPasscode?: string) => Promise<{ ok: boolean; error?: string }>;
  removePasscode: (password: string) => Promise<{ ok: boolean; error?: string }>;
  updateSettings: (patch: Partial<Pick<JournalSettings, 'daily_prompt_notifications' | 'evening_reminder'>>) => Promise<boolean>;

  // Today tab
  stats: JournalStats | null;
  statsLoading: boolean;
  prompt: JournalPrompt | null;
  dismissPrompt: () => Promise<void>;
  nextLibraryPrompt: () => Promise<void>;
  todayEntry: JournalEntryDetail | null;
  loadTodayEntry: () => Promise<void>;
  saveToday: (content: string, mood: MoodType, stress: number) => Promise<{ ok: boolean; unavailable?: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  saving: boolean;
  discardToday: () => Promise<void>;

  // All entries tab
  entries: JournalEntryListItem[];
  entriesTotal: number;
  entriesLoading: boolean;
  entriesError: string | null;
  hasMoreEntries: boolean;
  loadMoreEntries: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  months: MonthOption[];
  expandedEntryDetails: Record<string, JournalEntryDetail>;
  expandEntry: (id: string) => Promise<void>;

  // Mood tab
  moodData: MoodData | null;
  moodLoading: boolean;
  moodRange: '4w' | '12w' | '6m' | '1y';
  setMoodRange: (r: '4w' | '12w' | '6m' | '1y') => void;

  // Reflections tab
  insightsData: JournalInsightsResponse | null;
  insightsLoading: boolean;
  dismissSupportive: () => Promise<void>;

  // Privacy tab
  deleteEntireJournal: () => Promise<{ ok: boolean; error?: string }>;
  exportJournal: () => Promise<boolean>;
  exporting: boolean;

  // General refetch
  refetchAll: () => Promise<void>;
}

export function getLocalTodayDateIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useJournal(): UseJournalReturn {
  const [isForbidden, setIsForbidden] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [settings, setSettings] = useState<JournalSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Today tab states
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [libraryPrompts, setLibraryPrompts] = useState<JournalPrompt[]>([]);
  const libraryIndexRef = useRef<number>(0);
  const [todayEntry, setTodayEntry] = useState<JournalEntryDetail | null>(null);
  const [saving, setSaving] = useState(false);

  // All entries tab states
  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [expandedEntryDetails, setExpandedEntryDetails] = useState<Record<string, JournalEntryDetail>>({});

  // Mood tab states
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodRange, setMoodRange] = useState<'4w' | '12w' | '6m' | '1y'>('12w');

  // Reflections tab states
  const [insightsData, setInsightsData] = useState<JournalInsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Privacy tab export
  const [exporting, setExporting] = useState(false);

  // Auto-subscribe to 423 lock events
  useEffect(() => {
    return subscribeToLockEvent(() => {
      setIsLocked(true);
    });
  }, []);

  // Check initial settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const s = await getJournalSettings();
      setSettings(s);
      setLockedUntil(s.locked_until);
      if (s.passcode_enabled && !getJournalToken()) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setIsForbidden(true);
      }
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchSettings();
    });
  }, [fetchSettings]);

  // Load Today Tab data
  const loadTodayTab = useCallback(async () => {
    if (isForbidden || isLocked) return;
    const localToday = getLocalTodayDateIso();
    setStatsLoading(true);

    try {
      const [statsRes, promptRes, entryRes] = await Promise.allSettled([
        getJournalStats(localToday),
        getTodayPrompt(),
        getEntryByDate(localToday),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (promptRes.status === 'fulfilled') setPrompt(promptRes.value);
      if (entryRes.status === 'fulfilled') setTodayEntry(entryRes.value);
    } finally {
      setStatsLoading(false);
    }
  }, [isForbidden, isLocked]);

  // Load All entries data
  const loadEntries = useCallback(async (currentSkip = 0, currentSearch = searchQuery, currentMonth = selectedMonth) => {
    if (isForbidden || isLocked) return;
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const res = await listJournalEntries({
        skip: currentSkip,
        limit: 20,
        search: currentSearch || undefined,
        month: currentMonth || undefined,
      });

      if (currentSkip === 0) {
        setEntries(res.entries);
      } else {
        setEntries((prev) => [...prev, ...res.entries]);
      }
      setEntriesTotal(res.total ?? (currentSkip + res.entries.length));
      setSkip(currentSkip);
    } catch (err) {
      setEntriesError(err instanceof Error ? err.message : 'Could not load entries.');
    } finally {
      setEntriesLoading(false);
    }
  }, [isForbidden, isLocked, searchQuery, selectedMonth]);

  // Load Months
  const loadMonths = useCallback(async () => {
    if (isForbidden || isLocked) return;
    try {
      const m = await getJournalMonths();
      setMonths(m);
    } catch {
      /* ignore */
    }
  }, [isForbidden, isLocked]);

  // Load Mood
  const loadMood = useCallback(async (range = moodRange) => {
    if (isForbidden || isLocked) return;
    setMoodLoading(true);
    try {
      const m = await getMoodTrend(range);
      setMoodData(m);
    } catch {
      /* ignore */
    } finally {
      setMoodLoading(false);
    }
  }, [isForbidden, isLocked, moodRange]);

  // Load Insights
  const loadInsights = useCallback(async () => {
    if (isForbidden || isLocked) return;
    const localToday = getLocalTodayDateIso();
    setInsightsLoading(true);
    try {
      const ins = await getJournalInsights(localToday);
      setInsightsData(ins);
    } catch {
      /* ignore */
    } finally {
      setInsightsLoading(false);
    }
  }, [isForbidden, isLocked]);

  // Master load
  const refetchAll = useCallback(async () => {
    if (isForbidden || isLocked) return;
    await Promise.allSettled([
      loadTodayTab(),
      loadEntries(0),
      loadMonths(),
      loadMood(),
      loadInsights(),
    ]);
  }, [isForbidden, isLocked, loadTodayTab, loadEntries, loadMonths, loadMood, loadInsights]);

  useEffect(() => {
    if (!isLocked && !isForbidden && settings) {
      queueMicrotask(() => {
        void refetchAll();
      });
    }
  }, [isLocked, isForbidden, settings, refetchAll]);

  // Unlock handler
  const unlock = async (passcode: string) => {
    try {
      await unlockJournal(passcode);
      setIsLocked(false);
      setLockedUntil(null);
      void refetchAll();
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          // Locked out
          void fetchSettings();
          return {
            ok: false,
            lockedOut: true,
            error: 'Too many wrong tries. Try again in a few minutes.',
          };
        }
        if (err.status === 403) {
          return { ok: false, error: 'That passcode did not match.' };
        }
      }
      return { ok: false, error: 'Could not unlock journal.' };
    }
  };

  // Lock handler
  const lock = async () => {
    try {
      await lockJournal();
    } catch {
      setJournalToken(null);
      setIsLocked(true);
    }
  };

  // Update passcode
  const updatePasscode = async (passcode: string, currentPasscode?: string) => {
    try {
      if (currentPasscode) {
        await changeJournalPasscode(currentPasscode, passcode);
      } else {
        await setJournalPasscode(passcode);
      }
      await fetchSettings();
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        return { ok: false, error: 'That passcode did not match.' };
      }
      return { ok: false, error: err instanceof Error ? err.message : 'Could not set passcode.' };
    }
  };

  // Remove passcode
  const removePasscode = async (password: string) => {
    try {
      const s = await removeJournalPasscodeWithPassword(password);
      setSettings(s);
      setIsLocked(false);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        return { ok: false, error: 'That password did not match.' };
      }
      return { ok: false, error: err instanceof Error ? err.message : 'Could not remove passcode.' };
    }
  };

  // Update settings (toggles)
  const updateSettings = async (patch: Partial<Pick<JournalSettings, 'daily_prompt_notifications' | 'evening_reminder'>>) => {
    const prev = settings;
    if (prev) {
      setSettings({ ...prev, ...patch });
    }
    try {
      const updated = await updateJournalSettings(patch);
      setSettings(updated);
      return true;
    } catch {
      // rollback
      setSettings(prev);
      return false;
    }
  };

  // Today prompt dismiss
  const dismissPrompt = async () => {
    setPrompt(null);
    try {
      await dismissTodayPrompt();
    } catch {
      /* ignore */
    }
  };

  // Cycle library prompt
  const nextLibraryPrompt = async () => {
    try {
      let lib = libraryPrompts;
      if (lib.length === 0) {
        lib = await getPromptLibrary();
        setLibraryPrompts(lib);
      }
      if (lib.length > 0) {
        const nextIndex = (libraryIndexRef.current + 1) % lib.length;
        libraryIndexRef.current = nextIndex;
        setPrompt(lib[nextIndex]);
      }
    } catch {
      /* ignore */
    }
  };

  // Load today entry
  const loadTodayEntry = async () => {
    const localToday = getLocalTodayDateIso();
    try {
      const entry = await getEntryByDate(localToday);
      setTodayEntry(entry);
    } catch {
      /* ignore */
    }
  };

  // Save today entry
  const saveToday = async (
    content: string,
    mood: MoodType,
    stress: number
  ): Promise<{ ok: boolean; unavailable?: boolean; error?: string; fieldErrors?: Record<string, string> }> => {
    const localToday = getLocalTodayDateIso();
    const apiMood = FE_TO_API_MOOD[mood];
    setSaving(true);
    try {
      const saved = await saveJournalEntry({
        date: localToday,
        content,
        mood: apiMood,
        stress,
      });
      setTodayEntry(saved);
      // Refresh stats & entries list
      void getJournalStats(localToday).then(setStats).catch(() => {});
      void listJournalEntries({ skip: 0, limit: 20 }).then((res) => {
        setEntries(res.entries);
        setEntriesTotal(res.total ?? res.entries.length);
      }).catch(() => {});
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { error?: { code?: string; message?: string }; field_errors?: Record<string, string> } | undefined;
        if (err.status === 500 && data?.error?.code === 'JOURNAL_NOT_CONFIGURED') {
          return { ok: false, unavailable: true, error: 'Journal storage is temporarily unavailable.' };
        }
        if (err.status === 422 && data?.field_errors) {
          return { ok: false, fieldErrors: data.field_errors, error: 'Please check the highlighted fields.' };
        }
      }
      return { ok: false, error: 'Could not save your entry. Try again.' };
    } finally {
      setSaving(false);
    }
  };

  // Discard today entry
  const discardToday = async () => {
    await loadTodayEntry();
  };

  // Load more entries
  const loadMoreEntries = async () => {
    await loadEntries(skip + 20, searchQuery, selectedMonth);
  };

  // Expand entry
  const expandEntry = async (id: string) => {
    if (expandedEntryDetails[id]) return;
    try {
      const detail = await getEntryById(id);
      setExpandedEntryDetails((prev) => ({ ...prev, [id]: detail }));
    } catch {
      /* ignore */
    }
  };

  // Delete entire journal
  const deleteEntireJournal = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      await deleteJournal('DELETE');
      setTodayEntry(null);
      setEntries([]);
      setEntriesTotal(0);
      setStats(null);
      setMoodData(null);
      setInsightsData(null);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Could not delete journal.' };
    }
  };

  // Export journal as JSON
  const exportJournal = async (): Promise<boolean> => {
    setExporting(true);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${localStorage.getItem('cf_token') || ''}`,
        'X-Workspace-Id': localStorage.getItem('cf_workspace_id') || '',
      };
      const token = getJournalToken();
      if (token) {
        headers['X-Journal-Token'] = token;
      }

      const res = await fetch('/api/v1/journal/export', {
        headers,
      });

      if (!res.ok) {
        if (res.status === 423) {
          setIsLocked(true);
        }
        return false;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'journal-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    } finally {
      setExporting(false);
    }
  };

  // Search debounce handler
  useEffect(() => {
    if (!isLocked && !isForbidden && settings) {
      const timer = setTimeout(() => {
        void loadEntries(0, searchQuery, selectedMonth);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedMonth, isLocked, isForbidden, settings, loadEntries]);

  // Range change handler
  useEffect(() => {
    if (!isLocked && !isForbidden && settings) {
      queueMicrotask(() => {
        void loadMood(moodRange);
      });
    }
  }, [moodRange, isLocked, isForbidden, settings, loadMood]);

  const hasMoreEntries = entries.length < entriesTotal;

  return {
    isForbidden,
    isLocked,
    lockedUntil,
    settings,
    settingsLoading,
    unlock,
    lock,
    updatePasscode,
    removePasscode,
    updateSettings,

    stats,
    statsLoading,
    prompt,
    dismissPrompt,
    nextLibraryPrompt,
    todayEntry,
    loadTodayEntry,
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
    moodRange,
    setMoodRange,

    insightsData,
    insightsLoading,
    dismissSupportive: async () => {
      try {
        await dismissSupportiveCard();
        if (insightsData) {
          setInsightsData({ ...insightsData, supportive_card: null });
        }
      } catch {
        /* ignore */
      }
    },

    deleteEntireJournal,
    exportJournal,
    exporting,

    refetchAll,
  };
}
