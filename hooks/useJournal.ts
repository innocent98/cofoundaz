import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export type MoodType = 'Rough' | 'Heavy' | 'Steady' | 'Good' | 'Great';

export interface JournalEntry {
  id: string;
  date: string;
  mood: MoodType;
  snippet: string;
  fullText: string;
  words: number;
  tags: string[];
}

export interface MoodPoint {
  date: string;
  mood: MoodType;
  stress: number;
}

// FE mood label ↔ API JournalMood enum (rough/meh/okay/good/great).
const FE_TO_API: Record<MoodType, string> = { Rough: 'rough', Heavy: 'meh', Steady: 'okay', Good: 'good', Great: 'great' };
const API_TO_FE: Record<string, MoodType> = { rough: 'Rough', meh: 'Heavy', okay: 'Steady', good: 'Good', great: 'Great' };
// Derive a 1–5 stress value from the mood when the UI doesn't capture one.
const MOOD_STRESS: Record<MoodType, number> = { Rough: 5, Heavy: 4, Steady: 3, Good: 2, Great: 1 };

export function apiMoodToFe(m: string): MoodType {
  return API_TO_FE[m] ?? 'Steady';
}

function formatDate(iso: string): string {
  // "2026-09-17" → "Wednesday, September 17"
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

interface RawListEntry {
  id: string;
  date: string;
  mood: string;
  first_line: string;
}

function mapListEntry(e: RawListEntry): JournalEntry {
  return {
    id: e.id,
    date: formatDate(e.date),
    mood: apiMoodToFe(e.mood),
    snippet: e.first_line || '',
    // The list only carries `first_line` (no `content`, guide §3 trap); the full
    // body comes from GET /journal/entries/{id} — wired on expand as a follow-up.
    fullText: e.first_line || '',
    words: 0,
    tags: [],
  };
}

export function useJournal() {
  const [prompt, setPrompt] = useState<string>('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodPoints, setMoodPoints] = useState<MoodPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, list, mood] = await Promise.all([
        apiClient<{ data?: { prompt?: string } }>('/journal/prompts/today').catch(() => ({ data: { prompt: '' } })),
        apiClient<{ data?: { entries?: RawListEntry[]; total?: number } }>('/journal/entries'),
        apiClient<{ data?: { points?: { date: string; mood: string; stress: number }[] } }>('/journal/mood').catch(() => ({ data: { points: [] } })),
      ]);
      setPrompt(p?.data?.prompt ?? '');
      setEntries((list?.data?.entries ?? []).map(mapListEntry));
      setTotal(list?.data?.total ?? 0);
      setMoodPoints((mood?.data?.points ?? []).map((pt) => ({ date: pt.date, mood: apiMoodToFe(pt.mood), stress: pt.stress })));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Journal unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchAll();
    });
  }, [fetchAll]);

  // POST /journal/entries upserts today's entry (one per founder per date), so
  // `date` is required and must not be in the future (guide §2). Returns a
  // result the UI can branch on — `unavailable` is the server-config 500
  // (`JOURNAL_NOT_CONFIGURED`, missing encryption key — guide §8), which no
  // retry or different input can fix.
  const saveEntry = useCallback(
    async (content: string, mood: MoodType | null): Promise<{ ok: boolean; unavailable?: boolean }> => {
      const feMood: MoodType = mood ?? 'Steady';
      const today = new Date().toISOString().slice(0, 10);
      setSaving(true);
      try {
        await apiClient('/journal/entries', {
          method: 'POST',
          body: JSON.stringify({ date: today, content, mood: FE_TO_API[feMood], stress: MOOD_STRESS[feMood] }),
        });
        await fetchAll();
        return { ok: true };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        const data = err instanceof ApiError ? (err.data as { error?: { code?: string } } | undefined) : undefined;
        const unavailable = err instanceof ApiError && err.status === 500 && data?.error?.code === 'JOURNAL_NOT_CONFIGURED';
        return { ok: false, unavailable };
      } finally {
        setSaving(false);
      }
    },
    [fetchAll]
  );

  return { prompt, entries, setEntries, moodPoints, total, loading, saving, error, refetch: fetchAll, saveEntry };
}
