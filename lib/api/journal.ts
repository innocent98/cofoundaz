import { apiClient, ApiError } from './client';
export * from '@/types/journal';
import type {
  JournalMood,
  JournalSettings,
  JournalStats,
  JournalPrompt,
  JournalEntryListItem,
  JournalEntryDetail,
  MonthOption,
  MoodData,
  JournalInsightsResponse,
} from '@/types/journal';

// In-memory token management
let inMemoryJournalToken: string | null = null;
let lockListeners: Array<() => void> = [];
let passcodeNotSetListeners: Array<() => void> = [];

export function getJournalToken(): string | null {
  return inMemoryJournalToken;
}

export function setJournalToken(token: string | null): void {
  inMemoryJournalToken = token;
}

export function subscribeToLockEvent(listener: () => void): () => void {
  lockListeners.push(listener);
  return () => {
    lockListeners = lockListeners.filter((l) => l !== listener);
  };
}

export function triggerLocked(): void {
  inMemoryJournalToken = null;
  lockListeners.forEach((l) => l());
}

export function subscribeToPasscodeNotSetEvent(listener: () => void): () => void {
  passcodeNotSetListeners.push(listener);
  return () => {
    passcodeNotSetListeners = passcodeNotSetListeners.filter((l) => l !== listener);
  };
}

export function triggerPasscodeNotSet(): void {
  inMemoryJournalToken = null;
  passcodeNotSetListeners.forEach((l) => l());
}

export function isJournalNotConfigured(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.status === 500) {
      const data = err.data as { error?: { code?: string; message?: string }; code?: string } | undefined;
      return (
        data?.error?.code === 'JOURNAL_NOT_CONFIGURED' ||
        data?.code === 'JOURNAL_NOT_CONFIGURED' ||
        err.message?.includes('JOURNAL_NOT_CONFIGURED')
      );
    }
  }
  return false;
}

/** Wrapper around apiClient adding X-Journal-Token when present, handling 423 */
export async function journalApiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (inMemoryJournalToken) {
    headers.set('X-Journal-Token', inMemoryJournalToken);
  }

  try {
    return await apiClient<T>(path, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      const data = err.data as { error?: { code?: string }; code?: string } | undefined;
      const isPasscodeNotSet = data?.error?.code === 'PASSCODE_NOT_SET' || data?.code === 'PASSCODE_NOT_SET';
      if (isPasscodeNotSet) {
        triggerPasscodeNotSet();
      } else if (err.status === 423) {
        triggerLocked();
      }
    }
    throw err;
  }
}

// 1. Settings
export async function getJournalSettings(): Promise<JournalSettings> {
  const res = await journalApiClient<{ data: JournalSettings }>('/journal/settings');
  return res.data;
}

export async function updateJournalSettings(
  patch: Partial<Pick<JournalSettings, 'daily_prompt_notifications' | 'evening_reminder'>>
): Promise<JournalSettings> {
  const res = await journalApiClient<{ data: JournalSettings }>('/journal/settings', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return res.data;
}

// 2. Lock & Passcode
export async function unlockJournal(passcode: string): Promise<{ token: string; expires_in: number }> {
  const res = await apiClient<{ data: { token: string; expires_in: number } }>('/journal/unlock', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  });
  setJournalToken(res.data.token);
  return res.data;
}

export async function lockJournal(): Promise<void> {
  try {
    await journalApiClient('/journal/lock', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } finally {
    triggerLocked();
  }
}

export async function setJournalPasscode(passcode: string): Promise<{ token: string }> {
  const res = await journalApiClient<{ data: { token: string } }>('/journal/passcode', {
    method: 'PUT',
    body: JSON.stringify({ passcode }),
  });
  if (res?.data?.token) {
    setJournalToken(res.data.token);
  }
  return res.data;
}

export async function changeJournalPasscode(current_passcode: string, passcode: string): Promise<{ token: string }> {
  const res = await journalApiClient<{ data: { token: string } }>('/journal/passcode', {
    method: 'PUT',
    body: JSON.stringify({ current_passcode, passcode }),
  });
  if (res?.data?.token) {
    setJournalToken(res.data.token);
  }
  return res.data;
}

export async function removeJournalPasscodeWithPassword(password: string): Promise<JournalSettings> {
  const res = await journalApiClient<{ data: JournalSettings }>('/journal/passcode', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
  setJournalToken(null);
  return res.data;
}

// 3. Stats & Prompts
export async function getJournalStats(todayIso: string): Promise<JournalStats> {
  const res = await journalApiClient<{ data: JournalStats }>(`/journal/stats?today=${todayIso}`);
  return res.data;
}

export async function getTodayPrompt(): Promise<JournalPrompt> {
  const res = await journalApiClient<{ data: JournalPrompt }>('/journal/prompts/today');
  return res.data;
}

export async function dismissTodayPrompt(): Promise<void> {
  await journalApiClient('/journal/prompts/today/dismiss', {
    method: 'POST',
  });
}

export async function getPromptLibrary(): Promise<JournalPrompt[]> {
  const res = await journalApiClient<Record<string, unknown>>('/journal/prompts/library');
  const d = (res?.data ?? res) as Record<string, unknown> | unknown[];
  if (Array.isArray(d)) return d as JournalPrompt[];
  if (Array.isArray((d as { prompts?: unknown[] })?.prompts)) return (d as { prompts: JournalPrompt[] }).prompts;
  if (Array.isArray((d as { items?: unknown[] })?.items)) return (d as { items: JournalPrompt[] }).items;
  const themesObj = (d as { themes?: Record<string, unknown> })?.themes ?? (typeof d === 'object' && !(d as { prompts?: unknown })?.prompts ? d : null);
  if (themesObj && typeof themesObj === 'object') {
    const flattened: JournalPrompt[] = [];
    for (const [theme, promptList] of Object.entries(themesObj)) {
      if (Array.isArray(promptList)) {
        promptList.forEach((p) => {
          if (typeof p === 'string') {
            flattened.push({ prompt: p, theme });
          } else if (p && typeof p === 'object' && 'prompt' in p) {
            const promptItem = p as { prompt: string; theme?: string };
            flattened.push({ ...promptItem, theme: promptItem.theme || theme });
          }
        });
      }
    }
    return flattened;
  }
  return [];
}

// 4. Entries
export async function getEntryByDate(dateIso: string): Promise<JournalEntryDetail | null> {
  try {
    const res = await journalApiClient<{ data: JournalEntryDetail }>(`/journal/entries/by-date/${dateIso}`);
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getEntryById(id: string): Promise<JournalEntryDetail> {
  const res = await journalApiClient<{ data: JournalEntryDetail }>(`/journal/entries/${id}`);
  return res.data;
}

export async function saveJournalEntry(entry: {
  date: string;
  content: string;
  mood: JournalMood;
  stress: number;
}): Promise<JournalEntryDetail> {
  const res = await journalApiClient<{ data: JournalEntryDetail }>('/journal/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
  return res.data;
}

export async function listJournalEntries(params: {
  skip?: number;
  limit?: number;
  search?: string;
  month?: string;
  signal?: AbortSignal;
}): Promise<{ entries: JournalEntryListItem[]; total?: number }> {
  const q = new URLSearchParams();
  if (params.skip !== undefined) q.set('skip', String(params.skip));
  if (params.limit !== undefined) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.month) q.set('month', params.month);

  const qs = q.toString() ? `?${q.toString()}` : '';
  const res = await journalApiClient<{
    data: { entries?: JournalEntryListItem[]; total?: number } | JournalEntryListItem[];
  }>(`/journal/entries${qs}`, {
    signal: params.signal,
  });
  const d = res.data;
  if (Array.isArray(d)) {
    return { entries: d, total: d.length };
  }
  return { entries: d?.entries ?? [], total: d?.total };
}

export async function getJournalMonths(): Promise<MonthOption[]> {
  try {
    const res = await journalApiClient<{ data?: { months?: Array<{ month: string; count: number }> }; months?: Array<{ month: string; count: number }> }>('/journal/entries/months');
    const root = res?.data ?? res;
    let items: Array<{ month: string; count: number }> = [];

    if (Array.isArray(root)) {
      items = root;
    } else if (Array.isArray(root?.months)) {
      items = root.months;
    } else if (Array.isArray(res?.months)) {
      items = res.months;
    }

    return items.map((m) => {
      // e.g. "2026-10" -> "October 2026 (count)"
      const [yyyy, mm] = m.month.split('-');
      let label = m.month;
      if (yyyy && mm) {
        const d = new Date(Number(yyyy), Number(mm) - 1, 1);
        const name = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        label = `${name} (${m.count})`;
      }
      return {
        month: m.month,
        label,
        count: m.count,
      };
    });
  } catch {
    return [];
  }
}

// 5. Mood Trend
export async function getMoodTrend(range: '4w' | '12w' | '6m' | '1y' = '12w'): Promise<MoodData> {
  const res = await journalApiClient<{ data: MoodData }>(`/journal/mood?range=${range}`);
  return res.data;
}

// 6. Insights & Supportive Card
export async function getJournalInsights(todayIso: string): Promise<JournalInsightsResponse> {
  const res = await journalApiClient<{ data: JournalInsightsResponse }>(`/journal/insights?today=${todayIso}`);
  return res.data;
}

export async function dismissSupportiveCard(): Promise<void> {
  await journalApiClient('/journal/insights/supportive/dismiss', {
    method: 'POST',
  });
}

// 7. Delete Journal
export async function deleteJournal(confirm: string): Promise<void> {
  await journalApiClient('/journal', {
    method: 'DELETE',
    body: JSON.stringify({ confirm }),
  });
  // Clear token in memory without triggering full lock screen navigation
  setJournalToken(null);
}
