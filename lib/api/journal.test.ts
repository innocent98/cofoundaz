import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FE_TO_API_MOOD,
  API_TO_FE_MOOD,
  setJournalToken,
  getJournalToken,
  triggerLocked,
  subscribeToLockEvent,
  subscribeToPasscodeNotSetEvent,
  getJournalSettings,
  unlockJournal,
  lockJournal,
  saveJournalEntry,
  deleteJournal,
  getPromptLibrary,
  getJournalMonths,
  listJournalEntries,
  isJournalNotConfigured,
  journalApiClient,
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

  it('triggers passcodeNotSet instead of lock when 423 error is PASSCODE_NOT_SET', async () => {
    const lockHandler = vi.fn();
    const notSetHandler = vi.fn();
    const unsubLock = subscribeToLockEvent(lockHandler);
    const unsubNotSet = subscribeToPasscodeNotSetEvent(notSetHandler);

    vi.spyOn(clientModule, 'apiClient').mockRejectedValueOnce(
      new clientModule.ApiError(423, 'Locked', { error: { code: 'PASSCODE_NOT_SET' } })
    );

    await expect(journalApiClient('/journal/entries')).rejects.toThrow();

    expect(notSetHandler).toHaveBeenCalledTimes(1);
    expect(lockHandler).not.toHaveBeenCalled();

    unsubLock();
    unsubNotSet();
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

  it('deletes journal with confirm DELETE and clears token without triggering lock screen', async () => {
    setJournalToken('token-to-delete');
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
    expect(getJournalToken()).toBeNull();
    // Adebayo review finding: do NOT trigger lock screen on delete
    expect(lockHandler).not.toHaveBeenCalled();
  });

  it('flattens nested theme prompts from getPromptLibrary', async () => {
    vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: {
        themes: {
          wins: [{ prompt: 'What worked well?' }, { prompt: 'Who helped?' }],
          energy: ['Where did you lose momentum?'],
        },
      },
    } as unknown as { data: { themes: Record<string, unknown[]> } });

    const prompts = await getPromptLibrary();
    expect(prompts).toHaveLength(3);
    expect(prompts[0].prompt).toBe('What worked well?');
    expect(prompts[0].theme).toBe('wins');
    expect(prompts[2].prompt).toBe('Where did you lose momentum?');
    expect(prompts[2].theme).toBe('energy');
  });

  it('unwraps months correctly from { data: { months: [...] } }', async () => {
    vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: {
        months: [
          { month: '2026-10', count: 6 },
          { month: '2026-09', count: 12 },
        ],
      },
    } as unknown as { data: { months: Array<{ month: string; count: number }> } });

    const months = await getJournalMonths();
    expect(months).toHaveLength(2);
    expect(months[0].month).toBe('2026-10');
    expect(months[0].count).toBe(6);
    expect(months[0].label).toContain('October 2026 (6)');
  });

  it('passes abort signal to listJournalEntries', async () => {
    const ac = new AbortController();
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: { entries: [], total: 0 },
    } as unknown as { data: { entries: unknown[]; total: number } });

    await listJournalEntries({ skip: 0, limit: 20, search: 'growth', signal: ac.signal });
    expect(spy).toHaveBeenCalledWith(
      '/journal/entries?skip=0&limit=20&search=growth',
      expect.objectContaining({ signal: ac.signal })
    );
  });

  it('detects JOURNAL_NOT_CONFIGURED correctly', () => {
    const err = new clientModule.ApiError(500, 'Server Error', {
      error: { code: 'JOURNAL_NOT_CONFIGURED' },
    });
    expect(isJournalNotConfigured(err)).toBe(true);

    const errTopLevel = new clientModule.ApiError(500, 'Server Error', {
      code: 'JOURNAL_NOT_CONFIGURED',
    });
    expect(isJournalNotConfigured(errTopLevel)).toBe(true);

    const otherErr = new clientModule.ApiError(404, 'Not Found', {
      error: { code: 'NOT_FOUND' },
    });
    expect(isJournalNotConfigured(otherErr)).toBe(false);
  });
});
