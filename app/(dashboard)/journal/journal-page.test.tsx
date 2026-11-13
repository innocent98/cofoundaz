import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import JournalPage from './page';
import * as useJournalModule from '@/hooks/useJournal';

vi.mock('@/components/sidebar-context', () => ({
  useSidebar: () => ({ openSidebar: vi.fn(), isOpen: false }),
}));

vi.mock('@/components/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

describe('JournalPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseJournalHook = {
    isForbidden: false,
    isLocked: false,
    lockedUntil: null,
    settings: {
      passcode_enabled: false,
      locked_until: null,
      daily_prompt_notifications: true,
      evening_reminder: false,
    },
    settingsLoading: false,
    settingsError: null,
    fetchSettings: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn().mockResolvedValue({ ok: true }),
    lock: vi.fn().mockResolvedValue(undefined),
    updatePasscode: vi.fn().mockResolvedValue({ ok: true }),
    removePasscode: vi.fn().mockResolvedValue({ ok: true }),
    updateSettings: vi.fn().mockResolvedValue(true),

    stats: {
      entries_this_month: 4,
      entries_per_week: 2,
      average_mood: 'good' as const,
      previous_month_average_mood: { mood: 'okay' as const, month: 'September' },
      longest_streak_days: 5,
      longest_streak_ended_on: '2026-10-15',
      current_streak_days: 2,
      total_entries: 4,
    },
    statsLoading: false,
    statsError: null,
    prompt: {
      id: 'p-1',
      prompt: 'What was your biggest win today?',
      dismissed: false,
    },
    promptError: null,
    dismissPrompt: vi.fn().mockResolvedValue(undefined),
    nextLibraryPrompt: vi.fn().mockResolvedValue(undefined),
    todayEntry: null,
    todayEntryLoading: false,
    todayError: null,
    loadTodayEntry: vi.fn().mockResolvedValue(undefined),
    loadTodayTab: vi.fn().mockResolvedValue(undefined),
    saveToday: vi.fn().mockResolvedValue({ ok: true }),
    saving: false,
    discardToday: vi.fn().mockResolvedValue(undefined),

    entries: [
      {
        id: 'entry-1',
        date: '2026-11-04',
        mood: 'good' as const,
        stress: 4,
        first_line: 'Shipped v1 milestone',
        preview: 'Shipped v1 milestone with the core team on staging.',
        word_count: 52,
      },
    ],
    entriesTotal: 1,
    entriesLoading: false,
    entriesError: null,
    hasMoreEntries: false,
    loadMoreEntries: vi.fn().mockResolvedValue(undefined),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    selectedMonth: '',
    setSelectedMonth: vi.fn(),
    months: [
      { month: '2026-11', label: 'November 2026 (1)', count: 1 },
      { month: '2026-10', label: 'October 2026 (3)', count: 3 },
    ],
    loadMonths: vi.fn().mockResolvedValue(undefined),
    expandedEntryDetails: {},
    expandEntry: vi.fn().mockResolvedValue(undefined),

    moodData: {
      points: [
        { date: '2026-10-01', mood: 'okay' as const, stress: 5 },
        { date: '2026-10-15', mood: 'good' as const, stress: 4 },
      ],
    },
    moodLoading: false,
    moodError: null,
    moodRange: '12w' as const,
    setMoodRange: vi.fn(),
    loadMood: vi.fn().mockResolvedValue(undefined),

    insightsData: {
      insights: [
        {
          title: 'Strong focus on Mondays',
          body: 'Your lowest stress logs coincide with planning days.',
          kind: 'weekday_stress',
        },
      ],
      entries_needed: 0,
      supportive_card: null,
    },
    insightsLoading: false,
    insightsError: null,
    loadInsights: vi.fn().mockResolvedValue(undefined),
    dismissSupportive: vi.fn().mockResolvedValue(undefined),

    deleteEntireJournal: vi.fn().mockResolvedValue({ ok: true }),
    exportJournal: vi.fn().mockResolvedValue(true),
    exporting: false,

    refetchAll: vi.fn().mockResolvedValue(undefined),
  };

  it('renders Today tab by default with local date and editor', () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue(baseJournalHook as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);

    expect(screen.getByText(/Today's prompt:/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Start anywhere/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save entry/i })).toBeInTheDocument();
  });

  it('renders forbidden screen when isForbidden is true', () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      isForbidden: true,
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    expect(screen.getByText('Private Journal')).toBeInTheDocument();
    expect(screen.getByText('The journal is private to the founder.')).toBeInTheDocument();
  });

  it('renders lock screen when isLocked is true with approved copy', () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      isLocked: true,
      settings: {
        passcode_enabled: true,
        locked_until: null,
        daily_prompt_notifications: true,
        evening_reminder: false,
      },
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    expect(screen.getByText('This one is only yours.')).toBeInTheDocument();
    expect(screen.getByText(/Encrypted at rest/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your passcode')).toBeInTheDocument();
  });

  it('renders dynamic lockout timer on lock screen when lockedUntil is in the future', () => {
    const futureLock = new Date(Date.now() + 125000).toISOString();
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      isLocked: true,
      lockedUntil: futureLock,
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    expect(screen.getByText(/Too many wrong tries. Try again in 2m/i)).toBeInTheDocument();
  });

  it('switches to All entries tab and renders month jump filter and entries list', async () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue(baseJournalHook as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    const allEntriesTabBtn = screen.getByRole('button', { name: 'All entries' });
    await act(async () => {
      fireEvent.click(allEntriesTabBtn);
    });

    expect(screen.getByRole('combobox', { name: /Filter by month/i })).toBeInTheDocument();
    expect(screen.getByText('November 2026 (1)')).toBeInTheDocument();
    expect(screen.getByText('Shipped v1 milestone with the core team on staging.')).toBeInTheDocument();
  });

  it('expands entry card and displays full entry content', async () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      expandedEntryDetails: {
        'entry-1': {
          id: 'entry-1',
          date: '2026-11-04',
          mood: 'good',
          stress: 4,
          content: 'This is the complete, unabbreviated journal text for entry-1.',
          word_count: 52,
        },
      },
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'All entries' }));
    });

    const expandBtn = screen.getByRole('button', { name: 'Expand entry' });
    await act(async () => {
      fireEvent.click(expandBtn);
    });

    expect(screen.getByText('This is the complete, unabbreviated journal text for entry-1.')).toBeInTheDocument();
  });

  it('switches to Mood tab and renders stats and Average mood fallback', async () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      stats: {
        ...baseJournalHook.stats,
        average_mood: null,
      },
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mood' }));
    });

    expect(screen.getByText('Mood over time')).toBeInTheDocument();
    // Verify fallback from review findings: 'None yet' instead of em dash
    expect(screen.getByText('None yet')).toBeInTheDocument();
  });

  it('handles field error rendering on 422 save for content, mood, and stress', async () => {
    const saveMock = vi.fn().mockResolvedValue({
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: {
        content: 'Content cannot be empty.',
        mood: 'Pick a mood.',
        stress: 'Select a valid stress level.',
      },
    });

    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      saveToday: saveMock,
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);

    // Wait for initial sync to settle
    const textarea = await screen.findByPlaceholderText(/Start anywhere/i);

    // Select mood & type
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Good' }));
    });
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test entry' } });
    });

    const saveBtn = screen.getByRole('button', { name: /Save entry/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
      expect(screen.getByText('Content cannot be empty.')).toBeInTheDocument();
      expect(screen.getByText('Pick a mood.')).toBeInTheDocument();
      expect(screen.getByText('Select a valid stress level.')).toBeInTheDocument();
    });
  });

  it('renders explicit error state and Retry button when settings fail to load', () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      settingsError: 'Journal storage is temporarily unavailable.',
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    expect(screen.getByText('Journal Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Journal storage is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('renders retry button and JOURNAL_NOT_CONFIGURED error message', () => {
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      todayError: 'Journal storage is temporarily unavailable.',
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    expect(screen.getByText('Journal storage is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('deletes journal and redirects to Today tab', async () => {
    const deleteMock = vi.fn().mockResolvedValue({ ok: true });
    vi.spyOn(useJournalModule, 'useJournal').mockReturnValue({
      ...baseJournalHook,
      deleteEntireJournal: deleteMock,
    } as unknown as useJournalModule.UseJournalReturn);

    render(<JournalPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Privacy' }));
    });

    // Click delete permanently button
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete journal permanently' }));
    });

    const confirmInput = screen.getByPlaceholderText('DELETE');
    await act(async () => {
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
    });

    const deleteForeverBtn = screen.getByRole('button', { name: 'Delete forever' });
    await act(async () => {
      fireEvent.click(deleteForeverBtn);
    });

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledTimes(1);
      // Switches back to Today view
      expect(screen.getByPlaceholderText(/Start anywhere/i)).toBeInTheDocument();
    });
  });
});
