import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FE_TO_API_MOOD,
  API_TO_FE_MOOD,
  setJournalToken,
  getJournalToken,
  triggerLocked,
  subscribeToLockEvent,
  getJournalSettings,
  unlockJournal,
  lockJournal,
  saveJournalEntry,
  deleteJournal,
} from './journal';
import * as clientModule from './client';

describe('lib/api/journal', () => {
  beforeEach(() => {
    setJournalToken(null);
    vi.restoreAllMocks();
  });

  it('maps FE mood labels to API enum and back', () => {
    expect(FE_TO_API_MOOD.Rough).toBe('rough');
    expect(FE_TO_API_MOOD.Heavy).toBe('meh');
    expect(FE_TO_API_MOOD.Steady).toBe('okay');
    expect(FE_TO_API_MOOD.Good).toBe('good');
    expect(FE_TO_API_MOOD.Great).toBe('great');

    expect(API_TO_FE_MOOD.rough).toBe('Rough');
    expect(API_TO_FE_MOOD.meh).toBe('Heavy');
    expect(API_TO_FE_MOOD.okay).toBe('Steady');
    expect(API_TO_FE_MOOD.good).toBe('Good');
    expect(API_TO_FE_MOOD.great).toBe('Great');
  });

  it('manages in-memory journal token and emits lock events on 423', async () => {
    setJournalToken('test-token-123');
    expect(getJournalToken()).toBe('test-token-123');

    const lockHandler = vi.fn();
    const unsub = subscribeToLockEvent(lockHandler);

    triggerLocked();
    expect(getJournalToken()).toBeNull();
    expect(lockHandler).toHaveBeenCalledTimes(1);

    unsub();
  });

  it('unlocks journal and sets in-memory token', async () => {
    vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: { token: 'unlocked-token-456', expires_in: 1800 },
    } as unknown as { data: { token: string; expires_in: number } });

    const res = await unlockJournal('4821');
    expect(res.token).toBe('unlocked-token-456');
    expect(getJournalToken()).toBe('unlocked-token-456');
  });

  it('locks journal, posts to /journal/lock, and clears token', async () => {
    setJournalToken('active-token');
    vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: { locked: true },
    } as unknown as { data: { locked: boolean } });

    await lockJournal();
    expect(getJournalToken()).toBeNull();
  });

  it('passes X-Journal-Token header on requests when token is held', async () => {
    setJournalToken('my-secret-token');
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: {
        passcode_enabled: true,
        locked_until: null,
        daily_prompt_notifications: true,
        evening_reminder: false,
      },
    } as unknown as { data: { passcode_enabled: boolean; locked_until: string | null; daily_prompt_notifications: boolean; evening_reminder: boolean } });

    const s = await getJournalSettings();
    expect(s.passcode_enabled).toBe(true);

    expect(spy).toHaveBeenCalledWith(
      '/journal/settings',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    const headers = spy.mock.calls[0][1]?.headers as Headers;
    expect(headers.get('X-Journal-Token')).toBe('my-secret-token');
  });

  it('saves entry sending date, content, mood and stress', async () => {
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: {
        id: 'entry-1',
        date: '2026-11-04',
        mood: 'good',
        stress: 4,
        content: 'Journal content',
        word_count: 2,
      },
    } as unknown as { data: { id: string; date: string; mood: string; stress: number; content: string; word_count: number } });

    const res = await saveJournalEntry({
      date: '2026-11-04',
      content: 'Journal content',
      mood: 'good',
      stress: 4,
    });

    expect(res.id).toBe('entry-1');
    expect(spy).toHaveBeenCalledWith(
      '/journal/entries',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          date: '2026-11-04',
          content: 'Journal content',
          mood: 'good',
          stress: 4,
        }),
      })
    );
  });

  it('deletes journal with confirm DELETE and triggers lock', async () => {
    const lockHandler = vi.fn();
    subscribeToLockEvent(lockHandler);

    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: { deleted: true },
    } as unknown as { data: { deleted: boolean } });

    await deleteJournal('DELETE');

    expect(spy).toHaveBeenCalledWith(
      '/journal',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
    );
    expect(lockHandler).toHaveBeenCalled();
  });
});
