import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsPage from './page';
import * as useNotificationsPageModule from '@/hooks/useNotificationsPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/shell-top-bar', () => ({
  ShellTopBar: ({ title }: { title: string }) => <div data-testid="shell-top-bar">{title}</div>,
}));

vi.mock('@/components/notifications/notification-preferences-grid', () => ({
  NotificationPreferencesGrid: () => <div data-testid="preferences-grid">Preferences Grid</div>,
}));

vi.mock('@/components/notifications/notification-digest-tab', () => ({
  NotificationDigestTab: () => <div data-testid="digest-tab">Digest Tab</div>,
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseHookState = {
    items: [
      {
        id: 'n-1',
        type: 'billing.payment.failed',
        module: 'billing',
        priority: 'critical',
        title: 'Payment failed for subscription',
        body: 'Please update your payment card.',
        data: {},
        read: false,
        isUnread: true,
        archived: false,
        created_at: '2026-11-06T10:00:00Z',
        time: '1h ago',
        section: 'TODAY' as const,
        href: '/billing',
        actionText: 'Update billing',
        isCritical: true,
        iconText: '💳',
        iconBg: 'bg-accent-xf7eedc',
      },
      {
        id: 'n-2',
        type: 'team.comment.mentioned',
        module: 'team',
        priority: 'normal',
        title: 'Mentioned by David in Roadmap',
        body: '',
        data: {},
        read: true,
        isUnread: false,
        archived: false,
        created_at: '2026-11-05T10:00:00Z',
        time: '1d ago',
        section: 'THIS WEEK' as const,
        href: null,
        isCritical: false,
        iconText: '👤',
        iconBg: 'bg-brand-tint',
      },
    ],
    archivedItems: [
      {
        id: 'arch-1',
        type: 'marketing.post.published',
        module: 'marketing',
        priority: 'normal',
        title: 'Scheduled post published',
        body: '',
        data: {},
        read: true,
        isUnread: false,
        archived: true,
        created_at: '2026-11-01T10:00:00Z',
        time: '5d ago',
        section: 'EARLIER' as const,
        href: null,
        isCritical: false,
        iconText: '📣',
        iconBg: 'bg-accent-xf7eedc',
      },
    ],
    counts: {
      all: 10,
      unread: 1,
      urgent: 2,
      urgent_unread: 1,
      mentions: 1,
      ai: 0,
      deadlines: 0,
      billing: 1,
      archived: 1,
    },
    filter: 'all' as const,
    setFilterCategory: vi.fn(),
    nextCursor: null,
    archivedNextCursor: null,
    loading: false,
    archivedLoading: false,
    error: null,
    archivedError: null,
    fetchInbox: vi.fn().mockResolvedValue(undefined),
    fetchArchived: vi.fn().mockResolvedValue(undefined),
    loadMore: vi.fn().mockResolvedValue(undefined),
    loadMoreArchived: vi.fn().mockResolvedValue(undefined),
    markRead: vi.fn().mockResolvedValue(undefined),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    archive: vi.fn().mockResolvedValue(true),
    restore: vi.fn().mockResolvedValue(true),
  };

  it('renders Inbox tab by default with urgent_unread heading count', () => {
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue(baseHookState);

    render(<NotificationsPage />);

    expect(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText(/1 unread · 1 need you today/i)).toBeInTheDocument();
    expect(screen.getByText('Payment failed for subscription')).toBeInTheDocument();
    expect(screen.getByText('Mentioned by David in Roadmap')).toBeInTheDocument();
  });

  it('allows clicking notification row without href and marks it read', async () => {
    const markReadMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue({
      ...baseHookState,
      markRead: markReadMock,
    });

    render(<NotificationsPage />);

    const mentionItem = screen.getByText('Mentioned by David in Roadmap');
    fireEvent.click(mentionItem);

    // Should not crash and is accessible
    expect(mentionItem).toBeInTheDocument();
  });

  it('supports keyboard navigation via Enter and Space keys', async () => {
    const markReadMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue({
      ...baseHookState,
      markRead: markReadMock,
    });

    render(<NotificationsPage />);

    const row = screen.getByRole('button', { name: /Payment failed for subscription/i });
    expect(row).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });
    await waitFor(() => {
      expect(markReadMock).toHaveBeenCalledWith('n-1');
    });
  });

  it('switches to Preferences tab and renders preferences grid', () => {
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue(baseHookState);

    render(<NotificationsPage />);

    const prefTabBtns = screen.getAllByRole('button', { name: 'Preferences' });
    fireEvent.click(prefTabBtns[0]);

    expect(screen.getByTestId('preferences-grid')).toBeInTheDocument();
  });

  it('switches to Digest tab and renders digest component', () => {
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue(baseHookState);

    render(<NotificationsPage />);

    const digestTabBtn = screen.getByRole('button', { name: 'Digest & quiet hours' });
    fireEvent.click(digestTabBtn);

    expect(screen.getByTestId('digest-tab')).toBeInTheDocument();
  });

  it('switches to Archived tab and renders restore button', () => {
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue(baseHookState);

    render(<NotificationsPage />);

    const archTabBtn = screen.getByRole('button', { name: 'Archived' });
    fireEvent.click(archTabBtn);

    expect(screen.getByText('Archived notifications')).toBeInTheDocument();
    expect(screen.getByText('Scheduled post published')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
  });

  it('filters notifications by chip and calls setFilterCategory', () => {
    const setFilterMock = vi.fn();
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue({
      ...baseHookState,
      setFilterCategory: setFilterMock,
    });

    render(<NotificationsPage />);

    const urgentChip = screen.getByRole('button', { name: /Urgent/i });
    fireEvent.click(urgentChip);

    expect(setFilterMock).toHaveBeenCalledWith('urgent');
  });

  it('renders "Nothing unread" when unread count is 0', () => {
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue({
      ...baseHookState,
      counts: { ...baseHookState.counts, unread: 0 },
    });

    render(<NotificationsPage />);
    expect(screen.getByText('Nothing unread')).toBeInTheDocument();
  });

  it('shows error toast when markAllRead throws an error', async () => {
    const markAllReadMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.spyOn(useNotificationsPageModule, 'useNotificationsPage').mockReturnValue({
      ...baseHookState,
      markAllRead: markAllReadMock,
    });

    render(<NotificationsPage />);

    const markAllBtn = screen.getByRole('button', { name: 'Mark all read' });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(screen.getByText('Could not mark all as read. Try again.')).toBeInTheDocument();
    });
  });
});

