import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RoadmapDrawer } from './RoadmapDrawer';
import type { RoadmapMilestone, RoadmapTask } from '@/hooks/useRoadmapApi';

vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ role: 'founder' }) }));
vi.mock('@/lib/api/comments', async (orig) => ({ ...(await orig<typeof import('@/lib/api/comments')>()), listComments: vi.fn().mockResolvedValue([]) }));

const members = [
  { user_id: 'u1', name: 'Ada F', email: 'ada@example.com', role: 'founder' },
  { user_id: 'u2', name: null, email: 'tm@example.com', role: 'team_member' },
];

const task = (over: Partial<RoadmapTask> = {}): RoadmapTask => ({
  id: 't1',
  milestoneId: 'm1',
  title: 'Interview users',
  effort: 'Small',
  status: 'todo',
  assignee: null,
  dueOn: '',
  dependsOn: [],
  ...over,
});

const milestone = (over: Partial<RoadmapMilestone> = {}): RoadmapMilestone => ({
  id: 'm1',
  phaseId: 'p1',
  title: 'Validate demand',
  dueOn: '2026-11-01',
  owner: { id: 'u2', name: null },
  status: 'pending',
  progress: 0,
  dependencyCount: 1,
  replanned: { at: '2026-10-18T03:00:00Z', reason: '8 days overdue and not yet done.' },
  tasks: [task(), task({ id: 't2', title: 'Write the summary', dependsOn: ['t1'] })],
  ...over,
});

function setup(over: Partial<React.ComponentProps<typeof RoadmapDrawer>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    milestone: milestone(),
    allTasks: [task(), task({ id: 't2', title: 'Write the summary', dependsOn: ['t1'] })],
    members,
    canEdit: true,
    onBreakdown: vi.fn(),
    highlightedTaskIds: new Set<string>(),
    onCreateTask: vi.fn().mockResolvedValue(undefined),
    onUpdateTask: vi.fn().mockResolvedValue(undefined),
    onDeleteTask: vi.fn().mockResolvedValue(undefined),
    onUpdateMilestone: vi.fn().mockResolvedValue(undefined),
    onDeleteMilestone: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
  render(<RoadmapDrawer {...props} />);
  return props;
}

describe('RoadmapDrawer', () => {
  it('is a labelled modal dialog, closes on Escape and takes focus', () => {
    const p = setup();
    const dialog = screen.getByRole('dialog', { name: 'Validate demand' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(p.onClose).toHaveBeenCalled();
  });

  it('lists members plus Unassigned and falls back to the email when a name is null', () => {
    setup();
    const owner = screen.getByRole('combobox', { name: 'Milestone owner' }) as HTMLSelectElement;
    expect([...owner.options].map((o) => o.textContent)).toEqual(['Unassigned', 'Ada F', 'tm@example.com']);
    expect(owner.value).toBe('u2');
  });

  it('sends owner_id, null for Unassigned, and task assignee and due date', async () => {
    const p = setup();
    fireEvent.change(screen.getByRole('combobox', { name: 'Milestone owner' }), { target: { value: 'u1' } });
    await waitFor(() => expect(p.onUpdateMilestone).toHaveBeenCalledWith('m1', { owner_id: 'u1' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Milestone owner' }), { target: { value: '' } });
    await waitFor(() => expect(p.onUpdateMilestone).toHaveBeenCalledWith('m1', { owner_id: null }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Assignee for Interview users' }), { target: { value: 'u1' } });
    await waitFor(() => expect(p.onUpdateTask).toHaveBeenCalledWith('t1', { assignee_id: 'u1' }));
    fireEvent.change(screen.getByLabelText('Due date for Interview users'), { target: { value: '2026-11-05' } });
    await waitFor(() => expect(p.onUpdateTask).toHaveBeenCalledWith('t1', { due_on: '2026-11-05' }));
  });

  it('runs the AI breakdown from the drawer and shows its result line', () => {
    const p = setup({ breakdown: { phase: 'done', message: 'Added 4 tasks.' } });
    expect(screen.getByRole('status').textContent).toBe('Added 4 tasks.');
    fireEvent.click(screen.getByRole('button', { name: /Break down/ }));
    expect(p.onBreakdown).toHaveBeenCalledWith('m1');
  });

  it('highlights tasks the AI just added', () => {
    setup({ highlightedTaskIds: new Set(['t2']) });
    const fresh = screen.getAllByTestId('task-new');
    expect(fresh).toHaveLength(1);
    expect(fresh[0].textContent).toContain('Write the summary');
  });

  it('shows the re-planned chip with the reason, and what blocks what', () => {
    setup();
    expect(screen.getByLabelText(/Re-planned\. Adjusted on Oct 18, 2026 because 8 days overdue/)).toBeTruthy();
    const deps = screen.getByRole('region', { name: 'Dependencies' });
    expect(deps.textContent).toContain('Write the summary is blocked by Interview users');
  });

  it('is read-only without edit access: no pickers, no add, no delete, no breakdown', () => {
    setup({ canEdit: false });
    expect(screen.queryByRole('combobox', { name: 'Milestone owner' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete milestone' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Break down/ })).toBeNull();
    expect(screen.queryByLabelText('New task title')).toBeNull();
    expect(screen.getByText('tm@example.com')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <RoadmapDrawer
        isOpen={false}
        onClose={vi.fn()}
        allTasks={[]}
        members={[]}
        canEdit
        onBreakdown={vi.fn()}
        highlightedTaskIds={new Set()}
        onCreateTask={vi.fn()}
        onUpdateTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onUpdateMilestone={vi.fn()}
        onDeleteMilestone={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });
});
