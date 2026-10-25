import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { personLabel, ROADMAP_STAGES, useRoadmapApi } from './useRoadmapApi';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', async (orig) => ({ ...(await orig<typeof import('@/lib/api/client')>()), apiClient: vi.fn() }));

const tree = {
  data: {
    roadmap: { id: 'r1', stage: 'build', drift: { slipped_count: 1 } },
    current_stage: 'build',
    phases: [
      {
        id: 'p1',
        name: 'Shape the idea',
        order: 1,
        starts_on: '2026-10-17',
        ends_on: '2026-11-14',
        milestones: [
          {
            id: 'm2', title: 'Second', description: null, due_on: '2026-11-07', owner: null, status: 'todo', progress: 0,
            overdue: false, order: 2, dependency_count: 0, replanned: null, tasks: [],
          },
          {
            id: 'm1', title: 'First', description: 'Do it', due_on: '2026-10-10', owner: { id: 'u1', name: null }, status: 'todo', progress: 50,
            overdue: true, order: 1, dependency_count: 2, replanned: { at: '2026-10-18T03:00:00Z', reason: 'slipped' },
            tasks: [
              { id: 't2', title: 'B', description: null, effort: 'large', status: 'todo', assignee: null, due_on: null, overdue: false, order: 2, depends_on: ['t1'] },
              { id: 't1', title: 'A', description: null, effort: 'small', status: 'todo', assignee: { id: 'u1', name: 'Ada F' }, due_on: '2026-10-09', overdue: true, order: 1, depends_on: [] },
            ],
          },
        ],
      },
    ],
  },
};

describe('useRoadmapApi mapping (shape from GET /roadmap)', () => {
  beforeEach(() => vi.mocked(apiClient).mockResolvedValue(tree));

  it('has the six real stages, with Build and Growth rather than Traction', () => {
    expect(ROADMAP_STAGES.map((s) => s.label)).toEqual(['Idea', 'Validation', 'Build', 'Launch', 'Growth', 'Scale']);
  });

  it('maps stage, owner ids, dependency count, replanned and overdue, sorted by the server order', async () => {
    const { result } = renderHook(() => useRoadmapApi());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentStage).toBe('build');
    expect(result.current.slippedCount).toBe(1);
    const [first, second] = result.current.phases[0].milestones;
    expect([first.id, second.id]).toEqual(['m1', 'm2']);
    expect(first.owner).toEqual({ id: 'u1', name: null });
    expect(first.dependencyCount).toBe(2);
    expect(first.replanned).toEqual({ at: '2026-10-18T03:00:00Z', reason: 'slipped' });
    expect(first.status).toBe('overdue');
    expect(first.description).toBe('Do it');
    expect(first.tasks.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(first.tasks[0].status).toBe('overdue');
    expect(first.tasks[0].assignee).toEqual({ id: 'u1', name: 'Ada F' });
    expect(second.owner).toBeNull();
    expect(second.replanned).toBeNull();
  });

  it('labels people by name, then member email, then a neutral word', () => {
    const emails = new Map([['u1', 'ada@example.com']]);
    expect(personLabel({ id: 'u1', name: 'Ada F' }, emails)).toBe('Ada F');
    expect(personLabel({ id: 'u1', name: null }, emails)).toBe('ada@example.com');
    expect(personLabel({ id: 'u9', name: null }, emails)).toBe('Member');
    expect(personLabel(null)).toBe('Unassigned');
  });

  it('keeps showing the tree while a refetch runs (no skeleton flash)', async () => {
    const { result } = renderHook(() => useRoadmapApi());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const p = result.current.refetch();
    expect(result.current.loading).toBe(false);
    await p;
  });
});
