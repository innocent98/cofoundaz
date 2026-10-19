import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import TemplatesPage from './templates/page';
import ReplanPage from './replan/page';
import TimelinePage from './page';

const tpl = { id: 'tp1', title: 'Launch pack', stage: 'idea', category: 'Launch', milestone_count: 2, task_count: 4, applied: false };
const detail = { ...tpl, phases: [{ name: 'Phase A', milestones: [{ title: 'M1', tasks: [{ title: 'T1', effort: 'small' }] }] }] };
vi.mock('@/hooks/useRoadmapTemplates', () => ({
  useRoadmapTemplates: () => ({
    templates: [tpl],
    loading: false,
    error: null,
    getTemplate: vi.fn().mockResolvedValue(detail),
    applyTemplate: vi.fn().mockResolvedValue({ already_applied: false, added: { phases: 1, milestones: 2, tasks: 4 } }),
  }),
}));

const entry = {
  id: 'h1',
  summary: 'Moved 1 milestone',
  created_at: '2026-10-18T03:00:00Z',
  applied_by: { name: 'Founder' },
  change_count: 1,
  changes: [{ change_id: 'c1', title: 'Validate demand' }],
};
vi.mock('@/hooks/useRoadmapReplan', () => ({
  useRoadmapReplan: () => ({ history: [entry], historyLoading: false, previewReplan: vi.fn(), applyReplan: vi.fn(), loadHistory: vi.fn() }),
}));
vi.mock('@/hooks/useRoadmapApi', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useRoadmapApi')>('@/hooks/useRoadmapApi');
  return { ...actual, useRoadmapApi: () => ({ slippedCount: 0, refetch: vi.fn() }) };
});

const board = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@/hooks/useRoadmapBoard', () => ({ useRoadmapBoard: () => board.current }));
vi.mock('@/components/roadmap/board-drawer', () => ({ BoardDrawer: () => null }));

describe('Template dialogs', () => {
  it('Escape closes the preview and focus returns to the Preview button', async () => {
    render(<TemplatesPage />);
    const previewBtn = screen.getByRole('button', { name: 'Preview' });
    previewBtn.focus();
    await userEvent.click(previewBtn);
    const dialog = await screen.findByRole('dialog', { name: 'Template preview' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(previewBtn);
  });

  it('Tab is trapped inside the apply confirmation and Escape closes it, returning focus', async () => {
    render(<TemplatesPage />);
    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    await userEvent.click(applyBtn);
    const dialog = screen.getByRole('dialog', { name: 'Apply template' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Confirm & apply' }));
    await userEvent.tab();
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(applyBtn);
  });

  it('Apply this pack from the preview ends back on the card button after Escape', async () => {
    render(<TemplatesPage />);
    const previewBtn = screen.getByRole('button', { name: 'Preview' });
    await userEvent.click(previewBtn);
    await userEvent.click(await screen.findByRole('button', { name: 'Apply this pack' }));
    expect(screen.getByRole('dialog', { name: 'Apply template' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(previewBtn);
  });
});

describe('Re-plan history', () => {
  it('the entry button exposes aria-expanded and aria-controls', async () => {
    render(<ReplanPage />);
    const btn = screen.getByRole('button', { name: /Moved 1 milestone/ });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const id = btn.getAttribute('aria-controls')!;
    expect(document.getElementById(id)).toBeTruthy();
  });
});

describe('Timeline phase labels', () => {
  it('count from 1 even though the API order starts at 0', () => {
    const ms = { id: 'm1', phaseId: 'p1', title: 'M', dueOn: '2026-10-10', owner: { id: 'u1', name: null }, status: 'todo', progress: 0, dependencyCount: 0, replanned: null, tasks: [] };
    board.current = {
      currentStage: 'idea',
      phases: [{ id: 'p1', name: 'Shape the idea', order: 0, startsOn: '2026-10-01', endsOn: '2026-11-01', milestones: [ms] }],
      loading: false, error: null, refetch: vi.fn(), canEdit: true, open: vi.fn(), close: vi.fn(), selected: null,
      members: { emailById: new Map(), members: [] },
      breakdown: { states: {}, highlighted: new Set(), run: vi.fn(), dismiss: vi.fn(), clearHighlight: vi.fn() },
      createPhase: vi.fn(), deletePhase: vi.fn(), createMilestone: vi.fn(), deleteMilestone: vi.fn(), updateTask: vi.fn(),
    };
    render(<TimelinePage />);
    expect(screen.getByText('Phase 1: Shape the idea')).toBeTruthy();
    expect(screen.queryByText(/Phase 0/)).toBeNull();
  });
});
