import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DashboardNavbar } from './dashboardnavbar';

let role: string | null = 'founder';
const openSearch = vi.fn();
const markRead = vi.fn();
const markAllRead = vi.fn();
let items: Array<Record<string, unknown>> = [];
let unread = 0;
let notifError: Error | null = null;
const refetch = vi.fn().mockResolvedValue(undefined);
let health: { status: string; score: number; weeklyDelta: number } = { status: 'ok', score: 93, weeklyDelta: 3 };

vi.mock('@/components/sidebar-context', () => ({ useSidebar: () => ({ openSidebar: vi.fn(), closeSidebar: vi.fn() }) }));
vi.mock('@/components/search/search-context', () => ({ useSearch: () => ({ openSearch }) }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ me: null, role, loading: false }) }));
vi.mock('@/hooks/useHealthScore', () => ({ useHealthScore: () => ({ data: health, loading: false }) }));
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ items, unreadCount: unread, markRead, markAllRead, error: notifError, refetch }),
}));

const note = (over: Record<string, unknown>) => ({
  id: 'n1',
  title: 'Your daily AI briefing is ready',
  time: '1m ago',
  href: '/dashboard',
  isUnread: true,
  iconBg: 'bg-brand-tint',
  iconText: '✦',
  ...over,
});

describe('DashboardNavbar (top bar, PRD 2.1)', () => {
  beforeEach(() => {
    role = 'founder';
    items = [];
    unread = 0;
    notifError = null;
    refetch.mockClear();
    health = { status: 'ok', score: 93, weeklyDelta: 3 };
    openSearch.mockReset();
    markRead.mockReset();
    markAllRead.mockReset();
  });

  it('+ Invite is founder only: shown for a founder, hidden (not disabled) for everyone else', () => {
    const onInvite = vi.fn();
    const { unmount } = render(<DashboardNavbar onInvite={onInvite} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Invite' }));
    expect(onInvite).toHaveBeenCalled();
    unmount();
    for (const r of ['team_member', 'mentor', 'accountant', null]) {
      role = r;
      const view = render(<DashboardNavbar onInvite={onInvite} />);
      expect(screen.queryByRole('button', { name: '+ Invite' })).toBeNull();
      view.unmount();
    }
  });

  it('the search box opens the overlay and shows the PRD placeholder without "contacts"', () => {
    render(<DashboardNavbar onInvite={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Search' });
    expect(trigger.textContent).toContain('Search anything, docs, tasks, conversations…');
    expect(trigger.textContent).not.toMatch(/contacts/);
    fireEvent.click(trigger);
    expect(openSearch).toHaveBeenCalled();
  });

  it('Health chip links to /health and is hidden until an assessment exists', () => {
    const { unmount } = render(<DashboardNavbar onInvite={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Health score 93' }).getAttribute('href')).toBe('/health');
    unmount();
    health = { status: 'pending_assessment', score: 0, weeklyDelta: 0 };
    render(<DashboardNavbar onInvite={vi.fn()} />);
    expect(screen.queryByRole('link', { name: /Health score/ })).toBeNull();
  });

  it('bell shows the unread count; the dropdown deep-links a notification and marks it read', () => {
    unread = 3;
    items = [note({}), note({ id: 'n2', title: 'Plain one', href: null, isUnread: false })];
    render(<DashboardNavbar onInvite={vi.fn()} />);
    expect(screen.getByText('3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notifications' }));
    const link = screen.getByRole('link', { name: /Your daily AI briefing is ready/ });
    expect(link.getAttribute('href')).toBe('/dashboard');
    fireEvent.click(link);
    expect(markRead).toHaveBeenCalledWith('n1');
    expect(screen.queryByText('Plain one')).toBeNull(); // dropdown closed on navigate
  });

  it('Mark all read, View all link, empty copy, Escape closes', () => {
    unread = 1;
    items = [note({})];
    const { rerender } = render(<DashboardNavbar onInvite={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notifications' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(markAllRead).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'View all notifications' }).getAttribute('href')).toBe('/notifications');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: 'View all notifications' })).toBeNull();
    items = [];
    unread = 0;
    rerender(<DashboardNavbar onInvite={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notifications' }));
    expect(screen.getByText('No new notifications.')).toBeTruthy();
  });

  it('a failed notifications request shows an error with Retry, never the empty state', () => {
    notifError = new Error('boom');
    render(<DashboardNavbar onInvite={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notifications' }));
    expect(screen.getByText('Could not load notifications.')).toBeInTheDocument();
    expect(screen.queryByText('No new notifications.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('the panel is pinned inside the viewport on phones (16 px gutters) and anchored to the bell from md', () => {
    render(<DashboardNavbar onInvite={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notifications' }));
    const panel = screen.getByText('Notifications', { selector: 'h4' }).closest('div[class*="shadow-raised"]') as HTMLElement;
    expect(panel.className).toContain('fixed');
    expect(panel.className).toContain('inset-x-4');
    expect(panel.className).toContain('md:absolute');
  });
});
