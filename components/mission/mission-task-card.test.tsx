import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MissionTaskCard } from './mission-task-card';
import type { MissionTask } from '@/hooks/useMissionApi';

const task = (over: Partial<MissionTask> = {}): MissionTask => ({
  id: 't1',
  missionId: '',
  roadmapTaskId: 'r1',
  title: 'Run 10 customer interviews',
  reason: "From your 'Validate demand' milestone.",
  effort: 'Medium',
  tag: 'Validate demand',
  milestone: { id: 'm1', title: 'Validate demand', dueOn: '2026-11-01' },
  order: 0,
  status: 'pending',
  ...over,
});

function setup(t = task(), cbs: Partial<Record<'onToggle' | 'onUp' | 'onDown' | 'onSnooze' | 'onReject', () => void>> = {}) {
  const props = { onToggle: vi.fn(), onUp: vi.fn(), onDown: vi.fn(), onSnooze: vi.fn(), onReject: vi.fn(), ...cbs };
  render(<ul><MissionTaskCard task={t} first={false} last={false} {...props} /></ul>);
  return props;
}

describe('MissionTaskCard', () => {
  it('renders the PRD why-line and a milestone chip linking to the roadmap milestones', () => {
    setup();
    expect(screen.getByText("Why: From your 'Validate demand' milestone.")).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Validate demand' }).getAttribute('href')).toBe('/roadmap/milestones');
  });

  it('a custom task has no why-line and a plain, non-link tag', () => {
    setup(task({ reason: '', roadmapTaskId: undefined, milestone: null, tag: 'Custom' }));
    expect(screen.queryByText(/^Why:/)).toBeNull();
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('the checkbox and the "⋯" button have accessible names', () => {
    const { onToggle } = setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete task: Run 10 customer interviews' }));
    expect(onToggle).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'More actions for Run 10 customer interviews' })).toBeTruthy();
  });

  it('the menu closes on Escape (focus returns to the trigger) and on an outside click', () => {
    setup();
    const trigger = screen.getByRole('button', { name: /More actions/ });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('snooze fires from the menu', () => {
    const { onSnooze } = setup();
    fireEvent.click(screen.getByRole('button', { name: /More actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Snooze to tomorrow' }));
    expect(onSnooze).toHaveBeenCalled();
  });

  it('Not relevant asks for a reason, and Cancel backs out without rejecting', () => {
    const { onReject } = setup();
    fireEvent.click(screen.getByRole('button', { name: /More actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Not relevant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onReject).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /More actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Not relevant' }));
    fireEvent.click(screen.getByRole('button', { name: "Doesn't apply" }));
    expect(onReject).toHaveBeenCalledWith("Doesn't apply");
  });

  it('a completed task shows checked and has no menu', () => {
    setup(task({ status: 'completed' }));
    expect(screen.getByRole('checkbox', { name: /Complete task/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('button', { name: /More actions/ })).toBeNull();
  });
});
