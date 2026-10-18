import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ShellTopBar } from './shell-top-bar';

vi.mock('@/components/sidebar-context', () => ({ useSidebar: () => ({ openSidebar: vi.fn(), closeSidebar: vi.fn() }) }));
vi.mock('@/components/search/search-context', () => ({ useSearch: () => ({ openSearch: vi.fn() }) }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ me: null, role: 'founder', workspaceName: 'NovaPay', loading: false }) }));
vi.mock('@/hooks/useHealthScore', () => ({ useHealthScore: () => ({ data: { status: 'ok', score: 93, weeklyDelta: 3 }, loading: false }) }));
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ items: [], unreadCount: 2, markRead: vi.fn(), markAllRead: vi.fn() }),
}));

describe('ShellTopBar', () => {
  it('is the global top bar: search, health, bell and + Invite, with the section title', () => {
    render(<ShellTopBar title="Today's Mission" />);
    expect(screen.getByText("Today's Mission")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
    expect(screen.getByLabelText('Health score 93')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Toggle notifications' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Invite' })).toBeTruthy();
  });

  it('+ Invite opens the invite modal for the workspace', () => {
    render(<ShellTopBar title="Today's Mission" />);
    fireEvent.click(screen.getByRole('button', { name: '+ Invite' }));
    expect(screen.getByText('Invite to NovaPay')).toBeTruthy();
  });
});
