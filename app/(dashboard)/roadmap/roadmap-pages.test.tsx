import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import MilestonesPage from './milestones/page';
import TimelinePage from './page';
import KanbanPage from './kanban/page';

const board = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@/hooks/useRoadmapBoard', () => ({ useRoadmapBoard: () => board.current }));
vi.mock('@/components/roadmap/board-drawer', () => ({ BoardDrawer: () => null }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const run = vi.fn();
const open = vi.fn();
const ms = {
  id: 'm1', phaseId: 'p1', title: 'Validate demand', dueOn: '2026-10-10', owner: { id: 'u1', name: null }, status: 'overdue',
  progress: 25, dependencyCount: 2, replanned: { at: '2026-10-18T03:00:00Z', reason: 'slipped' },
  tasks: [
    { id: 't1', milestoneId: 'm1', title: 'Call users', effort: 'Small', status: 'overdue', assignee: null, dueOn: '2026-10-09', dependsOn: [] },
    { id: 't2', milestoneId: 'm1', title: 'Write notes', effort: 'Small', status: 'done', assignee: null, dueOn: '', dependsOn: [] },
  ],
};
const phase = { id: 'p1', name: 'Shape the idea', order: 1, startsOn: '2026-10-01', endsOn: '2026-11-01', milestones: [ms] };

function setBoard(over: Record<string, unknown> = {}) {
  board.current = {
    currentStage: 'build',
    phases: [phase],
    loading: false,
    error: null,
    refetch: vi.fn(),
    canEdit: true,
    open,
    close: vi.fn(),
    selected: null,
    members: { emailById: new Map([['u1', 'tm@example.com']]), members: [] },
    breakdown: { states: {}, highlighted: new Set(), run, dismiss: vi.fn(), clearHighlight: vi.fn() },
    createPhase: vi.fn(), deletePhase: vi.fn(), createMilestone: vi.fn(), deleteMilestone: vi.fn(), updateTask: vi.fn(),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setBoard();
});

describe('Milestones page', () => {
  it('has Owner and Dependencies columns, with the email standing in for a null name', () => {
    render(<MilestonesPage />);
    expect(screen.getByRole('columnheader', { name: 'Owner' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Dependencies' })).toBeTruthy();
    const row = screen.getByRole('row', { name: /Validate demand/ });
    expect(within(row).getByText('tm@example.com')).toBeTruthy();
    expect(within(row).getByText('2 dependencies')).toBeTruthy();
    expect(within(row).getByText('Overdue')).toBeTruthy();
    expect(within(row).getByLabelText(/Re-planned/)).toBeTruthy();
    expect(within(row).getByText('Oct 10, 2026')).toBeTruthy();
  });

  it('Break down starts the AI job for that milestone and the row menu opens the drawer', () => {
    render(<MilestonesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Break down/ }));
    expect(run).toHaveBeenCalledWith('m1');
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Validate demand' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(open).toHaveBeenCalled();
  });

  it('hides Break down and Delete without edit access', () => {
    setBoard({ canEdit: false });
    render(<MilestonesPage />);
    expect(screen.queryByRole('button', { name: /Break down/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Validate demand' }));
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Open' })).toBeTruthy();
  });

  it('shows an error with Retry and an empty state', () => {
    const refetch = vi.fn();
    setBoard({ error: new Error('x'), phases: [], refetch });
    const { unmount } = render(<MilestonesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
    unmount();
    setBoard({ phases: [] });
    render(<MilestonesPage />);
    expect(screen.getByText(/No milestones yet/)).toBeTruthy();
  });
});

describe('Timeline page', () => {
  it('shows the six real stages with the current one marked, overdue and re-planned chips, and expandable tasks', () => {
    render(<TimelinePage />);
    const rail = screen.getByRole('navigation', { name: 'Startup stage' });
    expect(within(rail).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '1. Idea', '2. Validation', '3. Build', '4. Launch', '5. Growth', '6. Scale',
    ]);
    expect(rail.querySelector('[aria-current="step"]')?.textContent).toBe('3. Build');
    expect(screen.getByText('Overdue')).toBeTruthy();
    expect(screen.getByLabelText('Re-planned. Adjusted on Oct 18, 2026 because slipped')).toBeTruthy();

    const toggle = screen.getByRole('button', { name: '2 tasks' });
    expect(screen.queryByText('Call users')).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByText('Call users')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('zoom buttons are real toggles', () => {
    render(<TimelinePage />);
    const week = screen.getByRole('button', { name: 'Week' });
    expect(screen.getByRole('button', { name: 'Month' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(week);
    expect(week.getAttribute('aria-pressed')).toBe('true');
  });

  it('adds a phase inline, without a browser prompt', () => {
    const createPhase = vi.fn().mockResolvedValue(undefined);
    setBoard({ createPhase });
    render(<TimelinePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Add phase' }));
    fireEvent.change(screen.getByLabelText('New phase name'), { target: { value: 'Launch prep' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(createPhase).toHaveBeenCalledWith('Launch prep');
  });

  it('shows a loading error with Retry and an empty state that links to templates', () => {
    setBoard({ error: new Error('x'), phases: [] });
    const { unmount } = render(<TimelinePage />);
    expect(screen.getByText("Couldn't load your roadmap")).toBeTruthy();
    unmount();
    setBoard({ phases: [] });
    render(<TimelinePage />);
    expect(screen.getByRole('link', { name: 'Browse templates' }).getAttribute('href')).toBe('/roadmap/templates');
  });
});

describe('Kanban page', () => {
  it('moves a task with the keyboard-friendly Move to menu', () => {
    const updateTask = vi.fn().mockResolvedValue(undefined);
    setBoard({ updateTask });
    render(<KanbanPage />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Move "Call users" to' }), { target: { value: 'in_progress' } });
    expect(updateTask).toHaveBeenCalledWith('t1', { status: 'in_progress' });
  });

  it('opens the drawer from a card and has no Move menu without edit access', () => {
    setBoard({ canEdit: false });
    render(<KanbanPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Call users' }));
    expect(open).toHaveBeenCalled();
    expect(screen.queryByRole('combobox', { name: /Move/ })).toBeNull();
  });
});
