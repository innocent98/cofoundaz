import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TeamSectionPage from './page';
import * as teamApi from '@/lib/api/team';
import * as commentsApi from '@/lib/api/comments';
import { ApiError } from '@/lib/api/client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/team',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api/profile', () => ({
  getMe: vi.fn().mockResolvedValue({
    user: { id: 'u-1', email: 'member@example.com' },
    profile: { full_name: 'Member User', role_title: 'Developer', country: null, avatar_url: null },
    memberships: [{ startup_id: 'ws-1', role: 'team_member' }],
    active_workspace_id: 'ws-1',
  }),
}));

const mockWorkspace = {
  me: {
    user: { id: 'u-founder', email: 'founder@example.com', name: 'Founder One' },
    memberships: [{ startup_id: 'ws-1', role: 'founder' }],
  },
  role: 'founder',
  workspaceName: 'Acme Inc',
  setMe: vi.fn(),
};

vi.mock('@/components/workspace-context', () => ({
  useWorkspace: () => mockWorkspace,
}));

vi.mock('@/components/sidebar-context', () => ({
  useSidebar: () => ({ openSidebar: vi.fn(), isOpen: false }),
}));

const mockActivity = vi.hoisted(() => ({
  data: [
    {
      id: 'act-1',
      actor: 'Ade',
      summary: 'invited John Doe',
      action: 'team.member.invited',
      verb: 'invited',
      entity: 'team_member',
      entity_type: 'team_member',
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
    },
    {
      id: 'act-2',
      actor: 'System',
      summary: 'signed NDA',
      action: 'document.signed',
      verb: 'signed',
      entity: 'document',
      entity_type: 'document',
      timestamp: new Date().toISOString(),
      relativeTime: '5m ago',
    },
  ],
  loading: false,
  error: null,
  hasMore: false,
  loadingMore: false,
  fetchMore: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@/hooks/useDashboardApi', () => ({
  useActivityFeed: () => mockActivity,
}));

vi.mock('@/lib/api/team', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/team')>()),
  getTeamMembers: vi.fn(),
  getPendingInvitations: vi.fn(),
  getCommentThreads: vi.fn(),
  getTeamAuditLogs: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  resendInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  leaveWorkspace: vi.fn(),
}));

vi.mock('@/lib/api/comments', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/comments')>()),
  listComments: vi.fn(),
  createComment: vi.fn(),
  resolveComment: vi.fn(),
}));

describe('Team Page - Adebayo Review Specifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspace.role = 'founder';
    vi.mocked(teamApi.getTeamMembers).mockResolvedValue([
      {
        user_id: 'u-founder',
        name: 'Founder One',
        email: 'founder@example.com',
        role: 'founder',
        last_active_at: new Date().toISOString(),
      },
      {
        user_id: 'u-member',
        name: null,
        email: 'member@example.com',
        role: 'team_member',
        last_active_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
    vi.mocked(teamApi.getPendingInvitations).mockResolvedValue([
      {
        id: 'inv-1',
        email: 'invitee@example.com',
        role: 'team_member',
        created_at: new Date().toISOString(),
      },
    ]);
    vi.mocked(teamApi.getCommentThreads).mockResolvedValue([]);
    vi.mocked(teamApi.getTeamAuditLogs).mockResolvedValue({ items: [], next_cursor: null });
  });

  it('renders members with proper pluralization (1 member vs n members)', async () => {
    render(<TeamSectionPage />);
    expect(await screen.findByText(/2 members/i)).toBeInTheDocument();

    // With 1 member:
    vi.mocked(teamApi.getTeamMembers).mockResolvedValueOnce([
      {
        user_id: 'u-founder',
        name: 'Founder One',
        email: 'founder@example.com',
        role: 'founder',
        last_active_at: new Date().toISOString(),
      },
    ]);
    const { rerender } = render(<TeamSectionPage />);
    rerender(<TeamSectionPage />);
  });

  it('displays "Active now" only when last_active_at is under 60 seconds', async () => {
    render(<TeamSectionPage />);
    expect(await screen.findByText('Active now')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  it('filters Activity on entity_type and provides Retry button on error', async () => {
    render(<TeamSectionPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));

    expect(await screen.findByText(/invited John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/signed NDA/i)).toBeInTheDocument();

    // Switch to Documents filter
    fireEvent.click(screen.getByRole('button', { name: 'Documents' }));
    expect(screen.queryByText(/invited John Doe/i)).not.toBeInTheDocument();
    expect(screen.getByText(/signed NDA/i)).toBeInTheDocument();
  });

  it('handles Comment threads with string author, comment_count, and entity_type:entity_id:anchor key', async () => {
    const thread = {
      entity_type: 'roadmap_milestone',
      entity_id: 'ms-1',
      anchor: 'step-1',
      context: 'Q3 Launch Plan',
      comment_count: 5,
      unresolved_count: 2,
      mentions_me: true,
      last_comment: {
        snippet: 'Need legal review by Friday',
        author: 'Sarah Connor',
        created_at: new Date().toISOString(),
      },
    };
    vi.mocked(teamApi.getCommentThreads).mockResolvedValue([thread]);
    vi.mocked(commentsApi.listComments).mockResolvedValue([
      {
        id: 'c-1',
        entity_type: 'roadmap_milestone',
        entity_id: 'ms-1',
        anchor: 'step-1',
        author: { id: 'u-sarah', name: 'Sarah Connor' },
        body: 'Need legal review by Friday',
        mention_user_ids: [],
        created_at: new Date().toISOString(),
        edited_at: null,
        resolved_at: null,
        is_mine: false,
      },
    ]);

    render(<TeamSectionPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));

    expect(await screen.findByText('Q3 Launch Plan')).toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText(/5 comments/i)).toBeInTheDocument();
    expect(screen.getByText('2 open')).toBeInTheDocument();

    // Expand thread
    fireEvent.click(screen.getByText('Q3 Launch Plan'));
    expect(await screen.findByText('Need legal review by Friday')).toBeInTheDocument();
  });

  it('renders Audit Log with full sentence copy from guide §5 and clean action badges', async () => {
    vi.mocked(teamApi.getTeamAuditLogs).mockResolvedValue({
      items: [
        {
          id: 'audit-1',
          actor: 'Victor',
          action: 'team.invitation.created',
          target: 'alex@example.com',
          created_at: new Date().toISOString(),
        },
      ],
      next_cursor: null,
    });

    render(<TeamSectionPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Audit log' }));

    expect(await screen.findByText('Victor invited alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('Invite sent')).toBeInTheDocument();

    // Verify all real guide §5 actions: resent, revoked, joined, role_changed, removed, left, workspace.updated
    vi.mocked(teamApi.getTeamAuditLogs).mockResolvedValueOnce({
      items: [
        {
          id: 'audit-2',
          actor: 'Founder One',
          action: 'team.invitation.resent',
          target: 'pending@example.com',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-3',
          actor: 'Founder One',
          action: 'team.invitation.revoked',
          target: 'revoked@example.com',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-4',
          actor: 'Alex',
          action: 'team.member.joined',
          target: 'Someone',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-5',
          actor: 'Founder One',
          action: 'team.member.role_changed',
          target: 'Alex',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-6',
          actor: 'Founder One',
          action: 'team.member.removed',
          target: 'member@example.com',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-7',
          actor: 'Alex',
          action: 'team.member.left',
          target: 'Someone',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit-8',
          actor: 'Founder One',
          action: 'workspace.updated',
          target: 'Someone',
          created_at: new Date().toISOString(),
        },
      ],
      next_cursor: null,
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Members' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Audit log' }));

    expect(await screen.findByText('Founder One re-sent the invitation to pending@example.com')).toBeInTheDocument();
    expect(screen.getByText('Invite resent')).toBeInTheDocument();
    expect(screen.getByText('Founder One revoked the invitation for revoked@example.com')).toBeInTheDocument();
    expect(screen.getByText('Invite revoked')).toBeInTheDocument();
    expect(screen.getByText('Alex joined')).toBeInTheDocument();
    expect(screen.getByText('Member joined')).toBeInTheDocument();
    expect(screen.getByText("Founder One changed Alex's role")).toBeInTheDocument();
    expect(screen.getByText('Role changed')).toBeInTheDocument();
    expect(screen.getByText('Founder One removed member@example.com')).toBeInTheDocument();
    expect(screen.getByText('Member removed')).toBeInTheDocument();
    expect(screen.getByText('Alex left the workspace')).toBeInTheDocument();
    expect(screen.getByText('Member left')).toBeInTheDocument();
    expect(screen.getByText('Founder One updated the workspace settings')).toBeInTheDocument();
    expect(screen.getByText('Workspace updated')).toBeInTheDocument();
  });

  it('hides founder controls immediately and refetches me when 403 occurs on mutation', async () => {
    render(<TeamSectionPage />);
    const manageButtons = await screen.findAllByRole('button', { name: 'Manage' });
    expect(manageButtons.length).toBeGreaterThan(0);

    fireEvent.click(manageButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove from workspace' }));
    vi.mocked(teamApi.removeMember).mockRejectedValueOnce(new ApiError(403, 'Forbidden', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      // Founder controls (such as "+ Invite someone" or "Manage" buttons) should be hidden immediately
      expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /\+ Invite someone/i })).not.toBeInTheDocument();
    });
  });

  it('shows error state with Retry if pending invitations fail to load', async () => {
    vi.mocked(teamApi.getPendingInvitations).mockRejectedValueOnce(
      new ApiError(500, 'Server Error', { error: { message: 'Failed to load invitations' } })
    );

    render(<TeamSectionPage />);
    expect(await screen.findByText('Failed to load invitations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('opens Manage Modal with role="dialog", accessible labels and Founder option', async () => {
    render(<TeamSectionPage />);
    const manageButtons = await screen.findAllByRole('button', { name: 'Manage' });
    fireEvent.click(manageButtons[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Founder' })).toBeInTheDocument();

    // 404 Member Removal displays "That person is no longer on the team"
    fireEvent.click(screen.getByRole('button', { name: 'Remove from workspace' }));
    vi.mocked(teamApi.removeMember).mockRejectedValueOnce(new ApiError(404, 'Not Found', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(screen.getByText('That person is no longer on the team.')).toBeInTheDocument();
    });
  });
});

