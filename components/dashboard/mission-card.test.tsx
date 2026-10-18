import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MissionCard, MISSION_COPY } from './mission-card';
import type { DashboardMissionState } from '@/types/dashboard';

const task = (id: string, completed = false) => ({ id, title: `Task ${id}`, reason: '', order: 0, completed });
const mission = (over: Partial<DashboardMissionState> = {}): DashboardMissionState => ({
  streakDays: 0,
  tasks: [task('a'), task('b')],
  emptyReason: null,
  ...over,
});

function setup(m: DashboardMissionState | null | undefined, onComplete = vi.fn().mockResolvedValue(undefined), loading = false, readOnly = false) {
  render(<MissionCard mission={m} loading={loading} onRetry={vi.fn()} onComplete={onComplete} readOnly={readOnly} />);
  return onComplete;
}

describe('MissionCard', () => {
  it('weekend off: PRD 4.5 copy and a link to mission settings (never "complete your kickoff assessment")', () => {
    setup(mission({ tasks: [], emptyReason: 'weekend_off' }));
    expect(screen.getByText(MISSION_COPY.weekendOff)).toBeTruthy();
    expect(screen.queryByText(/kickoff assessment/)).toBeNull();
    expect(screen.getByRole('link', { name: /Mission settings/ }).getAttribute('href')).toBe('/mission/settings');
  });

  it('all caught up copy', () => {
    setup(mission({ tasks: [], emptyReason: 'all_caught_up' }));
    expect(screen.getByText(MISSION_COPY.allCaughtUp)).toBeTruthy();
  });

  it('no roadmap (mission null) asks for the assessment', () => {
    setup(null);
    expect(screen.getByText(MISSION_COPY.noRoadmap)).toBeTruthy();
  });

  it('skeleton while loading; error copy + Retry when the section failed', () => {
    const { unmount } = render(<MissionCard mission={undefined} loading onRetry={vi.fn()} onComplete={vi.fn()} />);
    expect(screen.getByRole('status', { name: "Loading Today's Mission" })).toBeTruthy();
    unmount();
    setup(mission({ error: true }));
    expect(screen.getByText('Couldn’t load this.')).toBeTruthy();
  });

  it('ticking a task saves it server-side (onComplete), shows it done, and cannot be ticked twice', async () => {
    let resolve!: () => void;
    const onComplete = vi.fn().mockReturnValue(new Promise<void>((r) => (resolve = r)));
    setup(mission(), onComplete);
    const box = screen.getByRole('checkbox', { name: 'Complete task: Task a' });
    fireEvent.click(box);
    expect(onComplete).toHaveBeenCalledWith('a');
    expect(box.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(box);
    expect(onComplete).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('a completed task is checked and disabled', () => {
    setup(mission({ tasks: [task('a', true), task('b')] }));
    const done = screen.getByRole('checkbox', { name: 'Complete task: Task a' }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    expect(done.getAttribute('aria-checked')).toBe('true');
  });

  it('all done: "Mission complete." with the streak', () => {
    setup(mission({ tasks: [task('a', true)], streakDays: 4 }));
    expect(screen.getByText('Mission complete. 4-day streak.')).toBeTruthy();
  });

  it('footer links to /mission', () => {
    setup(mission());
    expect(screen.getByRole('link', { name: /Go to mission/ }).getAttribute('href')).toBe('/mission');
  });

  it('read-only roles (mentor) see the tasks and their state but get no tick buttons', () => {
    const onComplete = setup(mission({ tasks: [task('a', true), task('b')] }), undefined, false, true);
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByRole('img', { name: 'Done' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Not done' })).toBeTruthy();
    expect(screen.getByText('Task a')).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
