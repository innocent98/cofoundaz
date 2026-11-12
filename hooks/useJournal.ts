import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, formatApiErrorMessage } from '@/lib/api/client';
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
  subscribeToPasscodeNotSetEvent,
  getJournalToken,
  setJournalToken,
  isJournalNotConfigured,
  journalApiClient,
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
  settingsError: string | null;
  fetchSettings: () => Promise<void>;
  unlock: (passcode: string) => Promise<{ ok: boolean; error?: string; lockedOut?: boolean }>;
  lock: () => Promise<void>;
  updatePasscode: (passcode: string, currentPasscode?: string) => Promise<{ ok: boolean; error?: string }>;
  removePasscode: (password: string) => Promise<{ ok: boolean; error?: string }>;
  updateSettings: (patch: Partial<Pick<JournalSettings, 'daily_prompt_notifications' | 'evening_reminder'>>) => Promise<boolean>;

  // Today tab
  stats: JournalStats | null;
  statsLoading: boolean;
  statsError: string | null;
  prompt: JournalPrompt | null;
  promptError: string | null;
  dismissPrompt: () => Promise<void>;
  nextLibraryPrompt: () => Promise<void>;
  todayEntry: JournalEntryDetail | null;
  todayEntryLoading: boolean;
  todayError: string | null;
  loadTodayEntry: () => Promise<void>;
  loadTodayTab: () => Promise<void>;
  saveToday: (
    content: string,
    mood: MoodType,
    stress: number
  ) => Promise<{ ok: boolean; unavailable?: boolean; error?: string; fieldErrors?: Record<string, string> }>;
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
  loadMonths: () => Promise<void>;
  expandedEntryDetails: Record<string, JournalEntryDetail>;
  expandEntry: (id: string) => Promise<void>;

  // Mood tab
  moodData: MoodData | null;
  moodLoading: boolean;
  moodError: string | null;
  moodRange: '4w' | '12w' | '6m' | '1y';
  setMoodRange: (r: '4w' | '12w' | '6m' | '1y') => void;
  loadMood: (range?: '4w' | '12w' | '6m' | '1y') => Promise<void>;

  // Reflections tab
  insightsData: JournalInsightsResponse | null;
  insightsLoading: boolean;
  insightsError: string | null;
  loadInsights: () => Promise<void>;
  dismissSupportive: () => Promise<void>;

  // Privacy tab
  deleteEntireJournal: () => Promise<{ ok: boolean; error?: string }>;
  exportJournal: () => Promise<{ ok: boolean; error?: string }>;
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
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Today tab states
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [libraryPrompts, setLibraryPrompts] = useState<JournalPrompt[]>([]);
  const libraryIndexRef = useRef<number>(0);
  const [todayEntry, setTodayEntry] = useState<JournalEntryDetail | null>(null);
  const [todayEntryLoading, setTodayEntryLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);
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

  const searchQueryRef = useRef(searchQuery);
  const selectedMonthRef = useRef(selectedMonth);

  // AbortController ref for entries search / filter
  const entriesAbortControllerRef = useRef<AbortController | null>(null);

  // Mood tab states
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [moodRange, setMoodRange] = useState<'4w' | '12w' | '6m' | '1y'>('12w');
  const moodRangeRef = useRef(moodRange);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
    selectedMonthRef.current = selectedMonth;
    moodRangeRef.current = moodRange;
  }, [searchQuery, selectedMonth, moodRange]);

  // Reflections tab states
  const [insightsData, setInsightsData] = useState<JournalInsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Privacy tab export
  const [exporting, setExporting] = useState(false);

  // Check initial settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
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
      } else if (isJournalNotConfigured(err)) {
        setSettingsError('Journal storage is temporarily unavailable.');
      } else {
        setSettingsError(formatApiErrorMessage(err, "Couldn't load journal settings."));
      }
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Auto-subscribe to 423 lock events and PASSCODE_NOT_SET events
  useEffect(() => {
    const unsubLock = subscribeToLockEvent(() => {
      setIsLocked(true);
    });
    const unsubPasscodeNotSet = subscribeToPasscodeNotSetEvent(() => {
      setIsLocked(false);
      void fetchSettings();
    });
    return () => {
      unsubLock();
      unsubPasscodeNotSet();
    };
  }, [fetchSettings]);

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
    setTodayEntryLoading(true);
    setStatsError(null);
    setPromptError(null);
    setTodayError(null);

    try {
      const [statsRes, promptRes, entryRes] = await Promise.allSettled([
        getJournalStats(localToday),
        getTodayPrompt(),
        getEntryByDate(localToday),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      } else {
        if (isJournalNotConfigured(statsRes.reason)) {
          setStatsError('Journal storage is temporarily unavailable.');
        } else {
          setStatsError(formatApiErrorMessage(statsRes.reason, 'Could not load journal stats.'));
        }
      }

      if (promptRes.status === 'fulfilled') {
        setPrompt(promptRes.value);
      } else {
        if (isJournalNotConfigured(promptRes.reason)) {
          setPromptError('Journal storage is temporarily unavailable.');
        } else {
          setPromptError(formatApiErrorMessage(promptRes.reason, 'Could not load today prompt.'));
        }
      }

      if (entryRes.status === 'fulfilled') {
        setTodayEntry(entryRes.value);
      } else {
        if (entryRes.reason instanceof ApiError && entryRes.reason.status === 404) {
          setTodayEntry(null);
        } else if (isJournalNotConfigured(entryRes.reason)) {
          setTodayError('Journal storage is temporarily unavailable.');
        } else {
          setTodayError(formatApiErrorMessage(entryRes.reason, 'Could not load today entry.'));
        }
      }
    } finally {
      setStatsLoading(false);
      setTodayEntryLoading(false);
    }
  }, [isForbidden, isLocked]);

  // Load All entries data with cancellation
  const loadEntries = useCallback(async (
    currentSkip = 0,
    currentSearch = searchQueryRef.current,
    currentMonth = selectedMonthRef.current
  ) => {
    if (isForbidden || isLocked) return;

    // Abort previous in-flight search request
    if (entriesAbortControllerRef.current) {
      entriesAbortControllerRef.current.abort();
    }
    const ac = new AbortController();
    entriesAbortControllerRef.current = ac;

    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const res = await listJournalEntries({
        skip: currentSkip,
        limit: 20,
        search: currentSearch || undefined,
        month: currentMonth || undefined,
        signal: ac.signal,
      });

      if (currentSkip === 0) {
        setEntries(res.entries);
      } else {
        setEntries((prev) => [...prev, ...res.entries]);
      }
      setEntriesTotal(res.total ?? (currentSkip + res.entries.length));
      setSkip(currentSkip);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (isJournalNotConfigured(err)) {
        setEntriesError('Journal storage is temporarily unavailable.');
      } else {
        setEntriesError(err instanceof Error ? err.message : 'Could not load entries.');
      }
    } finally {
      setEntriesLoading(false);
    }
  }, [isForbidden, isLocked]);

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
  const loadMood = useCallback(async (range = moodRangeRef.current) => {
    if (isForbidden || isLocked) return;
    setMoodLoading(true);
    setMoodError(null);
    try {
      const m = await getMoodTrend(range);
      setMoodData(m);
    } catch (err) {
      if (isJournalNotConfigured(err)) {
        setMoodError('Journal storage is temporarily unavailable.');
      } else {
        setMoodError(err instanceof Error ? err.message : 'Could not load mood trend.');
      }
    } finally {
      setMoodLoading(false);
    }
  }, [isForbidden, isLocked]);

  // Load Insights
  const loadInsights = useCallback(async () => {
    if (isForbidden || isLocked) return;
    const localToday = getLocalTodayDateIso();
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const ins = await getJournalInsights(localToday);
      setInsightsData(ins);
    } catch (err) {
      if (isJournalNotConfigured(err)) {
        setInsightsError('Journal storage is temporarily unavailable.');
      } else {
        setInsightsError(err instanceof Error ? err.message : 'Could not load reflections.');
      }
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

  // Initial load when unlocked and settings are ready
  const initialDataLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLocked && !isForbidden && settings) {
      if (!initialDataLoadedRef.current) {
        initialDataLoadedRef.current = true;
        queueMicrotask(() => {
          void refetchAll();
        });
      }
    }
  }, [isLocked, isForbidden, settings, refetchAll]);

  // Unlock handler
  const unlock = async (passcode: string) => {
    try {
      await unlockJournal(passcode);
      setIsLocked(false);
      setLockedUntil(null);
      initialDataLoadedRef.current = true;
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
        const data = err.data as { error?: { code?: string }; code?: string } | undefined;
        if (data?.error?.code === 'PASSCODE_NOT_SET' || data?.code === 'PASSCODE_NOT_SET') {
          setIsLocked(false);
          void fetchSettings();
          return { ok: false, error: 'Passcode is not set.' };
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

      // Refetch stats, entries list, months, mood, insights after save
      void getJournalStats(localToday).then(setStats).catch(() => {});
      void listJournalEntries({ skip: 0, limit: 20 }).then((res) => {
        setEntries(res.entries);
        setEntriesTotal(res.total ?? res.entries.length);
      }).catch(() => {});
      void loadMonths();
      void loadMood();
      void loadInsights();

      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 500 && isJournalNotConfigured(err)) {
          return { ok: false, unavailable: true, error: 'Journal storage is temporarily unavailable.' };
        }
        if (err.status === 422) {
          const data = err.data as {
            error?: { code?: string; message?: string; field_errors?: Array<{ field: string; message: string }> };
            field_errors?: Record<string, string> | Array<{ field: string; message: string }>;
          } | undefined;

          const fieldErrorsMap: Record<string, string> = {};

          // Handle array field errors { field, message }
          const arrayErrors = data?.error?.field_errors || (Array.isArray(data?.field_errors) ? data.field_errors : undefined);
          if (Array.isArray(arrayErrors)) {
            arrayErrors.forEach((fe) => {
              if (fe.field && fe.message) {
                fieldErrorsMap[fe.field] = fe.message;
              }
            });
          } else if (data?.field_errors && typeof data.field_errors === 'object') {
            Object.assign(fieldErrorsMap, data.field_errors);
          }

          return {
            ok: false,
            fieldErrors: Object.keys(fieldErrorsMap).length > 0 ? fieldErrorsMap : undefined,
            error: data?.error?.message || 'Please check the highlighted fields.',
          };
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
      // Refetch settings on delete
      await fetchSettings();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: formatApiErrorMessage(err, 'Could not delete journal.') };
    }
  };

  // Export journal as JSON
  const exportJournal = async (): Promise<{ ok: boolean; error?: string }> => {
    setExporting(true);
    try {
      const data = await journalApiClient<unknown>('/journal/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'journal-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setIsLocked(true);
      }
      return { ok: false, error: formatApiErrorMessage(err, 'Could not download export. Please try again.') };
    } finally {
      setExporting(false);
    }
  };

  // Search & month filter debounce handler
  const initialSearchFilterDoneRef = useRef(false);
  useEffect(() => {
    if (!isLocked && !isForbidden && settings) {
      if (!initialSearchFilterDoneRef.current) {
        initialSearchFilterDoneRef.current = true;
        return;
      }
      const timer = setTimeout(() => {
        void loadEntries(0, searchQuery, selectedMonth);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedMonth, isLocked, isForbidden, settings, loadEntries]);

  // Range change handler
  const initialMoodLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLocked && !isForbidden && settings) {
      if (!initialMoodLoadedRef.current) {
        initialMoodLoadedRef.current = true;
        return;
      }
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
    settingsError,
    fetchSettings,
    unlock,
    lock,
    updatePasscode,
    removePasscode,
    updateSettings,

    stats,
    statsLoading,
    statsError,
    prompt,
    promptError,
    dismissPrompt,
    nextLibraryPrompt,
    todayEntry,
    todayEntryLoading,
    todayError,
    loadTodayEntry,
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
    loadMonths,
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
