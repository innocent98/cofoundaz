import { apiClient, ApiError } from './client';

export type JournalMood = 'rough' | 'meh' | 'okay' | 'good' | 'great';
export type FeMood = 'Rough' | 'Heavy' | 'Steady' | 'Good' | 'Great';

export const FE_TO_API_MOOD: Record<FeMood, JournalMood> = {
  Rough: 'rough',
  Heavy: 'meh',
  Steady: 'okay',
  Good: 'good',
  Great: 'great',
};

export const API_TO_FE_MOOD: Record<JournalMood, FeMood> = {
  rough: 'Rough',
  meh: 'Heavy',
  okay: 'Steady',
  good: 'Good',
  great: 'Great',
};

export interface JournalSettings {
  passcode_enabled: boolean;
  locked_until: string | null;
  daily_prompt_notifications: boolean;
  evening_reminder: boolean;
}

export interface JournalStats {
  entries_this_month: number;
  entries_per_week?: number;
  average_mood?: JournalMood | null;
  previous_month_average_mood?: {
    mood: JournalMood;
    month?: string;
  } | null;
  longest_streak_days?: number;
  longest_streak_ended_on?: string | null;
  current_streak_days?: number;
  total_entries?: number;
}

export interface JournalPrompt {
  id?: string;
  prompt: string;
  theme?: string;
  dismissed?: boolean;
}

export interface JournalEntryListItem {
  id: string;
  date: string;
  mood: JournalMood;
  stress: number;
  first_line: string;
  preview: string;
  word_count: number;
}

export interface JournalEntryDetail {
  id: string;
  date: string;
  mood: JournalMood;
  stress: number;
  content: string;
  word_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface MonthOption {
  month: string; // "YYYY-MM"
  label: string; // e.g. "October 2026 (6)"
  count: number;
}

export interface MoodPoint {
  date: string;
  mood: JournalMood;
  stress: number;
}

export interface MoodAnnotation {
  date: string;
  label: string;
}

export interface MoodData {
  points: MoodPoint[];
  annotations?: MoodAnnotation[];
}

export interface InsightItem {
  id?: string;
  title: string;
  body: string;
  kind: 'weekday_stress' | 'deadline_stress' | 'mood_shift' | 'streak' | 'great_days' | string;
}

export interface SupportiveCard {
  id?: string;
  title: string;
  body: string;
  kicker?: string;
}

export interface JournalInsightsResponse {
  insights: InsightItem[];
  entries_needed: number;
  supportive_card?: SupportiveCard | null;
}

// In-memory token management
let inMemoryJournalToken: string | null = null;
let lockListeners: Array<() => void> = [];

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
    if (err instanceof ApiError && err.status === 423) {
      triggerLocked();
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
  const res = await journalApiClient<{ data: { prompts?: JournalPrompt[]; items?: JournalPrompt[] } | JournalPrompt[] }>('/journal/prompts/library');
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.prompts ?? d.items ?? [];
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
}): Promise<{ entries: JournalEntryListItem[]; total?: number }> {
  const q = new URLSearchParams();
  if (params.skip !== undefined) q.set('skip', String(params.skip));
  if (params.limit !== undefined) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.month) q.set('month', params.month);

  const qs = q.toString() ? `?${q.toString()}` : '';
  const res = await journalApiClient<{ data: { entries?: JournalEntryListItem[]; total?: number } | JournalEntryListItem[] }>(`/journal/entries${qs}`);
  const d = res.data;
  if (Array.isArray(d)) {
    return { entries: d, total: d.length };
  }
  return { entries: d.entries ?? [], total: d.total };
}

export async function getJournalMonths(): Promise<MonthOption[]> {
  try {
    const res = await journalApiClient<{ data: Array<{ month: string; count: number }> | MonthOption[] }>('/journal/entries/months');
    const items = res.data ?? [];
    return items.map((m) => {
      // e.g. "2026-10" -> "October 2026"
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
  triggerLocked();
}

