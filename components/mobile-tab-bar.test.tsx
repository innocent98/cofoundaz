import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MobileTabBar } from './mobile-tab-bar';

const openSidebar = vi.fn();
let role: string | null = 'founder';
let pathname = '/dashboard';
let unread = 0;

vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
vi.mock('@/components/sidebar-context', () => ({ useSidebar: () => ({ openSidebar, closeSidebar: vi.fn() }) }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ me: null, role, loading: false }) }));
vi.mock('@/hooks/useNotifications', () => ({ useNotifications: () => ({ unreadCount: unread }) }));

describe('MobileTabBar (PRD 2.1 region F)', () => {
  beforeEach(() => {
    role = 'founder';
    pathname = '/dashboard';
    unread = 0;
    openSidebar.mockReset();
  });

  it('has Home, Mission, AI, Notifications, More, in that order', () => {
    render(<MobileTabBar />);
    const labels = [...screen.getByRole('navigation', { name: 'Primary' }).querySelectorAll('a, button')].map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Home', 'Mission', 'AI', 'Notifications', 'More']);
  });

  it('is hidden at md and up (base styles are the small-screen design)', () => {
    render(<MobileTabBar />);
    expect(screen.getByRole('navigation', { name: 'Primary' }).className).toContain('md:hidden');
  });

  it('links go to the right routes and the current one is marked', () => {
    render(<MobileTabBar />);
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/dashboard');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Mission' }).getAttribute('href')).toBe('/mission');
    expect(screen.getByRole('link', { name: 'AI' }).getAttribute('href')).toBe('/ai');
    expect(screen.getByRole('link', { name: /Notifications/ }).getAttribute('href')).toBe('/notifications');
  });

  it('More opens the sidebar', () => {
    render(<MobileTabBar />);
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(openSidebar).toHaveBeenCalled();
  });

  it('unread count badge on Notifications, capped at 9+', () => {
    unread = 12;
    render(<MobileTabBar />);
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('roles without a mission or AI do not get those tabs (hidden, not disabled)', () => {
    role = 'accountant';
    render(<MobileTabBar />);
    expect(screen.queryByRole('link', { name: 'Mission' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'AI' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
  });
});
