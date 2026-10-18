import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BriefingCard, briefingSeed, BRIEFING_EMPTY_COPY } from './briefing-card';
import { ApiError } from '@/lib/api/client';
import type { AIBriefing } from '@/types/dashboard';

const ready: AIBriefing = {
  id: 'b1',
  date: '2026-10-18',
  agentBadge: 'Co-Founder',
  content: 'NovaPay is at the idea stage.',
  status: 'ready',
  actions: [
    { index: 0, label: 'Interview 3 target customers', kind: 'task', href: '/validation', accepted: false, missionTaskId: null },
    { index: 1, label: 'Review the deadline', kind: 'navigate', href: '/roadmap', accepted: false, missionTaskId: null },
    { index: 2, label: 'Track runway', kind: 'task', href: '/finance', accepted: true, missionTaskId: 't9' },
  ],
};

function setup(overrides: Partial<React.ComponentProps<typeof BriefingCard>> = {}) {
  const props = {
    briefing: ready,
    loading: false,
    onRetry: vi.fn(),
    onChanged: vi.fn(),
    onTellMeMore: vi.fn(),
    accept: vi.fn().mockResolvedValue({ action_index: 0, kind: 'task', href: '/validation', mission_task: { id: 't1', title: 'x' } }),
    navigate: vi.fn(),
    ...overrides,
  };
  render(<BriefingCard {...props} />);
  return props;
}

describe('BriefingCard', () => {
  it('shows a skeleton while loading and the PRD error copy with Retry on failure', () => {
    const { unmount } = render(
      <BriefingCard briefing={undefined} loading onRetry={vi.fn()} onChanged={vi.fn()} onTellMeMore={vi.fn()} accept={vi.fn()} navigate={vi.fn()} />,
    );
    expect(screen.getByRole('status', { name: 'Loading your AI Briefing' })).toBeTruthy();
    unmount();
    const onRetry = vi.fn();
    render(
      <BriefingCard briefing={undefined} loading={false} onRetry={onRetry} onChanged={vi.fn()} onTellMeMore={vi.fn()} accept={vi.fn()} navigate={vi.fn()} />,
    );
    expect(screen.getByText('Couldn’t load this.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('is hidden for restricted roles', () => {
    const { container } = render(
      <BriefingCard
        briefing={{ ...ready, status: 'restricted', id: null, content: '', actions: [] }}
        loading={false}
        onRetry={vi.fn()}
        onChanged={vi.fn()}
        onTellMeMore={vi.fn()}
        accept={vi.fn()}
        navigate={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('empty briefing shows the PRD pre-data copy and no actions', () => {
    setup({ briefing: { ...ready, status: 'empty', id: null, content: '', actions: [] } });
    expect(screen.getByText(BRIEFING_EMPTY_COPY)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Do it/ })).toBeNull();
    expect(screen.queryByText('Tell me more')).toBeNull();
  });

  it('Do it on a task action calls accept, then asks the page to refetch; no navigation', async () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Do it: Interview 3 target customers' }));
    await waitFor(() => expect(p.onChanged).toHaveBeenCalled());
    expect(p.accept).toHaveBeenCalledWith('b1', 0);
    expect(p.navigate).not.toHaveBeenCalled();
  });

  it('Do it on a navigate action routes to the returned href', async () => {
    const p = setup({ accept: vi.fn().mockResolvedValue({ action_index: 1, kind: 'navigate', href: '/roadmap', mission_task: null }) });
    fireEvent.click(screen.getByRole('button', { name: 'Do it: Review the deadline' }));
    await waitFor(() => expect(p.navigate).toHaveBeenCalledWith('/roadmap'));
  });

  it('an accepted task shows "Added to today\'s mission" linking to /mission, with no Do it', () => {
    setup();
    const link = screen.getByRole('link', { name: /Added to today's mission/ });
    expect(link.getAttribute('href')).toBe('/mission');
    expect(screen.queryByRole('button', { name: 'Do it: Track runway' })).toBeNull();
  });

  it('a stale briefing (409) shows the honest message and refetches instead of retrying', async () => {
    const err = new ApiError(409, 'Conflict', { error: { code: 'BRIEFING_STALE', message: 'x' } });
    const p = setup({ accept: vi.fn().mockRejectedValue(err) });
    fireEvent.click(screen.getByRole('button', { name: 'Do it: Interview 3 target customers' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', "That briefing is from an earlier day. Showing today's briefing.");
    expect(p.onChanged).toHaveBeenCalled();
    expect(p.accept).toHaveBeenCalledTimes(1);
  });

  it('a 403 explains who may act on the briefing', async () => {
    const p = setup({ accept: vi.fn().mockRejectedValue(new ApiError(403, 'Forbidden', {})) });
    fireEvent.click(screen.getByRole('button', { name: 'Do it: Review the deadline' }));
    expect((await screen.findByRole('alert')).textContent).toContain('founders and team members');
    expect(p.onChanged).not.toHaveBeenCalled();
  });

  it('Tell me more passes the briefing to the drawer', () => {
    const p = setup();
    fireEvent.click(screen.getByText('Tell me more'));
    expect(p.onTellMeMore).toHaveBeenCalledWith(ready);
  });

  it('briefingSeed carries the briefing text so the conversation has context', () => {
    expect(briefingSeed(ready)).toContain('Tell me more about today\'s briefing.');
    expect(briefingSeed(ready)).toContain('NovaPay is at the idea stage.');
  });
});

describe('BriefingCard navigation safety', () => {
  it('never navigates to an external href returned for a navigate action', async () => {
    const p = setup({ accept: vi.fn().mockResolvedValue({ action_index: 1, kind: 'navigate', href: 'https://evil.example', mission_task: null }) });
    fireEvent.click(screen.getByRole('button', { name: 'Do it: Review the deadline' }));
    await waitFor(() => expect(p.onChanged).toHaveBeenCalled());
    expect(p.navigate).not.toHaveBeenCalled();
  });
});
