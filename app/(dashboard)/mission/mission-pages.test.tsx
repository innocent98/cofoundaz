import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { axe } from 'jest-axe';
import MissionTodayPage from './page';
import MissionUpcomingPage from './upcoming/page';
import MissionSettingsPage from './settings/page';
import MissionStreaksPage from './streaks/page';
import MissionCompletedPage from './completed/page';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// ---- hook doubles -----------------------------------------------------------
type Today = Record<string, unknown>;
let today: Today;
const todayFns = {
  toggleTask: vi.fn(),
  addTask: vi.fn(),
  snoozeTask: vi.fn(),
  rejectTask: vi.fn(),
  reprioritizeUp: vi.fn(),
  reprioritizeDown: vi.fn(),
  completeAssigned: vi.fn(),
  generateRoadmap: vi.fn(),
  refetch: vi.fn(),
  updateSettings: vi.fn(),
};
vi.mock('@/hooks/useMissionApi', () => ({ useMissionApi: () => ({ ...today, ...todayFns }) }));

let upcoming: Record<string, unknown>;
const upcomingFns = { reorder: vi.fn(), generateRoadmap: vi.fn(), refetch: vi.fn() };
vi.mock('@/hooks/useMissionUpcoming', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useMissionUpcoming')>('@/hooks/useMissionUpcoming');
  return { ...actual, useMissionUpcoming: () => ({ ...upcoming, ...upcomingFns }) };
});

let role: string | null = 'founder';
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ role }) }));

let history: Record<string, unknown>;
vi.mock('@/hooks/useMissionHistory', () => ({ useMissionHistory: () => history }));

let completed: Record<string, unknown>;
const completedFns = { loadMore: vi.fn(), refetch: vi.fn() };
vi.mock('@/hooks/useMissionCompleted', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useMissionCompleted')>('@/hooks/useMissionCompleted');
  return { ...actual, useMissionCompleted: () => ({ ...completed, ...completedFns }) };
});

const ms = { id: 'm1', title: 'Validate demand', dueOn: '2026-11-01' };
const baseToday = (over: Today = {}): Today => ({
  isReady: true,
  state: 'pending',
  streak: 0,
  missionDate: '2026-10-19',
  emptyReason: null,
  assigned: [],
  generating: false,
  todayTasks: [],
  allCompleted: false,
  settings: null,
  settingsError: false,
  ...over,
});
const task = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  missionId: '',
  title: `Task ${id}`,
  reason: 'Because',
  effort: 'Medium',
  tag: 'Validate demand',
  milestone: ms,
  order: 0,
  status: 'pending',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  role = 'founder';
  today = baseToday();
});

describe('Today', () => {
  it('shows the PRD pending line while loading, never a made-up mission', () => {
    today = baseToday({ isReady: false, state: 'loading' });
    render(<MissionTodayPage />);
    expect(screen.getByRole('status').textContent).toContain('Building today');
  });

  it('no roadmap: PRD empty state, CTA generates the roadmap', () => {
    today = baseToday({ state: 'no_roadmap' });
    render(<MissionTodayPage />);
    expect(screen.getByText('Your mission comes from your roadmap.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Generate my roadmap' }));
    expect(todayFns.generateRoadmap).toHaveBeenCalled();
  });

  it('weekend off: PRD copy with a link to settings', () => {
    today = baseToday({ state: 'empty', emptyReason: 'weekend_off' });
    render(<MissionTodayPage />);
    expect(screen.getByText('Weekends off. Rest is a strategy too.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Mission settings/ }).getAttribute('href')).toBe('/mission/settings');
  });

  it('all caught up copy, with the add-task control still available', () => {
    today = baseToday({ state: 'empty', emptyReason: 'all_caught_up' });
    render(<MissionTodayPage />);
    expect(screen.getByText(/all caught up/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Add a task' })).toBeTruthy();
  });

  it('a load failure is an error with Try again, not an empty mission', () => {
    today = baseToday({ state: 'error' });
    render(<MissionTodayPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(todayFns.refetch).toHaveBeenCalled();
  });

  it('lists tasks and an "Assigned to you" section from assigned_to_me', () => {
    today = baseToday({
      todayTasks: [task('a')],
      assigned: [{ roadmapTaskId: 'r9', title: 'Ship the pitch', effort: 'Small', milestone: ms }],
    });
    render(<MissionTodayPage />);
    expect(screen.getByText('Task a')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Assigned to you' })).toBeTruthy();
    expect(screen.getByText('Ship the pitch')).toBeTruthy();
  });

  it('reject and snooze show the PRD toasts once saved', async () => {
    today = baseToday({ todayTasks: [task('a')] });
    todayFns.snoozeTask.mockResolvedValue(true);
    todayFns.rejectTask.mockResolvedValue(true);
    render(<MissionTodayPage />);
    fireEvent.click(screen.getByRole('button', { name: /More actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Snooze to tomorrow' }));
    expect(todayFns.snoozeTask).toHaveBeenCalledWith('a');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Moved to tomorrow’s mission.'));
    fireEvent.click(screen.getByRole('button', { name: /More actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Not relevant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Already done' }));
    expect(todayFns.rejectTask).toHaveBeenCalledWith('a', 'Already done');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Thanks, I’ll calibrate.'));
  });

  it('toasts success only when the save worked, an error when it failed', async () => {
    today = baseToday({ todayTasks: [task('a')] });
    todayFns.toggleTask.mockResolvedValueOnce(false);
    render(<MissionTodayPage />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete task: Task a' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t save that. Try again.'));
    expect(toast.success).not.toHaveBeenCalled();

    todayFns.toggleTask.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete task: Task a' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Nice. Mission progress saved.'));
  });

  it('a failed snooze or reject shows the error, not the success toast', async () => {
    today = baseToday({ todayTasks: [task('a')] });
    todayFns.snoozeTask.mockResolvedValue(false);
    render(<MissionTodayPage />);
    fireEvent.click(screen.getByRole('button', { name: /More actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Snooze to tomorrow' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t save that. Try again.'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it.each(['founder', 'team_member'])('%s can tick an assigned roadmap task', async (who) => {
    role = who;
    today = baseToday({ assigned: [{ roadmapTaskId: 'r9', title: 'Ship the pitch', effort: 'Small', milestone: ms }] });
    todayFns.completeAssigned.mockResolvedValue(true);
    render(<MissionTodayPage />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete task: Ship the pitch' }));
    expect(todayFns.completeAssigned).toHaveBeenCalledWith('r9');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Nice. Mission progress saved.'));
  });

  it('other roles get no checkbox on assigned rows', () => {
    role = 'mentor';
    today = baseToday({ assigned: [{ roadmapTaskId: 'r9', title: 'Ship the pitch', effort: 'Small', milestone: ms }] });
    render(<MissionTodayPage />);
    expect(screen.queryByRole('checkbox', { name: /Ship the pitch/ })).toBeNull();
  });

  it('adds a custom task and reports a failure instead of closing the form', async () => {
    today = baseToday({ todayTasks: [task('a')] });
    todayFns.addTask.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<MissionTodayPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add a task' }));
    fireEvent.change(screen.getByLabelText('New task title'), { target: { value: 'Call Sam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByLabelText('New task title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(screen.queryByLabelText('New task title')).toBeNull());
    expect(todayFns.addTask).toHaveBeenCalledWith('Call Sam');
  });

  it('the mission-complete state', () => {
    today = baseToday({ state: 'complete', allCompleted: true, todayTasks: [task('a', { status: 'completed' })] });
    render(<MissionTodayPage />);
    expect(screen.getByText('Mission complete.')).toBeTruthy();
  });

  it('has no axe violations', async () => {
    today = baseToday({ todayTasks: [task('a'), task('b')], assigned: [{ roadmapTaskId: 'r9', title: 'Ship', effort: 'Small', milestone: ms }] });
    const { container } = render(<MissionTodayPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Upcoming', () => {
  const day = (date: string, ids: string[], restDay = false) => ({
    date,
    restDay,
    tasks: ids.map((id, i) => ({ roadmapTaskId: id, title: `Up ${id}`, effort: 'Small', milestone: ms, carriedOver: i === 0 && id === 'a' })),
  });
  const data = (days: unknown[]) => ({ hasRoadmap: true, missionSize: 2, days });
  beforeEach(() => {
    upcoming = {
      loading: false,
      error: null,
      saving: false,
      data: data([day('2026-10-19', ['a', 'b']), day('2026-10-20', ['c']), day('2026-10-21', []), day('2026-10-24', [], true)]),
    };
    upcomingFns.reorder.mockResolvedValue(true);
  });

  it('renders each day: tasks, carried-over tag, an empty-queue day and a rest day', () => {
    render(<MissionUpcomingPage />);
    expect(screen.getByText('Up a')).toBeTruthy();
    expect(screen.getByText('Carried over')).toBeTruthy();
    expect(screen.getByText(/Nothing queued yet\./)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'roadmap' }).getAttribute('href')).toBe('/roadmap');
    expect(screen.getByText(/Rest day\./)).toBeTruthy();
  });

  it('the down arrow PUTs the whole visible order', async () => {
    render(<MissionUpcomingPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Move down: Up a' }));
    await waitFor(() => expect(upcomingFns.reorder).toHaveBeenCalledWith(['b', 'a', 'c']));
    expect(toast.success).toHaveBeenCalledWith('Order saved.');
  });

  it('drag and drop moves a task onto another', async () => {
    render(<MissionUpcomingPage />);
    const rows = screen.getAllByRole('listitem').filter((li) => li.getAttribute('draggable') === 'true');
    fireEvent.dragStart(rows[2]);
    fireEvent.drop(rows[0]);
    await waitFor(() => expect(upcomingFns.reorder).toHaveBeenCalledWith(['c', 'a', 'b']));
  });

  it('first task cannot move up, last cannot move down', () => {
    render(<MissionUpcomingPage />);
    expect((screen.getByRole('button', { name: 'Move up: Up a' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Move down: Up c' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('a failed save tells the user and keeps the refreshed list', async () => {
    upcomingFns.reorder.mockResolvedValue(false);
    render(<MissionUpcomingPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Move down: Up a' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('hides reordering for roles the API would 403', () => {
    role = 'mentor';
    render(<MissionUpcomingPage />);
    expect(screen.getByText('Up a')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Move (up|down)/ })).toBeNull();
  });

  it('no roadmap: the same Generate my roadmap empty state', () => {
    upcoming = { ...upcoming, data: { hasRoadmap: false, missionSize: 0, days: [] } };
    render(<MissionUpcomingPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate my roadmap' }));
    expect(upcomingFns.generateRoadmap).toHaveBeenCalled();
  });
});

describe('Settings', () => {
  const settings = { missionSize: 2, deliveryTime: '06:00 AM', weekendsOff: true };

  it('shows a loading state, not invented defaults, until settings arrive', () => {
    today = baseToday({ settings: null });
    render(<MissionSettingsPage />);
    expect(screen.getByRole('status', { name: 'Loading mission settings' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('size is a real radio group; picking one saves it', async () => {
    today = baseToday({ settings });
    todayFns.updateSettings.mockResolvedValue(true);
    render(<MissionSettingsPage />);
    const group = screen.getByRole('radiogroup', { name: 'Mission size' });
    expect(group).toBeTruthy();
    expect((screen.getByRole('radio', { name: /^2/ }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /^3/ }));
    expect(todayFns.updateSettings).toHaveBeenCalledWith({ missionSize: 3 });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Settings saved.'));
  });

  it('weekends is a labelled switch that saves the inverse', () => {
    today = baseToday({ settings });
    todayFns.updateSettings.mockResolvedValue(true);
    render(<MissionSettingsPage />);
    const sw = screen.getByRole('switch', { name: 'Weekends off' });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    expect(todayFns.updateSettings).toHaveBeenCalledWith({ weekendsOff: false });
  });

  it('delivery time is a labelled select that saves', () => {
    today = baseToday({ settings });
    todayFns.updateSettings.mockResolvedValue(true);
    render(<MissionSettingsPage />);
    fireEvent.change(screen.getByLabelText('Delivery time'), { target: { value: '08:00 AM' } });
    expect(todayFns.updateSettings).toHaveBeenCalledWith({ deliveryTime: '08:00 AM' });
  });

  it('a failed save says so', async () => {
    today = baseToday({ settings });
    todayFns.updateSettings.mockResolvedValue(false);
    render(<MissionSettingsPage />);
    fireEvent.click(screen.getByRole('switch', { name: 'Weekends off' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('has no axe violations', async () => {
    today = baseToday({ settings });
    const { container } = render(<MissionSettingsPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Streaks', () => {
  it('shows current and best streak from history', () => {
    history = { missions: [], weeklyCompletionPct: 50, currentStreak: 3, bestStreak: 9, loading: false };
    render(<MissionStreaksPage />);
    expect(screen.getByText('Best streak')).toBeTruthy();
    expect(screen.getByText('9 days')).toBeTruthy();
    expect(screen.getByText('3 days')).toBeTruthy();
  });
});

describe('Completed', () => {
  const entry = (id: string, day: string) => ({ id, title: `Done ${id}`, completedAt: `${day}T09:30:00`, missionDate: day, milestone: ms });
  beforeEach(() => {
    history = {
      missions: [{ mission_date: '2026-10-18', completed: 2, total: 2, status: 'complete' }],
      weeklyCompletionPct: 50,
      loading: false,
    };
    completed = { items: [entry('1', '2026-10-18'), entry('2', '2026-10-17')], hasMore: true, loading: false, loadingMore: false, error: null };
  });

  it('lists completed tasks by day, keeps the weekly chip, and has no stray "1/5"', () => {
    render(<MissionCompletedPage />);
    expect(screen.getByText('This week: 50% complete')).toBeTruthy();
    expect(screen.getByText('Done 1')).toBeTruthy();
    expect(screen.getByText('Done 2')).toBeTruthy();
    expect(screen.getByText('Complete')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d\/\d/);
  });

  it('Load more fetches the next page', () => {
    render(<MissionCompletedPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(completedFns.loadMore).toHaveBeenCalled();
  });

  it('no Load more on the last page; an empty log has copy', () => {
    completed = { ...completed, items: [], hasMore: false };
    render(<MissionCompletedPage />);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    expect(screen.getByText('No completed tasks yet')).toBeTruthy();
  });
});
