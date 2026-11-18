'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/sidebar-context';
import { useWorkspace } from '@/components/workspace-context';
import { useActivityFeed } from '@/hooks/useDashboardApi';
import { roleLabel, NAV_ROLES, type MemberRole } from '@/lib/nav-access';
import { ApiError, formatApiErrorMessage } from '@/lib/api/client';
import { getMe } from '@/lib/api/profile';
import {
  INVITE_ROLE_OPTIONS,
  sendInvitations,
  summarizeInvites,
  getTeamMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  getPendingInvitations,
  resendInvitation,
  revokeInvitation,
  getCommentThreads,
  getTeamAuditLogs,
  exportTeamAuditCsv,
  type TeamMemberRow,
  type PendingInvitation,
  type CommentThreadItem,
  type CommentThreadFilter,
  type AuditLogEntry,
  type InviteRole,
  type InviteRow,
  InviteError,
} from '@/lib/api/team';
import {
  listComments,
  createComment,
  resolveComment,
  type Comment,
  type CommentEntityType,
} from '@/lib/api/comments';
import {
  Bell,
  Plus,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';

type TeamSubTab = 'Members' | 'Roles' | 'Activity' | 'Comments' | 'Audit log';
type ActivityFilter = 'All' | 'Edits' | 'Comments' | 'Documents';

function getInitials(nameOrEmail: string): string {
  const clean = nameOrEmail.trim();
  if (!clean) return 'U';
  if (clean.includes('@')) {
    const handle = clean.split('@')[0];
    return handle.slice(0, 2).toUpperCase();
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return 'never';
  const diff = Date.now() - new Date(isoString).getTime();
  if (isNaN(diff) || diff < 0) return 'never';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Active now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAuditTimestamp(isoString: string): string {
  if (!isoString) return 'Just now';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (isSameDay) return `Today ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
}

function formatAuditSentence(actor: string, action: string, target: string): string {
  const act = action.toLowerCase();
  switch (act) {
    case 'team.invitation.created':
      return `${actor} invited ${target}`;
    case 'team.invitation.resent':
      return `${actor} re-sent the invitation to ${target}`;
    case 'team.invitation.revoked':
      return `${actor} revoked the invitation for ${target}`;
    case 'team.member.joined':
      return `${actor} joined`;
    case 'team.member.role_changed':
      return `${actor} changed ${target}'s role`;
    case 'team.member.removed':
      return `${actor} removed ${target}`;
    case 'team.member.left':
      return `${actor} left the workspace`;
    case 'workspace.updated':
      return `${actor} updated the workspace settings`;
    default:
      return `${actor} performed ${action.replace(/[_.]/g, ' ')}${target && target !== 'Someone' ? ' on ' + target : ''}`;
  }
}

function formatActionText(action: string): string {
  const act = action.toLowerCase();
  switch (act) {
    case 'team.invitation.created':
      return 'Invite sent';
    case 'team.invitation.resent':
      return 'Invite resent';
    case 'team.invitation.revoked':
      return 'Invite revoked';
    case 'team.member.joined':
      return 'Member joined';
    case 'team.member.role_changed':
      return 'Role changed';
    case 'team.member.removed':
      return 'Member removed';
    case 'team.member.left':
      return 'Member left';
    case 'workspace.updated':
      return 'Workspace updated';
    default:
      return action.replace(/[_.]/g, ' ');
  }
}

function getAuditBadgeClass(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('remove') || lower.includes('left') || lower.includes('revoke')) {
    return 'bg-danger-xfceaea text-danger-x9e3b3b';
  }
  if (lower.includes('change') || lower.includes('role')) {
    return 'bg-danger-xfceaea text-danger-x9e3b3b';
  }
  if (lower.includes('invite')) {
    return 'bg-neutral-xe5efea text-brand-strong';
  }
  return 'bg-neutral-xf5efea text-accent-x7a6025';
}

function getRoleBadgeClass(roleStr: string): string {
  const r = roleStr.toLowerCase();
  if (r === 'founder') return 'bg-neutral-xf5efea text-accent-x7a6025';
  if (r === 'team_member') return 'bg-surface-muted text-ink-muted';
  if (r === 'accountant' || r === 'legal_advisor') return 'bg-accent-xf2ece1 text-accent-x7a6025';
  if (r === 'mentor' || r === 'business_consultant') return 'bg-neutral-xe5efea text-brand-strong';
  return 'bg-surface-muted text-ink-muted';
}

function getRoleLabel(roleStr: string): string {
  const r = roleStr.toLowerCase() as MemberRole;
  if (r === 'founder') return 'Founder';
  if (r === 'team_member') return 'Team Member';
  if (r === 'mentor') return 'Mentor';
  if (r === 'business_consultant') return 'Business Consultant';
  if (r === 'accountant') return 'Accountant';
  if (r === 'legal_advisor') return 'Legal Advisor';
  if (r === 'investor') return 'Investor';
  try {
    return roleLabel(r);
  } catch {
    return roleStr;
  }
}

// Module keys and readable labels for Roles capability matrix
const MODULE_ROWS: { key: string; label: string }[] = [
  { key: '/dashboard', label: 'Dashboard' },
  { key: '/mission', label: 'Mission' },
  { key: '/health', label: 'Health score' },
  { key: '/roadmap', label: 'Roadmap' },
  { key: '/business-builder', label: 'Business Builder' },
  { key: '/validation', label: 'Validation Hub' },
  { key: '/assessment', label: 'Startup assessment' },
  { key: '/marketing', label: 'Marketing' },
  { key: '/sales', label: 'Sales' },
  { key: '/finance', label: 'Finance' },
  { key: '/funding', label: 'Funding' },
  { key: '/investor-readiness', label: 'Investor readiness' },
  { key: '/legal', label: 'Legal and compliance' },
  { key: '/marketplace', label: 'Marketplace' },
  { key: '/academy', label: 'Learning Academy' },
  { key: '/documents', label: 'Documents' },
  { key: '/calendar', label: 'Calendar' },
  { key: '/team', label: 'Team' },
  { key: '/analytics-reports', label: 'Analytics and reports' },
  { key: '/journal', label: 'Founder Journal' },
  { key: '/notifications', label: 'Notifications' },
  { key: '/settings', label: 'Settings' },
];

const ROLES_COLUMNS: { role: MemberRole; label: string }[] = [
  { role: 'founder', label: 'Founder' },
  { role: 'team_member', label: 'Team Member' },
  { role: 'mentor', label: 'Mentor' },
  { role: 'business_consultant', label: 'Business Consultant' },
  { role: 'accountant', label: 'Accountant' },
  { role: 'legal_advisor', label: 'Legal Advisor' },
  { role: 'investor', label: 'Investor' },
];

// Helper to trap focus within dialogs
function useFocusTrap(isOpen: boolean, onEscape: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onEscape]);

  return containerRef;
}

export default function TeamSectionPage(): React.JSX.Element {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { me, role: currentRole, workspaceName, setMe } = useWorkspace();

  const [forbiddenFounder, setForbiddenFounder] = useState(false);
  const isFounder = currentRole === 'founder' && !forbiddenFounder;

  const [activeTab, setActiveTab] = useState<TeamSubTab>('Members');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((text: string, isError = false) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage({ text, isError });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Helper to refetch profile on 403 and hide founder controls immediately
  const refetchMe = useCallback(async () => {
    setForbiddenFounder(true);
    try {
      const freshMe = await getMe();
      setMe(freshMe);
    } catch {
      /* ignore */
    }
  }, [setMe]);

  // -------------------------------------------------------------
  // Tab 1: Members State & Data
  // -------------------------------------------------------------
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const membersData = await getTeamMembers();
      setMembers(membersData);
      setMembersError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
      }
      setMembersError(formatApiErrorMessage(err, "Couldn't load members."));
    }
  }, [refetchMe]);

  const fetchInvitations = useCallback(async () => {
    if (!isFounder) return;
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const invData = await getPendingInvitations();
      setInvitations(invData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
      }
      setInvitationsError(formatApiErrorMessage(err, "Couldn't load pending invitations."));
    } finally {
      setInvitationsLoading(false);
    }
  }, [isFounder, refetchMe]);

  const refetchMembersAndInvitations = useCallback(async (isInitial = false) => {
    if (isInitial) setMembersLoading(true);
    setMembersError(null);
    await fetchMembers();
    if (isInitial) setMembersLoading(false);
    if (isFounder) {
      await fetchInvitations();
    }
  }, [fetchMembers, fetchInvitations, isFounder]);

  useEffect(() => {
    queueMicrotask(() => {
      void refetchMembersAndInvitations(true);
    });
  }, [refetchMembersAndInvitations]);

  // Leave workspace modal / flow
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveBusy, setLeaveBusy] = useState(false);

  const handleLeaveConfirm = async () => {
    setLeaveBusy(true);
    setLeaveError(null);
    try {
      await leaveWorkspace();
      try {
        localStorage.removeItem('cf_workspace_id');
      } catch {
        /* ignore */
      }
      const freshMe = await (await import('@/lib/api/profile')).getMe().catch(() => null);
      if (freshMe && freshMe.memberships.length > 0) {
        setMe(freshMe);
        localStorage.setItem('cf_workspace_id', freshMe.memberships[0].startup_id);
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const d = err.data as { error?: { code?: string; message?: string } } | undefined;
        if (d?.error?.code === 'LAST_FOUNDER' || err.status === 409) {
          setLeaveError(d?.error?.message || 'You are the only founder. Make someone else a founder before you leave.');
          setLeaveBusy(false);
          return;
        }
      }
      setLeaveError(formatApiErrorMessage(err, "Couldn't leave workspace. Try again."));
    } finally {
      setLeaveBusy(false);
    }
  };

  // Manage member modal
  const [managedMember, setManagedMember] = useState<TeamMemberRow | null>(null);
  const [manageRoleInput, setManageRoleInput] = useState<InviteRole>('team_member');
  const [manageBusy, setManageBusy] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  const openManageModal = (member: TeamMemberRow) => {
    setManagedMember(member);
    const validRoles: InviteRole[] = ['founder', 'team_member', 'mentor', 'accountant', 'legal_advisor', 'business_consultant'];
    const r = member.role.toLowerCase() as InviteRole;
    setManageRoleInput(validRoles.includes(r) ? r : 'team_member');
    setManageError(null);
    setIsRemoveConfirmOpen(false);
  };

  const handleSaveRole = async () => {
    if (!managedMember) return;
    setManageBusy(true);
    setManageError(null);
    const memberName = managedMember.name?.trim() || managedMember.email;
    try {
      await updateMemberRole(managedMember.user_id, manageRoleInput);
      showToast(`${memberName} is now ${getRoleLabel(manageRoleInput)}.`);
      setManagedMember(null);
      void refetchMembersAndInvitations(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        showToast('That person is no longer on the team.', true);
        setManagedMember(null);
        void refetchMembersAndInvitations(false);
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
        setManagedMember(null);
        setIsRemoveConfirmOpen(false);
        return;
      }
      setManageError(formatApiErrorMessage(err, "Couldn't update role."));
    } finally {
      setManageBusy(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!managedMember) return;
    setManageBusy(true);
    setManageError(null);
    const memberName = managedMember.name?.trim() || managedMember.email;
    try {
      const res = await removeMember(managedMember.user_id);
      let toast = `${memberName} was removed.`;
      if (res.document_grants_revoked > 0) {
        toast += ' Their document access was revoked.';
      }
      showToast(toast);
      setManagedMember(null);
      setIsRemoveConfirmOpen(false);
      void refetchMembersAndInvitations(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        showToast('That person is no longer on the team.', true);
        setManagedMember(null);
        void refetchMembersAndInvitations(false);
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
        setManagedMember(null);
        setIsRemoveConfirmOpen(false);
        return;
      }
      setManageError(formatApiErrorMessage(err, "Couldn't remove member."));
    } finally {
      setManageBusy(false);
    }
  };

  // Pending invitations actions
  const [revokeConfirmId, setRevokeConfirmId] = useState<PendingInvitation | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const handleResendInvite = async (inv: PendingInvitation) => {
    setActionBusyId(inv.id);
    try {
      const res = await resendInvitation(inv.id);
      if (res.delivered) {
        showToast('Invitation sent');
      } else {
        showToast("Couldn't send the email. Try again.", true);
      }
      void refetchMembersAndInvitations(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('That invitation is no longer pending.', true);
        void refetchMembersAndInvitations(false);
      } else if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
      } else {
        showToast(formatApiErrorMessage(err, "Couldn't resend invitation."), true);
      }
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRevokeInvite = async () => {
    if (!revokeConfirmId) return;
    const inv = revokeConfirmId;
    setActionBusyId(inv.id);
    try {
      await revokeInvitation(inv.id);
      showToast(`Invitation for ${inv.email} revoked.`);
      setRevokeConfirmId(null);
      void refetchMembersAndInvitations(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('That invitation is no longer pending.', true);
        setRevokeConfirmId(null);
        void refetchMembersAndInvitations(false);
      } else if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
        setRevokeConfirmId(null);
      } else {
        showToast(formatApiErrorMessage(err, "Couldn't revoke invitation."), true);
      }
    } finally {
      setActionBusyId(null);
    }
  };

  // Invite modal state (founder only)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleChoice, setInviteRoleChoice] = useState<InviteRole>('team_member');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErrorText, setInviteErrorText] = useState<string | null>(null);

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteErrorText(null);
    const row: InviteRow = {
      email: inviteEmail.trim(),
      role: inviteRoleChoice,
    };
    try {
      const result = await sendInvitations([row]);
      const summary = summarizeInvites(result);
      if (summary) showToast(summary);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      void refetchMembersAndInvitations(false);
    } catch (err) {
      if (err instanceof InviteError) {
        if (err.kind === 'forbidden') {
          void refetchMe();
          setIsInviteModalOpen(false);
          return;
        }
        if (err.fieldErrors.length > 0) {
          setInviteErrorText(err.fieldErrors[0].message);
        } else {
          setInviteErrorText(err.message);
        }
      } else {
        setInviteErrorText(formatApiErrorMessage(err, "Couldn't send invitation. Try again."));
      }
    } finally {
      setInviteBusy(false);
    }
  };

  // Focus trap hooks for modals
  const inviteModalRef = useFocusTrap(isInviteModalOpen, () => setIsInviteModalOpen(false));
  const manageModalRef = useFocusTrap(Boolean(managedMember), () => setManagedMember(null));
  const revokeModalRef = useFocusTrap(Boolean(revokeConfirmId), () => setRevokeConfirmId(null));
  const leaveModalRef = useFocusTrap(isLeaveConfirmOpen, () => setIsLeaveConfirmOpen(false));

  // -------------------------------------------------------------
  // Tab 3: Activity Tab
  // -------------------------------------------------------------
  const { data: activityItems, loading: activityLoading, error: activityError, hasMore: activityHasMore, loadingMore: activityLoadingMore, fetchMore: activityFetchMore, refetch: activityRefetch } = useActivityFeed();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('All');

  const filteredActivities = useMemo(() => {
    return activityItems.filter((item) => {
      if (activityFilter === 'All') return true;
      const act = (item.action || item.verb || '').toLowerCase();
      const entity = (item.entity || '').toLowerCase();
      if (activityFilter === 'Documents') {
        return entity.startsWith('document') || act.startsWith('document.');
      }
      if (activityFilter === 'Comments') {
        return act.includes('comment');
      }
      if (activityFilter === 'Edits') {
        const isDoc = entity.startsWith('document') || act.startsWith('document.');
        const isComment = act.includes('comment');
        return !isDoc && !isComment;
      }
      return true;
    });
  }, [activityItems, activityFilter]);

  const groupedActivities = useMemo(() => {
    const todayList: typeof filteredActivities = [];
    const yesterdayList: typeof filteredActivities = [];
    const earlierList: typeof filteredActivities = [];

    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayMid = todayMid - 24 * 60 * 60 * 1000;

    for (const item of filteredActivities) {
      const itemTime = new Date(item.timestamp).getTime();
      if (itemTime >= todayMid) {
        todayList.push(item);
      } else if (itemTime >= yesterdayMid) {
        yesterdayList.push(item);
      } else {
        earlierList.push(item);
      }
    }
    return { todayList, yesterdayList, earlierList };
  }, [filteredActivities]);

  // -------------------------------------------------------------
  // Tab 4: Comments Tab
  // -------------------------------------------------------------
  const [commentFilter, setCommentFilter] = useState<CommentThreadFilter>('all');
  const [threads, setThreads] = useState<CommentThreadItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  // Use unique key entity_type:entity_id:anchor for thread expansion
  const [expandedThreadKey, setExpandedThreadKey] = useState<string | null>(null);
  const [threadComments, setThreadComments] = useState<Comment[]>([]);
  const [threadCommentsLoading, setThreadCommentsLoading] = useState(false);
  const [threadCommentsError, setThreadCommentsError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);

  const getThreadKey = (thread: CommentThreadItem): string => {
    return `${thread.entity_type}:${thread.entity_id}:${thread.anchor ?? ''}`;
  };

  const fetchThreads = useCallback(async (filter: CommentThreadFilter) => {
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const list = await getCommentThreads(filter);
      setThreads(list);
    } catch (err) {
      setThreadsError(formatApiErrorMessage(err, "Couldn't load comments threads."));
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Comments') {
      queueMicrotask(() => {
        void fetchThreads(commentFilter);
      });
    }
  }, [activeTab, commentFilter, fetchThreads]);

  const loadExpandedThread = useCallback(async (thread: CommentThreadItem) => {
    setThreadCommentsLoading(true);
    setThreadCommentsError(null);
    try {
      const comments = await listComments(
        thread.entity_type as CommentEntityType,
        thread.entity_id,
        thread.anchor ?? undefined
      );
      setThreadComments(comments);
    } catch (err) {
      setThreadCommentsError(formatApiErrorMessage(err, "Couldn't load thread comments."));
    } finally {
      setThreadCommentsLoading(false);
    }
  }, []);

  const toggleThread = (thread: CommentThreadItem) => {
    const key = getThreadKey(thread);
    if (expandedThreadKey === key) {
      setExpandedThreadKey(null);
      setThreadComments([]);
    } else {
      setExpandedThreadKey(key);
      void loadExpandedThread(thread);
    }
  };

  const handlePostReply = async (thread: CommentThreadItem) => {
    const text = replyText.trim();
    if (!text || replyBusy) return;
    setReplyBusy(true);
    try {
      await createComment({
        entityType: thread.entity_type as CommentEntityType,
        entityId: thread.entity_id,
        body: text,
        mentionUserIds: [],
        anchor: thread.anchor ?? undefined,
      });
      setReplyText('');
      await loadExpandedThread(thread);
      void fetchThreads(commentFilter);
      showToast('Reply posted.');
    } catch {
      showToast("Couldn't post reply. Try again.", true);
    } finally {
      setReplyBusy(false);
    }
  };

  const handleToggleResolveComment = async (commentId: string, currentlyResolved: boolean, thread: CommentThreadItem) => {
    try {
      await resolveComment(commentId, !currentlyResolved);
      await loadExpandedThread(thread);
      void fetchThreads(commentFilter);
      showToast(currentlyResolved ? 'Thread reopened.' : 'Thread resolved.');
    } catch {
      showToast("Couldn't update thread status.", true);
    }
  };

  // -------------------------------------------------------------
  // Tab 5: Audit Log Tab (founder only)
  // -------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditCursor, setAuditCursor] = useState<string | null>(null);
  const [auditLoadingMore, setAuditLoadingMore] = useState(false);
  const [exportingAudit, setExportingAudit] = useState(false);

  const fetchAuditLogs = useCallback(async (cursor?: string) => {
    if (cursor) {
      setAuditLoadingMore(true);
    } else {
      setAuditLoading(true);
      setAuditError(null);
    }
    try {
      const res = await getTeamAuditLogs(cursor);
      setAuditLogs((prev) => (cursor ? [...prev, ...res.items] : res.items));
      setAuditCursor(res.next_cursor);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        void refetchMe();
      }
      setAuditError(formatApiErrorMessage(err, "Couldn't load audit log."));
    } finally {
      setAuditLoading(false);
      setAuditLoadingMore(false);
    }
  }, [refetchMe]);

  useEffect(() => {
    if (activeTab === 'Audit log' && isFounder) {
      queueMicrotask(() => {
        void fetchAuditLogs();
      });
    }
  }, [activeTab, isFounder, fetchAuditLogs]);

  const handleExportAudit = async () => {
    setExportingAudit(true);
    try {
      const { blob, filename } = await exportTeamAuditCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Audit log exported.');
    } catch {
      showToast("Couldn't export audit log.", true);
    } finally {
      setExportingAudit(false);
    }
  };

  // Filter tabs for non-founders: Audit log is hidden
  const availableTabs: TeamSubTab[] = isFounder
    ? ['Members', 'Roles', 'Activity', 'Comments', 'Audit log']
    : ['Members', 'Roles', 'Activity', 'Comments'];

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2.5 rounded-modal shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 ${
            toastMessage.isError ? 'bg-danger-800 text-white' : 'bg-brand-900 text-white'
          }`}
        >
          {!toastMessage.isError && <span className="bg-brand-strong text-white rounded-full p-0.5 text-xs">✓</span>}
          {toastMessage.isError && <AlertCircle size={15} className="text-white" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-line px-4 md:px-6 py-3 flex items-center justify-between bg-white w-full">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={openSidebar}
            className="md:hidden w-8 h-8 rounded-card border border-line-stone bg-white text-brand-strong hover:bg-neutral-50 flex items-center justify-center transition-colors shrink-0 shadow-card"
            aria-label="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center space-x-2 text-xs md:text-sm font-medium tracking-tight">
            <span className="text-ink font-semibold">{workspaceName || 'Workspace'}</span>
            <span className="text-ink-subtle">/</span>
            <span className="text-ink font-semibold">Team</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 md:space-x-3">
          <button
            onClick={() => router.push('/notifications')}
            className="relative w-8 h-8 rounded-full border border-line-stone bg-white flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors shadow-card shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-neutral-x66756f" />
          </button>

          {isFounder && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-accent-gold hover:bg-accent-xa38346 text-white px-2.5 md:px-4 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[34px] shrink-0"
            >
              <Plus size={15} />
              <span className="font-medium"> Invite</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <nav role="tablist" aria-label="Team Sections" className="w-full bg-surface-subtle border-b border-line px-4 md:px-6 py-2.5 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={
                isActive
                  ? 'px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors shrink-0'
                  : 'px-3.5 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors shrink-0'
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* ========================================================= */}
        {/* TAB 1: MEMBERS */}
        {/* ========================================================= */}
        {activeTab === 'Members' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Your team</h1>
                <p className="text-xs text-ink-muted mt-1">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('Roles')}
                  className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px]"
                >
                  Manage roles
                </button>
                {isFounder && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-4 py-2 bg-accent-gold hover:bg-accent-xa38346 text-white rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px]"
                  >
                    + Invite someone
                  </button>
                )}
              </div>
            </div>

            {/* Members table / list */}
            {membersLoading && members.length === 0 ? (
              <div className="bg-white border border-line rounded-[24px] p-6 space-y-4 shadow-card">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-neutral-200 rounded" />
                        <div className="h-3 w-40 bg-neutral-100 rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-neutral-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : membersError ? (
              <div className="bg-white border border-line rounded-[24px] p-6 text-center space-y-3 shadow-card">
                <p className="text-sm text-danger-text">{membersError}</p>
                <button
                  onClick={() => void refetchMembersAndInvitations(true)}
                  className="px-3 py-1.5 bg-brand-strong text-white rounded-card text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : (
              <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
                <div className="hidden md:grid grid-cols-12 border-b border-line bg-neutral-xf9f9f6 text-[10px] font-bold text-ink-subtle uppercase tracking-wider px-6 py-3">
                  <div className={isFounder ? 'col-span-5' : 'col-span-8'}>Member</div>
                  <div className="col-span-4">Role</div>
                  {isFounder && <div className="col-span-3 text-right">Last active</div>}
                </div>

                <div className="divide-y divide-line">
                  {members.map((member) => {
                    const isSelf = member.user_id === me?.user?.id;
                    const displayName = member.name?.trim() || member.email;

                    return (
                      <div
                        key={member.user_id}
                        className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-0 md:items-center hover:bg-neutral-xfaf9f5 transition-colors"
                      >
                        {/* Member avatar & details */}
                        <div className={`flex items-center space-x-3 ${isFounder ? 'md:col-span-5' : 'md:col-span-8'}`}>
                          <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(displayName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-ink truncate">{displayName}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-neutral-xe5efea text-brand-strong px-1.5 py-0.2 rounded font-normal">
                                  you
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-muted truncate">{member.email}</p>
                          </div>
                        </div>

                        {/* Role chip */}
                        <div className="md:col-span-4 flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getRoleBadgeClass(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                        </div>

                        {/* Founder Actions & Last Active */}
                        {isFounder && (
                          <div className="md:col-span-3 flex items-center justify-between md:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-line">
                            <span className="text-xs text-ink-muted">
                              {formatRelativeTime(member.last_active_at)}
                            </span>
                            {!isSelf && (
                              <button
                                onClick={() => openManageModal(member)}
                                className="text-xs font-semibold text-accent-gold hover:underline shrink-0"
                              >
                                Manage
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending invitations section (founder only) */}
            {isFounder && (
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Pending invitations</h3>
                {invitationsLoading && invitations.length === 0 ? (
                  <div className="bg-white border border-line rounded-[24px] p-4 text-xs text-ink-subtle animate-pulse">
                    Loading pending invitations...
                  </div>
                ) : invitationsError ? (
                  <div className="bg-white border border-line rounded-[24px] p-6 text-center space-y-3 shadow-card">
                    <p className="text-sm text-danger-text">{invitationsError}</p>
                    <button
                      onClick={() => void fetchInvitations()}
                      className="px-3 py-1.5 bg-brand-strong text-white rounded-card text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="bg-white border border-line rounded-[24px] p-4 text-xs text-ink-subtle">
                    No pending invitations.
                  </div>
                ) : (
                  <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden divide-y divide-line">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 md:px-6 md:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 hover:bg-neutral-xfaf9f5 transition-colors text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-ink">{inv.email}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRoleBadgeClass(inv.role)}`}>
                            {getRoleLabel(inv.role)}
                          </span>
                          <span className="text-[11px] text-accent-bronze font-medium">
                            {inv.expired ? 'invite expired' : 'invite pending'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 self-end md:self-auto">
                          <button
                            type="button"
                            disabled={actionBusyId === inv.id}
                            onClick={() => void handleResendInvite(inv)}
                            className="text-xs font-semibold text-brand-strong hover:underline disabled:opacity-50"
                          >
                            Resend
                          </button>
                          <button
                            type="button"
                            disabled={actionBusyId === inv.id}
                            onClick={() => setRevokeConfirmId(inv)}
                            className="text-xs font-semibold text-danger-bold hover:underline disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Leave workspace button at the bottom for everyone */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setLeaveError(null);
                  setIsLeaveConfirmOpen(true);
                }}
                className="text-xs font-medium text-danger-bold hover:underline"
              >
                Leave workspace
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ROLES */}
        {/* ========================================================= */}
        {activeTab === 'Roles' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1 pt-2">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Roles and permissions</h1>
              <p className="text-xs text-ink-muted">
                Everyone sees only what their work needs. Your journal is invisible to all of them.
              </p>
            </div>

            <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-line bg-neutral-xf9f9f6 text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
                      <th className="py-3 px-4 sticky left-0 bg-neutral-xf9f9f6 z-10 w-48">Module</th>
                      {ROLES_COLUMNS.map((col) => (
                        <th key={col.role} className="py-3 px-3 text-center whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {MODULE_ROWS.map((row) => {
                      const allowedRoles = NAV_ROLES[row.key] ?? [];
                      return (
                        <tr key={row.key} className="hover:bg-neutral-xfaf9f5 transition-colors">
                          <td className="py-3 px-4 font-medium text-ink sticky left-0 bg-white hover:bg-neutral-xfaf9f5 z-10 border-r border-line md:border-r-0">
                            {row.label}
                          </td>
                          {ROLES_COLUMNS.map((col) => {
                            const hasAccess = allowedRoles.includes(col.role);
                            return (
                              <td key={col.role} className="py-3 px-3 text-center">
                                {hasAccess ? (
                                  <span className="text-brand-strong font-bold text-sm" title="Access">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-neutral-xa3ada5 text-xs" title="No access">
                                    ·
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend: Access / No access */}
            <div className="flex items-center space-x-6 text-xs text-ink-muted px-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-brand-strong font-bold text-sm">✓</span>
                <span>Access</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-neutral-xa3ada5 text-sm">·</span>
                <span>No access</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACTIVITY */}
        {/* ========================================================= */}
        {activeTab === 'Activity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Activity</h1>

              <div className="flex items-center space-x-1 bg-neutral-xf4f4f1 p-1 rounded-modal w-fit border border-line">
                {(['All', 'Comments', 'Documents', 'Edits'] as ActivityFilter[]).map((filter) => {
                  const isFilterActive = activityFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      className={
                        isFilterActive
                          ? 'px-3 py-1 rounded-card text-xs font-semibold bg-brand-strong text-white shadow-card transition-colors'
                          : 'px-3 py-1 rounded-card text-xs font-medium text-ink-muted hover:text-ink transition-colors'
                      }
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {activityLoading ? (
              <div className="bg-white border border-line rounded-[24px] p-6 space-y-4 shadow-card">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center space-x-3.5 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-48 bg-neutral-200 rounded" />
                      <div className="h-3 w-32 bg-neutral-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <div className="bg-white border border-line rounded-[24px] p-6 text-center space-y-3 shadow-card">
                <p className="text-sm text-danger-text">{activityError.message}</p>
                <button
                  onClick={() => void activityRefetch()}
                  className="px-3 py-1.5 bg-brand-strong text-white rounded-card text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card space-y-2">
                <p className="text-sm font-semibold text-ink">Nothing yet.</p>
                <p className="text-xs text-ink-muted">Activity from your team shows up here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedActivities.todayList.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Today</h3>
                    <div className="space-y-2.5">
                      {groupedActivities.todayList.map((act) => (
                        <div
                          key={act.id}
                          className="bg-white border border-line rounded-[24px] p-4 flex items-center justify-between shadow-card hover:border-neutral-xd0d0ca transition-all"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(act.actor)}
                            </div>
                            <div className="text-xs truncate">
                              <span className="text-ink-muted">{act.summary}</span>
                              <p className="text-[11px] text-ink-subtle mt-0.5">{act.relativeTime}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedActivities.yesterdayList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Yesterday</h3>
                    <div className="space-y-2.5">
                      {groupedActivities.yesterdayList.map((act) => (
                        <div
                          key={act.id}
                          className="bg-white border border-line rounded-[24px] p-4 flex items-center justify-between shadow-card hover:border-neutral-xd0d0ca transition-all"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(act.actor)}
                            </div>
                            <div className="text-xs truncate">
                              <span className="text-ink-muted">{act.summary}</span>
                              <p className="text-[11px] text-ink-subtle mt-0.5">{act.relativeTime}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedActivities.earlierList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Earlier</h3>
                    <div className="space-y-2.5">
                      {groupedActivities.earlierList.map((act) => (
                        <div
                          key={act.id}
                          className="bg-white border border-line rounded-[24px] p-4 flex items-center justify-between shadow-card hover:border-neutral-xd0d0ca transition-all"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-strong text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(act.actor)}
                            </div>
                            <div className="text-xs truncate">
                              <span className="text-ink-muted">{act.summary}</span>
                              <p className="text-[11px] text-ink-subtle mt-0.5">{act.relativeTime}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activityHasMore && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={activityLoadingMore}
                      onClick={() => void activityFetchMore()}
                      className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                    >
                      {activityLoadingMore ? 'Loading older activity...' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COMMENTS */}
        {/* ========================================================= */}
        {activeTab === 'Comments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Comments and mentions</h1>
              <div className="flex items-center space-x-1 bg-neutral-xf4f4f1 p-1 rounded-modal w-fit border border-line">
                {(['all', 'mentions', 'unresolved'] as CommentThreadFilter[]).map((f) => {
                  const isActive = commentFilter === f;
                  const label = f === 'all' ? 'All' : f === 'mentions' ? 'Mentions' : 'Unresolved';
                  return (
                    <button
                      key={f}
                      onClick={() => setCommentFilter(f)}
                      className={
                        isActive
                          ? 'px-3 py-1 rounded-card text-xs font-semibold bg-brand-strong text-white shadow-card transition-colors'
                          : 'px-3 py-1 rounded-card text-xs font-medium text-ink-muted hover:text-ink transition-colors'
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {threadsLoading ? (
              <div className="bg-white border border-line rounded-[24px] p-6 space-y-4 shadow-card">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="space-y-2 animate-pulse">
                    <div className="h-4 w-40 bg-neutral-200 rounded" />
                    <div className="h-3.5 w-full bg-neutral-100 rounded" />
                  </div>
                ))}
              </div>
            ) : threadsError ? (
              <div className="bg-white border border-line rounded-[24px] p-6 text-center space-y-3 shadow-card">
                <p className="text-sm text-danger-text">{threadsError}</p>
                <button
                  onClick={() => void fetchThreads(commentFilter)}
                  className="px-3 py-1.5 bg-brand-strong text-white rounded-card text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : threads.length === 0 ? (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card space-y-2">
                <p className="text-sm font-semibold text-ink">No threads yet.</p>
                <p className="text-xs text-ink-muted">
                  Comment on a milestone or a canvas and it shows up here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => {
                  const threadKey = getThreadKey(thread);
                  const isExpanded = expandedThreadKey === threadKey;
                  let lastAuthorName = 'A teammate';
                  if (typeof thread.last_comment?.author === 'string' && thread.last_comment.author.trim()) {
                    lastAuthorName = thread.last_comment.author;
                  } else if (typeof thread.last_comment?.author === 'object' && thread.last_comment.author?.name?.trim()) {
                    lastAuthorName = thread.last_comment.author.name;
                  }

                  const countDisplay = typeof thread.comment_count === 'number'
                    ? `${thread.comment_count} ${thread.comment_count === 1 ? 'comment' : 'comments'}`
                    : null;

                  return (
                    <div
                      key={threadKey}
                      className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden transition-all"
                    >
                      {/* Thread summary card */}
                      <button
                        type="button"
                        onClick={() => toggleThread(thread)}
                        className="w-full text-left px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-neutral-xfaf9f5 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-semibold text-xs text-ink">{thread.context}</span>
                            <span className="bg-neutral-xeaefea text-brand-strong font-semibold px-2 py-0.5 rounded-input text-[11px]">
                              {thread.entity_type.replace(/_/g, ' ')}
                            </span>
                            {thread.mentions_me && (
                              <span className="bg-accent-xfdf2e6 text-accent-700 font-semibold px-2 py-0.5 rounded-input text-[11px]">
                                mentions you
                              </span>
                            )}
                            <span className="text-[11px] text-ink-subtle">
                              {thread.unresolved_count > 0 ? `${thread.unresolved_count} open` : 'resolved'}
                            </span>
                            {countDisplay && (
                              <span className="text-[11px] text-ink-muted">
                                · {countDisplay}
                              </span>
                            )}
                          </div>
                          {thread.last_comment?.snippet && (
                            <p className="text-xs text-ink-muted line-clamp-2">
                              {thread.last_comment.snippet}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-[11px] text-ink-subtle">
                            <span>{lastAuthorName}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(thread.last_comment?.created_at)}</span>
                          </div>
                        </div>
                        <div className="self-end md:self-center shrink-0 text-ink-muted">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {/* Expanded Thread View */}
                      {isExpanded && (
                        <div className="border-t border-line bg-surface-subtle p-6 space-y-4">
                          {threadCommentsLoading ? (
                            <div className="space-y-2 animate-pulse">
                              <div className="h-3.5 w-3/4 bg-neutral-200 rounded" />
                              <div className="h-3.5 w-1/2 bg-neutral-100 rounded" />
                            </div>
                          ) : threadCommentsError ? (
                            <div className="text-xs text-danger-text space-y-2">
                              <p>{threadCommentsError}</p>
                              <button
                                onClick={() => void loadExpandedThread(thread)}
                                className="underline font-semibold"
                              >
                                Retry
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                {threadComments.map((c) => {
                                  const authorName = c.author?.name?.trim() || 'A teammate';
                                  const isResolved = Boolean(c.resolved_at);
                                  const canResolve =
                                    isFounder ||
                                    currentRole === 'team_member' ||
                                    c.is_mine;

                                  return (
                                    <div
                                      key={c.id}
                                      className={`p-4 rounded-card border ${
                                        isResolved ? 'bg-surface-muted border-line-soft opacity-80' : 'bg-white border-line'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold text-ink">{authorName}</span>
                                          <span>{formatRelativeTime(c.created_at)}</span>
                                          {isResolved && (
                                            <span className="bg-neutral-xeaefea text-brand-strong px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                              resolved
                                            </span>
                                          )}
                                        </div>
                                        {canResolve && (
                                          <button
                                            type="button"
                                            onClick={() => void handleToggleResolveComment(c.id, isResolved, thread)}
                                            className="flex items-center space-x-1 text-xs font-semibold text-brand-strong hover:underline"
                                          >
                                            {isResolved ? (
                                              <>
                                                <RotateCcw size={12} />
                                                <span>Reopen</span>
                                              </>
                                            ) : (
                                              <>
                                                <Check size={12} />
                                                <span>Resolve</span>
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-xs text-ink whitespace-pre-wrap">{c.body}</p>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Reply Input Box */}
                              <div className="pt-2 flex flex-col md:flex-row gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') void handlePostReply(thread);
                                  }}
                                  className="flex-1 bg-white border border-line rounded-card px-3.5 py-2 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-brand-strong"
                                />
                                <button
                                  type="button"
                                  disabled={replyBusy || !replyText.trim()}
                                  onClick={() => void handlePostReply(thread)}
                                  className="px-4 py-2 bg-brand-strong hover:bg-brand-900 text-white rounded-card text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                                >
                                  {replyBusy ? 'Replying...' : 'Reply'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AUDIT LOG (Founder only) */}
        {/* ========================================================= */}
        {activeTab === 'Audit log' && isFounder && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Audit log</h1>
                <p className="text-xs text-ink-muted">Every sensitive action, immutable and timestamped.</p>
              </div>
              <button
                type="button"
                disabled={exportingAudit || auditLogs.length === 0}
                onClick={() => void handleExportAudit()}
                className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px] w-fit inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{exportingAudit ? 'Exporting...' : 'Export log'}</span>
              </button>
            </div>

            {auditLoading ? (
              <div className="bg-white border border-line rounded-[24px] p-6 space-y-4 shadow-card">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex justify-between items-center animate-pulse">
                    <div className="h-4 w-32 bg-neutral-200 rounded" />
                    <div className="h-4 w-28 bg-neutral-100 rounded" />
                    <div className="h-4 w-40 bg-neutral-100 rounded" />
                    <div className="h-4 w-20 bg-neutral-100 rounded" />
                  </div>
                ))}
              </div>
            ) : auditError ? (
              <div className="bg-white border border-line rounded-[24px] p-6 text-center space-y-3 shadow-card">
                <p className="text-sm text-danger-text">{auditError}</p>
                <button
                  onClick={() => void fetchAuditLogs()}
                  className="px-3 py-1.5 bg-brand-strong text-white rounded-card text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card space-y-2">
                <p className="text-sm font-semibold text-ink">No team activity recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-line bg-neutral-xf9f9f6 text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
                          <th className="py-3.5 px-6">Actor</th>
                          <th className="py-3.5 px-6">Action</th>
                          <th className="py-3.5 px-6">Target</th>
                          <th className="py-3.5 px-6 text-right">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {auditLogs.map((log) => {
                          let actorDisplay = 'Someone';
                          if (typeof log.actor === 'string' && log.actor.trim()) {
                            actorDisplay = log.actor;
                          } else if (typeof log.actor === 'object' && log.actor?.name?.trim()) {
                            actorDisplay = log.actor.name;
                          }
                          const targetDisplay = log.target || 'Someone';
                          const sentence = formatAuditSentence(actorDisplay, log.action, targetDisplay);

                          return (
                            <tr key={log.id} className="hover:bg-neutral-xfaf9f5 transition-colors">
                              <td className="py-4 px-6 font-semibold text-ink whitespace-nowrap">
                                {actorDisplay}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col space-y-0.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold w-fit ${getAuditBadgeClass(log.action)}`}>
                                    {formatActionText(log.action)}
                                  </span>
                                  <span className="text-[11px] text-ink-muted mt-0.5">
                                    {sentence}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-ink-muted">
                                {targetDisplay}
                              </td>
                              <td className="py-4 px-6 text-right text-ink-subtle whitespace-nowrap">
                                {formatAuditTimestamp(log.created_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {auditCursor && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={auditLoadingMore}
                      onClick={() => void fetchAuditLogs(auditCursor)}
                      className="px-4 py-2 bg-white border border-line hover:bg-surface-muted text-ink rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                    >
                      {auditLoadingMore ? 'Loading older entries...' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: INVITE SOMEONE IN (Founder Only) */}
      {/* ========================================================= */}
      {isInviteModalOpen && isFounder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            ref={inviteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
            className="bg-white border border-line rounded-[24px] p-6 md:p-8 shadow-accent max-w-lg w-full space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="invite-modal-title" className="text-lg font-display text-ink">Invite someone in</h2>
                <p className="text-xs text-ink-muted mt-1">
                  They will get an email with a secure link. You can change or revoke their access any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-card text-ink-muted hover:bg-surface-muted"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {inviteErrorText && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-card text-xs text-danger-800">
                {inviteErrorText}
              </div>
            )}

            <form onSubmit={handleSendInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="invite-email-input" className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="invite-email-input"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border border-line rounded-card px-3 py-2.5 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
              </div>

              <div className="space-y-2">
                <span id="invite-role-label" className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider block">
                  Role
                </span>
                <div role="radiogroup" aria-labelledby="invite-role-label" className="space-y-2">
                  {INVITE_ROLE_OPTIONS.map((item) => {
                    const isSelected = inviteRoleChoice === item.value;
                    const radioId = `invite-role-${item.value}`;
                    return (
                      <div
                        key={item.value}
                        onClick={() => setInviteRoleChoice(item.value)}
                        className={`p-3.5 rounded-modal border cursor-pointer flex items-start justify-between transition-all ${
                          isSelected ? 'border-brand-strong bg-neutral-xf4f7f5' : 'border-line bg-white hover:bg-neutral-xfaf9f5'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            id={radioId}
                            type="radio"
                            name="inviteRoleChoice"
                            value={item.value}
                            checked={isSelected}
                            onChange={() => setInviteRoleChoice(item.value)}
                            className="mt-0.5 accent-brand-strong"
                          />
                          <div>
                            <label htmlFor={radioId} className="font-semibold text-xs text-ink cursor-pointer">
                              {item.label}
                            </label>
                            {item.hint && <p className="text-[11px] text-ink-muted mt-0.5">{item.hint}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  disabled={inviteBusy}
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-surface-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteBusy || !inviteEmail.trim()}
                  className="flex-1 px-4 py-2.5 bg-accent-gold hover:bg-accent-xa38346 text-white rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                >
                  {inviteBusy ? 'Sending...' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANAGE MEMBER (Founder Only) */}
      {/* ========================================================= */}
      {managedMember && isFounder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            ref={manageModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-modal-title"
            className="bg-white border border-line rounded-[24px] p-6 md:p-8 shadow-accent max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="manage-modal-title" className="text-lg font-display text-ink">
                  Manage {managedMember.name?.trim() || managedMember.email}
                </h2>
                <p className="text-xs text-ink-muted mt-1">{managedMember.email}</p>
              </div>
              <button
                type="button"
                disabled={manageBusy}
                onClick={() => setManagedMember(null)}
                className="p-1 rounded-card text-ink-muted hover:bg-surface-muted disabled:opacity-50"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {manageError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-card text-xs text-danger-800">
                {manageError}
              </div>
            )}

            {!isRemoveConfirmOpen ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="manage-member-role-select" className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    id="manage-member-role-select"
                    disabled={manageBusy}
                    value={manageRoleInput}
                    onChange={(e) => setManageRoleInput(e.target.value as InviteRole)}
                    className="w-full bg-white border border-line rounded-card px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-strong"
                  >
                    {INVITE_ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === 'founder' ? 'Founder' : opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-line flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      disabled={manageBusy}
                      onClick={() => setManagedMember(null)}
                      className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-surface-muted transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={manageBusy}
                      onClick={() => void handleSaveRole()}
                      className="flex-1 px-4 py-2 bg-brand-strong hover:bg-brand-900 text-white rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                    >
                      {manageBusy ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={manageBusy}
                    onClick={() => setIsRemoveConfirmOpen(true)}
                    className="text-xs font-semibold text-danger-bold hover:underline self-center pt-1 disabled:opacity-50"
                  >
                    Remove from workspace
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-ink leading-relaxed">
                  Remove {managedMember.name?.trim() || managedMember.email}? They lose access immediately. Their past activity stays attributed.
                </p>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    disabled={manageBusy}
                    onClick={() => setIsRemoveConfirmOpen(false)}
                    className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-surface-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={manageBusy}
                    onClick={() => void handleRemoveMember()}
                    className="flex-1 px-4 py-2 bg-danger-bold hover:bg-danger-800 text-white rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
                  >
                    {manageBusy ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVOKE INVITATION CONFIRM */}
      {/* ========================================================= */}
      {revokeConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            ref={revokeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-modal-title"
            className="bg-white border border-line rounded-[24px] p-6 shadow-accent max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200"
          >
            <h3 id="revoke-modal-title" className="text-base font-display text-ink">Revoke invitation?</h3>
            <p className="text-xs text-ink-muted">
              Revoke the invitation for {revokeConfirmId.email}?
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokeConfirmId(null)}
                className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-surface-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRevokeInvite()}
                className="flex-1 px-4 py-2 bg-danger-bold hover:bg-danger-800 text-white rounded-modal text-xs font-semibold shadow-card transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LEAVE WORKSPACE CONFIRM */}
      {/* ========================================================= */}
      {isLeaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            ref={leaveModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="bg-white border border-line rounded-[24px] p-6 shadow-accent max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200"
          >
            <h3 id="leave-modal-title" className="text-base font-display text-ink">Leave workspace?</h3>
            <p className="text-xs text-ink-muted">
              Leave {workspaceName || 'this workspace'}? You lose access immediately.
            </p>

            {leaveError && (
              <div className="p-2.5 bg-danger-50 border border-danger-200 rounded-card text-xs text-danger-800">
                {leaveError}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={leaveBusy}
                onClick={() => setIsLeaveConfirmOpen(false)}
                className="flex-1 px-4 py-2 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={leaveBusy}
                onClick={() => void handleLeaveConfirm()}
                className="flex-1 px-4 py-2 bg-danger-bold hover:bg-danger-800 text-white rounded-modal text-xs font-semibold shadow-card transition-colors disabled:opacity-50"
              >
                {leaveBusy ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
