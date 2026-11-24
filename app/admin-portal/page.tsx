'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import {
  LayoutDashboard,
  Boxes,
  Users,
  Search,
  RotateCcw,
  Shield,
  HelpCircle,
  ChevronRight,
  X,
  CheckCircle2,
  LifeBuoy,
} from 'lucide-react';
import {
  getAdminMe,
  getAdminKpis,
  getAdminWorkspaces,
  getAdminWorkspace,
  getAdminUsers,
  getAdminUser,
  suspendUser,
  unsuspendUser,
  sendUserPasswordReset,
  resendUserVerification,
  hasAdminScope,
  type AdminMeResponse,
  type DashboardKpisResponse,
  type AdminWorkspaceRow,
  type AdminWorkspaceDetail,
  type AdminUserRow,
  type AdminUserDetail,
  ApiError,
} from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { StaffActionDialog } from '@/components/admin/staff-action-dialog';
import { AdminSupportView } from '@/components/admin/admin-support-view';
import { getAdminSupportAttention, type AdminAttentionResponse } from '@/lib/api/admin-tickets';

type AdminTab = 'Dashboard' | 'Workspaces' | 'Users' | 'Support';
type BillingFilter = 'all' | 'active' | 'past_due' | 'trialing';
type ActivityFilter = 'all' | 'active' | 'dormant';
type WorkspaceStageFilter = 'all' | 'idea' | 'validation' | 'mvp' | 'growth' | 'scaling';
type WorkspaceBillingFilter = 'all' | 'active' | 'past_due' | 'trialing' | 'free' | 'canceled';

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '-';
  const diff = Date.now() - new Date(isoString).getTime();
  if (isNaN(diff) || diff < 0) return '-';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export default function AdminPortalPage(): React.JSX.Element | null {
  const router = useRouter();

  // Authentication & Staff Access State
  const [me, setMe] = useState<AdminMeResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isNotStaff, setIsNotStaff] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Cooldown timers (for reset password & resend verification)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const [key, val] of Object.entries(prev)) {
          if (val > 1) {
            next[key] = val - 1;
            changed = true;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Staff Probe on entry
  const checkStaffAccess = useCallback(async () => {
    setAuthLoading(true);
    try {
      const data = await getAdminMe();
      setMe(data);
      setAuthLoading(false);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        // Not staff: redirect to /dashboard immediately with no message
        setIsNotStaff(true);
        router.replace('/dashboard');
        return;
      }
      // If unauthorized or other error, redirect to /dashboard without error copy
      setIsNotStaff(true);
      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => {
      void checkStaffAccess();
    });
  }, [checkStaffAccess]);

  // Handle mid-session 404 revokes
  const handlePotentialRevoke = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 404) {
        setIsNotStaff(true);
        router.replace('/dashboard');
        return true;
      }
      return false;
    },
    [router]
  );

  // ============================================================================
  // TAB 1: Dashboard KPIs State
  // ============================================================================
  const [kpis, setKpis] = useState<DashboardKpisResponse | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState<string | null>(null);

  // Dashboard Attention State
  const [attention, setAttention] = useState<AdminAttentionResponse | null>(null);

  const fetchAttention = useCallback(async () => {
    try {
      const data = await getAdminSupportAttention();
      setAttention(data);
    } catch (err) {
      if (handlePotentialRevoke(err)) return;
      // Fail silently for non-critical attention metric
    }
  }, [handlePotentialRevoke]);

  const fetchKpis = useCallback(async () => {
    setKpisLoading(true);
    setKpisError(null);
    try {
      const data = await getAdminKpis();
      setKpis(data);
    } catch (err) {
      if (handlePotentialRevoke(err)) return;
      setKpisError(formatApiErrorMessage(err, 'Could not load dashboard KPIs.'));
    } finally {
      setKpisLoading(false);
    }
  }, [handlePotentialRevoke]);

  useEffect(() => {
    if (!authLoading && me && activeTab === 'Dashboard') {
      queueMicrotask(() => {
        void fetchKpis();
        void fetchAttention();
      });
    }
  }, [authLoading, me, activeTab, fetchKpis, fetchAttention]);

  // ============================================================================
  // TAB 2: Workspaces State
  // ============================================================================
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceRow[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
  const [workspacesNextCursor, setWorkspacesNextCursor] = useState<string | null>(null);
  const [workspacesLoadingMore, setWorkspacesLoadingMore] = useState(false);

  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [workspaceStageFilter, setWorkspaceStageFilter] = useState<WorkspaceStageFilter>('all');
  const [workspaceBillingFilter, setWorkspaceBillingFilter] = useState<WorkspaceBillingFilter>('all');

  // Workspace Detail Drawer
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceDetail, setWorkspaceDetail] = useState<AdminWorkspaceDetail | null>(null);
  const [workspaceDetailLoading, setWorkspaceDetailLoading] = useState(false);
  const [workspaceDetailError, setWorkspaceDetailError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(
    async (cursor?: string | null, isLoadMore = false) => {
      if (isLoadMore) {
        setWorkspacesLoadingMore(true);
      } else {
        setWorkspacesLoading(true);
        setWorkspacesError(null);
      }

      try {
        const res = await getAdminWorkspaces({
          query: workspaceQuery,
          stage: workspaceStageFilter,
          billing_status: workspaceBillingFilter,
          cursor: cursor ?? undefined,
          limit: 20,
        });

        if (isLoadMore) {
          setWorkspaces((prev) => [...prev, ...res.workspaces]);
        } else {
          setWorkspaces(res.workspaces);
        }
        setWorkspacesNextCursor(res.next_cursor);
      } catch (err) {
        if (handlePotentialRevoke(err)) return;
        setWorkspacesError(formatApiErrorMessage(err, 'Could not load workspaces.'));
      } finally {
        setWorkspacesLoading(false);
        setWorkspacesLoadingMore(false);
      }
    },
    [workspaceQuery, workspaceStageFilter, workspaceBillingFilter, handlePotentialRevoke]
  );

  useEffect(() => {
    if (!authLoading && me && activeTab === 'Workspaces' && hasAdminScope(me, 'support')) {
      queueMicrotask(() => {
        void fetchWorkspaces();
      });
    }
  }, [authLoading, me, activeTab, fetchWorkspaces]);

  const openWorkspaceDetail = useCallback(
    async (id: string) => {
      setSelectedWorkspaceId(id);
      setWorkspaceDetailLoading(true);
      setWorkspaceDetailError(null);
      try {
        const detail = await getAdminWorkspace(id);
        setWorkspaceDetail(detail);
      } catch (err) {
        if (handlePotentialRevoke(err)) return;
        if (err instanceof ApiError && err.status === 404) {
          setWorkspaceDetailError('No such workspace.');
        } else {
          setWorkspaceDetailError(formatApiErrorMessage(err, 'Could not load workspace details.'));
        }
      } finally {
        setWorkspaceDetailLoading(false);
      }
    },
    [handlePotentialRevoke]
  );

  // ============================================================================
  // TAB 3: Users State
  // ============================================================================
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersNextCursor, setUsersNextCursor] = useState<string | null>(null);
  const [usersLoadingMore, setUsersLoadingMore] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [userBillingFilter, setUserBillingFilter] = useState<BillingFilter>('all');
  const [userActivityFilter, setUserActivityFilter] = useState<ActivityFilter>('all');

  // User Profile Drawer & Actions
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // Staff Action Dialog State
  const [actionDialogProps, setActionDialogProps] = useState<{
    isOpen: boolean;
    title: string;
    confirmCopy: string;
    actionButtonLabel: string;
    actionButtonVariant: 'danger' | 'primary';
    onConfirm: (payload: { reason: string; totp_code: string }) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    confirmCopy: '',
    actionButtonLabel: 'Confirm',
    actionButtonVariant: 'danger',
    onConfirm: async () => {},
  });

  const fetchUsers = useCallback(
    async (cursor?: string | null, isLoadMore = false) => {
      if (isLoadMore) {
        setUsersLoadingMore(true);
      } else {
        setUsersLoading(true);
        setUsersError(null);
      }

      try {
        const res = await getAdminUsers({
          query: userQuery,
          billing_status: userBillingFilter,
          activity: userActivityFilter,
          cursor: cursor ?? undefined,
          limit: 20,
        });

        if (isLoadMore) {
          setUsers((prev) => [...prev, ...res.users]);
        } else {
          setUsers(res.users);
        }
        setUsersNextCursor(res.next_cursor);
      } catch (err) {
        if (handlePotentialRevoke(err)) return;
        setUsersError(formatApiErrorMessage(err, 'Could not load users.'));
      } finally {
        setUsersLoading(false);
        setUsersLoadingMore(false);
      }
    },
    [userQuery, userBillingFilter, userActivityFilter, handlePotentialRevoke]
  );

  useEffect(() => {
    if (!authLoading && me && activeTab === 'Users' && hasAdminScope(me, 'support')) {
      queueMicrotask(() => {
        void fetchUsers();
      });
    }
  }, [authLoading, me, activeTab, fetchUsers]);

  const openUserProfile = useCallback(
    async (id: string) => {
      setSelectedUserId(id);
      setUserDetailLoading(true);
      setUserDetailError(null);
      try {
        const detail = await getAdminUser(id);
        setUserDetail(detail);
      } catch (err) {
        if (handlePotentialRevoke(err)) return;
        if (err instanceof ApiError && err.status === 404) {
          setUserDetailError('No such user.');
        } else {
          setUserDetailError(formatApiErrorMessage(err, 'Could not load user profile.'));
        }
      } finally {
        setUserDetailLoading(false);
      }
    },
    [handlePotentialRevoke]
  );

  // Trigger Suspend Action
  const triggerSuspend = (user: AdminUserDetail) => {
    setActionDialogProps({
      isOpen: true,
      title: 'Suspend User',
      confirmCopy: `Suspend ${user.email}? They're signed out everywhere immediately.`,
      actionButtonLabel: 'Suspend',
      actionButtonVariant: 'danger',
      onConfirm: async (payload) => {
        await suspendUser(user.id, payload);
        showToast(`${user.email} is suspended.`);
        await openUserProfile(user.id);
        void fetchUsers();
      },
    });
  };

  // Trigger Unsuspend Action
  const triggerUnsuspend = (user: AdminUserDetail) => {
    setActionDialogProps({
      isOpen: true,
      title: 'Restore User Access',
      confirmCopy: `Restore access for ${user.email}?`,
      actionButtonLabel: 'Restore Access',
      actionButtonVariant: 'primary',
      onConfirm: async (payload) => {
        await unsuspendUser(user.id, payload);
        showToast(`${user.email} can sign in again.`);
        await openUserProfile(user.id);
        void fetchUsers();
      },
    });
  };

  // Trigger Password Reset Action
  const triggerPasswordReset = (user: AdminUserDetail) => {
    setActionDialogProps({
      isOpen: true,
      title: 'Send Password Reset',
      confirmCopy: `Email ${user.email} a password reset link?`,
      actionButtonLabel: 'Send Link',
      actionButtonVariant: 'primary',
      onConfirm: async (payload) => {
        await sendUserPasswordReset(user.id, payload);
        showToast('Reset email sent.');
        setCooldowns((prev) => ({ ...prev, [`reset_${user.id}`]: 60 }));
        await openUserProfile(user.id);
      },
    });
  };

  // Trigger Resend Verification Action
  const triggerResendVerification = (user: AdminUserDetail) => {
    setActionDialogProps({
      isOpen: true,
      title: 'Resend Verification Email',
      confirmCopy: `Resend the verification email to ${user.email}?`,
      actionButtonLabel: 'Resend Email',
      actionButtonVariant: 'primary',
      onConfirm: async (payload) => {
        await resendUserVerification(user.id, payload);
        showToast('Verification email sent.');
        setCooldowns((prev) => ({ ...prev, [`verify_${user.id}`]: 60 }));
        await openUserProfile(user.id);
      },
    });
  };

  // If not staff or currently redirecting, render plain 404 with no message
  if (isNotStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface text-center font-body">
        <h1 className="text-4xl font-bold text-main tracking-tight">404</h1>
        <p className="mt-2 text-sm text-subtle">This page could not be found.</p>
      </div>
    );
  }

  // Loading staff access verification
  if (authLoading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface font-body">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-xs text-subtle font-medium">Verifying console access...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = me.role === 'super_admin';
  const hasSupportScope = hasAdminScope(me, 'support');

  return (
    <div className="min-h-screen bg-surface-raised flex flex-col font-body text-main">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-surface border border-brand/30 shadow-raised rounded-card flex items-center gap-2.5 text-sm font-medium text-main animate-in slide-in-from-bottom-3"
        >
          <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Console Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-neutral-subtle px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo />
            <div className="h-5 w-px bg-neutral-subtle" />
            <span className="text-sm font-bold tracking-tight text-main">Admin Portal</span>
          </div>
        </div>

        {/* Top-Right Staff Badges (Not Clickable) */}
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-pill bg-brand-subtle text-brand border border-brand/20 select-none">
              <Shield className="w-3.5 h-3.5" />
              Super admin
            </span>
          ) : (
            <div className="flex items-center gap-1.5 select-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-pill bg-surface-raised border border-neutral-subtle text-main">
                <Shield className="w-3.5 h-3.5 text-brand" />
                Admin
              </span>
              {me.scopes && me.scopes.length > 0 ? (
                me.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-pill bg-brand/10 text-brand capitalize"
                  >
                    {scope}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted">No scopes</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body with Sidebar + Tab Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 gap-6">
        {/* Navigation Sidebar */}
        <nav
          aria-label="Admin Navigation"
          className="w-full md:w-56 flex-shrink-0 bg-surface border border-neutral-subtle rounded-card p-2.5 h-fit space-y-1"
        >
          {/* Dashboard Tab (Always visible) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'Dashboard'}
            onClick={() => setActiveTab('Dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-input transition-colors text-left ${
              activeTab === 'Dashboard'
                ? 'bg-brand text-white shadow-card'
                : 'text-subtle hover:text-main hover:bg-surface-raised'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Workspaces Tab (Needs support scope or super_admin) */}
          {hasSupportScope && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'Workspaces'}
              onClick={() => setActiveTab('Workspaces')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-input transition-colors text-left ${
                activeTab === 'Workspaces'
                  ? 'bg-brand text-white shadow-card'
                : 'text-subtle hover:text-main hover:bg-surface-raised'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Workspaces</span>
            </button>
          )}

          {/* Users Tab (Needs support scope or super_admin) */}
          {hasSupportScope && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'Users'}
              onClick={() => setActiveTab('Users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-input transition-colors text-left ${
                activeTab === 'Users'
                  ? 'bg-brand text-white shadow-card'
                : 'text-subtle hover:text-main hover:bg-surface-raised'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>
          )}

          {/* Support Tab (Needs support scope or super_admin) */}
          {hasSupportScope && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'Support'}
              onClick={() => setActiveTab('Support')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-input transition-colors text-left ${
                activeTab === 'Support'
                  ? 'bg-brand text-white shadow-card'
                : 'text-subtle hover:text-main hover:bg-surface-raised'
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Support</span>
            </button>
          )}
        </nav>

        {/* Content Pane */}
        <main className="flex-1 min-w-0">
          {/* ================================================================ */}
          {/* TAB 1: DASHBOARD                                                 */}
          {/* ================================================================ */}
          {activeTab === 'Dashboard' && (
            <section className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-main tracking-tight">Platform Overview</h1>
                  <p className="text-xs text-subtle mt-0.5">High-level platform activity and startup telemetry.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchKpis()}
                  disabled={kpisLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-subtle hover:text-main bg-surface border border-neutral-subtle rounded-input hover:bg-surface-raised transition-colors"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${kpisLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Error State */}
              {kpisError && (
                <div className="p-4 bg-danger-subtle/30 border border-danger-subtle rounded-card flex items-center justify-between text-xs text-danger-strong">
                  <span>{kpisError}</span>
                  <button
                    type="button"
                    onClick={() => void fetchKpis()}
                    className="font-semibold underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Needs Attention Card */}
              {attention?.tickets && (attention.tickets.open > 0 || attention.tickets.breached > 0) && (
                <div className="bg-surface border border-neutral-subtle p-4 rounded-card shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-modal bg-brand-subtle text-brand flex items-center justify-center shrink-0">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-main">Needs attention</h4>
                      <p className="text-xs text-subtle">
                        <span className="font-semibold text-main">{attention.tickets.open}</span> support {attention.tickets.open === 1 ? 'ticket' : 'tickets'} open
                        {attention.tickets.breached > 0 && (
                          <span className="text-danger-strong font-semibold ml-1.5">
                            ({attention.tickets.breached} overdue)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {hasSupportScope && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('Support')}
                      className="px-3.5 py-1.5 bg-brand text-white rounded-input text-xs font-semibold hover:bg-brand-hover shadow-card transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
                    >
                      <span>View Support</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Workspaces */}
                <div className="bg-surface border border-neutral-subtle p-4 rounded-card flex flex-col justify-between relative group shadow-card">
                  <div className="flex items-center justify-between text-xs font-medium text-subtle">
                    <span>Total workspaces</span>
                    <span
                      title="Total registered startups across the platform."
                      className="cursor-help text-muted hover:text-subtle"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="mt-2">
                    {kpisLoading ? (
                      <div className="h-8 w-24 bg-neutral-subtle/50 animate-pulse rounded-[4px]" />
                    ) : (
                      <div className="text-2xl font-bold text-main tracking-tight tabular-nums">
                        {kpis?.total_workspaces?.value != null
                          ? kpis.total_workspaces.value.toLocaleString()
                          : '-'}
                      </div>
                    )}
                    <div className="text-xs text-subtle mt-1 tabular-nums">
                      {kpis?.total_workspaces?.new_in_window != null
                        ? `+${kpis.total_workspaces.new_in_window} in 30 days`
                        : '-'}
                    </div>
                  </div>
                </div>

                {/* 2. Activation Rate */}
                <div className="bg-surface border border-neutral-subtle p-4 rounded-card flex flex-col justify-between relative group shadow-card">
                  <div className="flex items-center justify-between text-xs font-medium text-subtle">
                    <span>Activation rate</span>
                    <span
                      title="Percentage of startups that have completed core onboarding steps."
                      className="cursor-help text-muted hover:text-subtle"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="mt-2">
                    {kpisLoading ? (
                      <div className="h-8 w-24 bg-neutral-subtle/50 animate-pulse rounded-[4px]" />
                    ) : (
                      <div className="text-2xl font-bold text-main tracking-tight tabular-nums">
                        {kpis?.activation_rate?.percent != null ? `${kpis.activation_rate.percent}%` : '-'}
                      </div>
                    )}
                    <div className="text-xs text-subtle mt-1 tabular-nums">
                      {kpis?.activation_rate?.previous_percent != null ? (
                        (() => {
                          const delta = kpis.activation_rate.percent - kpis.activation_rate.previous_percent;
                          const sign = delta >= 0 ? '+' : '';
                          return `${sign}${delta.toFixed(1)} pts from prior period`;
                        })()
                      ) : (
                        <span>No delta available</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Paid Conversion */}
                <div className="bg-surface border border-neutral-subtle p-4 rounded-card flex flex-col justify-between relative group shadow-card">
                  <div className="flex items-center justify-between text-xs font-medium text-subtle">
                    <span>Paid conversion</span>
                    <span
                      title="Percentage of total workspaces subscribed to paid plan tiers."
                      className="cursor-help text-muted hover:text-subtle"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="mt-2">
                    {kpisLoading ? (
                      <div className="h-8 w-24 bg-neutral-subtle/50 animate-pulse rounded-[4px]" />
                    ) : (
                      <div className="text-2xl font-bold text-main tracking-tight tabular-nums">
                        {kpis?.paid_conversion?.percent != null ? `${kpis.paid_conversion.percent}%` : '-'}
                      </div>
                    )}
                    <div className="text-xs text-muted mt-1">Conversion baseline</div>
                  </div>
                </div>

                {/* 4. MRR */}
                <div className="bg-surface border border-neutral-subtle p-4 rounded-card flex flex-col justify-between relative group shadow-card">
                  <div className="flex items-center justify-between text-xs font-medium text-subtle">
                    <span>MRR</span>
                    <span
                      title="Monthly Recurring Revenue from active startup subscriptions."
                      className="cursor-help text-muted hover:text-subtle"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="mt-2">
                    {kpisLoading ? (
                      <div className="h-8 w-24 bg-neutral-subtle/50 animate-pulse rounded-[4px]" />
                    ) : (
                      <div className="text-2xl font-bold text-main tracking-tight tabular-nums">
                        {kpis?.mrr?.minor != null
                          ? `₦${(kpis.mrr.minor / 100).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}`
                          : '-'}
                      </div>
                    )}
                    <div className="text-xs text-muted mt-1">Paystack billings</div>
                  </div>
                </div>
              </div>

              {/* Chart: Signups and Activations (Last 30 Days) */}
              <div className="bg-surface border border-neutral-subtle p-5 rounded-card shadow-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-neutral-subtle">
                  <div>
                    <h2 className="text-sm font-semibold text-main">Signups and activations</h2>
                    <p className="text-xs text-subtle">Daily signup registrations versus activations over the last 30 days.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-brand rounded-[2px]" />
                      <span className="text-subtle">Signups</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-success-500 rounded-[2px]" />
                      <span className="text-subtle">Activations</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {kpisLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="h-48 w-full bg-neutral-subtle/30 animate-pulse rounded-[4px]" />
                    </div>
                  ) : !kpis?.signups_series || kpis.signups_series.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-xs text-muted">
                      <span>No series telemetry available for the last 30 days.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Responsive SVG/HTML Bar Chart */}
                      <div className="h-56 w-full flex items-end gap-1.5 md:gap-2 px-1 pt-4 pb-2 border-b border-neutral-subtle overflow-x-auto">
                        {(() => {
                          const series = kpis.signups_series;
                          const maxVal = Math.max(
                            ...series.map((s) => Math.max(s.signups || 0, s.activations || 0)),
                            10
                          );

                          return series.map((item, idx) => {
                            const signupHeight = Math.round(((item.signups || 0) / maxVal) * 100);
                            const actHeight = Math.round(((item.activations || 0) / maxVal) * 100);

                            return (
                              <div
                                key={item.date || idx}
                                className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative"
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-neutral-900 text-white text-[10px] p-2 rounded-input shadow-raised z-20 whitespace-nowrap pointer-events-none">
                                  <span className="font-bold">{item.date}</span>
                                  <span>Signups: {item.signups}</span>
                                  <span>Activations: {item.activations}</span>
                                </div>

                                {/* Bars */}
                                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                  <div
                                    style={{ height: `${signupHeight}%` }}
                                    className="w-1/2 bg-brand rounded-t-[2px] transition-all hover:opacity-80"
                                  />
                                  <div
                                    style={{ height: `${actHeight}%` }}
                                    className="w-1/2 bg-success-500 rounded-t-[2px] transition-all hover:opacity-80"
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted tabular-nums font-body px-2">
                        <span>{kpis.signups_series[0]?.date}</span>
                        <span>{kpis.signups_series[Math.floor(kpis.signups_series.length / 2)]?.date}</span>
                        <span>{kpis.signups_series[kpis.signups_series.length - 1]?.date}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 2: WORKSPACES (Read-Only)                                     */}
          {/* ================================================================ */}
          {activeTab === 'Workspaces' && (
            <section className="space-y-4">
              {!hasSupportScope ? (
                <div className="p-8 bg-surface border border-neutral-subtle rounded-card text-center">
                  <p className="text-sm font-medium text-main">You don&apos;t have access to this section.</p>
                </div>
              ) : (
                <>
                  {/* Search and Filters Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-main tracking-tight">Workspaces</h1>
                      <p className="text-xs text-subtle mt-0.5">Read-only inventory of startups and organizations.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search box */}
                      <div className="relative min-w-[200px] flex-1 md:w-64">
                        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={workspaceQuery}
                          onChange={(e) => setWorkspaceQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void fetchWorkspaces();
                          }}
                          placeholder="Search workspace..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted"
                        />
                      </div>

                      {/* Stage Filter */}
                      <select
                        value={workspaceStageFilter}
                        onChange={(e) => {
                          setWorkspaceStageFilter(e.target.value as WorkspaceStageFilter);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
                      >
                        <option value="all">All stages</option>
                        <option value="idea">Idea</option>
                        <option value="validation">Validation</option>
                        <option value="mvp">MVP</option>
                        <option value="growth">Growth</option>
                        <option value="scaling">Scaling</option>
                      </select>

                      {/* Billing Filter */}
                      <select
                        value={workspaceBillingFilter}
                        onChange={(e) => {
                          setWorkspaceBillingFilter(e.target.value as WorkspaceBillingFilter);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
                      >
                        <option value="all">All billing</option>
                        <option value="active">Active</option>
                        <option value="past_due">Past due</option>
                        <option value="trialing">Trialing</option>
                        <option value="free">Free</option>
                        <option value="canceled">Canceled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => void fetchWorkspaces()}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded-input transition-colors"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Error State */}
                  {workspacesError && (
                    <div className="p-3 bg-danger-subtle/30 border border-danger-subtle rounded-card flex items-center justify-between text-xs text-danger-strong">
                      <span>{workspacesError}</span>
                      <button
                        type="button"
                        onClick={() => void fetchWorkspaces()}
                        className="font-semibold underline hover:no-underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Workspaces Table */}
                  <div className="bg-surface border border-neutral-subtle rounded-card overflow-hidden shadow-card">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-subtle bg-surface-raised/60 text-subtle font-semibold">
                            <th className="py-3 px-4">Workspace + owner</th>
                            <th className="py-3 px-4">Stage</th>
                            <th className="py-3 px-4">Seats</th>
                            <th className="py-3 px-4">Plan</th>
                            <th className="py-3 px-4">Health</th>
                            <th className="py-3 px-4">Last active</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-subtle">
                          {workspacesLoading ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-muted">
                                <div className="inline-block w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin mb-2" />
                                <p>Loading workspaces...</p>
                              </td>
                            </tr>
                          ) : workspaces.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-muted">
                                Nothing matches that search.
                              </td>
                            </tr>
                          ) : (
                            workspaces.map((ws) => (
                              <tr
                                key={ws.id}
                                onClick={() => void openWorkspaceDetail(ws.id)}
                                className="hover:bg-surface-raised cursor-pointer transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-main">{ws.name}</div>
                                  <div className="text-[11px] text-muted">
                                    {ws.owner?.name ? `${ws.owner.name} (${ws.owner.email})` : ws.owner?.email || '-'}
                                  </div>
                                </td>
                                <td className="py-3 px-4 capitalize">{ws.stage ?? '-'}</td>
                                <td className="py-3 px-4 tabular-nums font-medium">{ws.seats != null ? ws.seats : '-'}</td>
                                <td className="py-3 px-4">
                                  {ws.plan ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-neutral-subtle/50 text-main capitalize">
                                      {ws.plan}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {ws.health_score != null ? (
                                    <span
                                      className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                                        ws.health_score >= 80
                                          ? 'text-success-700'
                                          : ws.health_score >= 50
                                          ? 'text-warning-700'
                                          : 'text-danger-700'
                                      }`}
                                    >
                                      {ws.health_score}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="py-3 px-4 text-muted">{formatRelativeTime(ws.last_active_at)}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className="text-brand hover:underline font-medium inline-flex items-center gap-0.5">
                                    View <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Load More */}
                    {workspacesNextCursor && (
                      <div className="p-3 border-t border-neutral-subtle text-center bg-surface-raised/30">
                        <button
                          type="button"
                          onClick={() => void fetchWorkspaces(workspacesNextCursor, true)}
                          disabled={workspacesLoadingMore}
                          className="px-4 py-1.5 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
                        >
                          {workspacesLoadingMore ? 'Loading more...' : 'Load more workspaces'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 3: USERS                                                      */}
          {/* ================================================================ */}
          {activeTab === 'Users' && (
            <section className="space-y-4">
              {!hasSupportScope ? (
                <div className="p-8 bg-surface border border-neutral-subtle rounded-card text-center">
                  <p className="text-sm font-medium text-main">You don&apos;t have access to this section.</p>
                </div>
              ) : (
                <>
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-main tracking-tight">Users</h1>
                      <p className="text-xs text-subtle mt-0.5">Platform user registry and security management.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search box */}
                      <div className="relative min-w-[200px] flex-1 md:w-64">
                        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={userQuery}
                          onChange={(e) => setUserQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void fetchUsers();
                          }}
                          placeholder="Search users by name or email..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted"
                        />
                      </div>

                      {/* Activity Filter */}
                      <select
                        value={userActivityFilter}
                        onChange={(e) => {
                          setUserActivityFilter(e.target.value as ActivityFilter);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
                      >
                        <option value="all">All activity</option>
                        <option value="active">Active</option>
                        <option value="dormant">Dormant</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => void fetchUsers()}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded-input transition-colors"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Filter Chips (Billing Status) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(['all', 'active', 'past_due', 'trialing'] as BillingFilter[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setUserBillingFilter(tab);
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-pill capitalize transition-colors ${
                          userBillingFilter === tab
                            ? 'bg-brand text-white shadow-card'
                            : 'bg-surface border border-neutral-subtle text-subtle hover:text-main'
                        }`}
                      >
                        {tab === 'all' ? 'All billing' : tab.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Error State */}
                  {usersError && (
                    <div className="p-3 bg-danger-subtle/30 border border-danger-subtle rounded-card flex items-center justify-between text-xs text-danger-strong">
                      <span>{usersError}</span>
                      <button
                        type="button"
                        onClick={() => void fetchUsers()}
                        className="font-semibold underline hover:no-underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Users Table */}
                  <div className="bg-surface border border-neutral-subtle rounded-card overflow-hidden shadow-card">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-subtle bg-surface-raised/60 text-subtle font-semibold">
                            <th className="py-3 px-4">Name + email</th>
                            <th className="py-3 px-4">Workspace</th>
                            <th className="py-3 px-4">Plan</th>
                            <th className="py-3 px-4">Billing</th>
                            <th className="py-3 px-4">Activity</th>
                            <th className="py-3 px-4">Account</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-subtle">
                          {usersLoading ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-muted">
                                <div className="inline-block w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin mb-2" />
                                <p>Loading users...</p>
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-muted">
                                Nothing matches that search.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => {
                              const isSuspended = u.status === 'disabled';
                              return (
                                <tr key={u.id} className="hover:bg-surface-raised transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-main">{u.full_name || u.email}</div>
                                    <div className="text-[11px] text-muted">{u.email}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {u.primary_workspace ? (
                                      <span className="font-medium text-main">
                                        {u.primary_workspace.name}
                                        {u.workspace_count > 1 && (
                                          <span className="text-[10px] text-muted ml-1 tabular-nums">
                                            +{u.workspace_count - 1}
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="py-3 px-4 capitalize">
                                    {u.primary_workspace?.plan || '-'}
                                  </td>
                                  <td className="py-3 px-4 capitalize">
                                    {u.primary_workspace?.billing_status ? (
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold ${
                                          u.primary_workspace.billing_status === 'active'
                                            ? 'bg-success-50 text-success-700 border border-success-100'
                                            : u.primary_workspace.billing_status === 'past_due'
                                            ? 'bg-danger-50 text-danger-700 border border-danger-200'
                                            : 'bg-warning-50 text-warning-700 border border-warning-100'
                                        }`}
                                      >
                                        {u.primary_workspace.billing_status.replace('_', ' ')}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="py-3 px-4 capitalize">
                                    {u.activity ? (
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold ${
                                          u.activity === 'active'
                                            ? 'bg-success-50 text-success-700'
                                            : 'bg-neutral-subtle/60 text-muted'
                                        }`}
                                      >
                                        {u.activity}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isSuspended ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-danger-100 text-danger-800 border border-danger-200">
                                        Suspended
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-2 py-0.5 rounded-pill text-[10px] font-medium bg-neutral-subtle/50 text-main capitalize">
                                        {u.status}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => void openUserProfile(u.id)}
                                      className="px-2.5 py-1 text-xs font-semibold text-brand hover:underline"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Load More */}
                    {usersNextCursor && (
                      <div className="p-3 border-t border-neutral-subtle text-center bg-surface-raised/30">
                        <button
                          type="button"
                          onClick={() => void fetchUsers(usersNextCursor, true)}
                          disabled={usersLoadingMore}
                          className="px-4 py-1.5 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
                        >
                          {usersLoadingMore ? 'Loading more...' : 'Load more users'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 4: SUPPORT TICKETS                                           */}
          {/* ================================================================ */}
          {activeTab === 'Support' && (
            <section className="space-y-4">
              {!hasSupportScope ? (
                <div className="p-8 bg-surface border border-neutral-subtle rounded-card text-center">
                  <p className="text-sm font-medium text-main">You don&apos;t have access to this section.</p>
                </div>
              ) : me ? (
                <AdminSupportView adminMe={me} />
              ) : null}
            </section>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: WORKSPACE DETAIL                                            */}
      {/* ==================================================================== */}
      {selectedWorkspaceId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => {
            setSelectedWorkspaceId(null);
            setWorkspaceDetail(null);
          }}
        >
          <div
            className="w-full max-w-2xl bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden max-h-[90vh] flex flex-col font-body"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-subtle bg-surface-raised flex items-center justify-between">
              <div>
                <h2 id="workspace-detail-title" className="text-base font-bold text-main">
                  {workspaceDetail?.name || 'Workspace Detail'}
                </h2>
                <p className="text-xs text-subtle">Read-only view of workspace configuration and metrics.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedWorkspaceId(null);
                  setWorkspaceDetail(null);
                }}
                className="p-1 rounded-[6px] text-subtle hover:text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {workspaceDetailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
                  <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                  <p className="text-xs">Loading workspace details...</p>
                </div>
              ) : workspaceDetailError ? (
                <div className="p-4 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-sm rounded-input">
                  {workspaceDetailError}
                </div>
              ) : workspaceDetail ? (
                <>
                  {/* Meta stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface-raised rounded-card border border-neutral-subtle text-xs">
                    <div>
                      <span className="text-muted block">Owner</span>
                      <span className="font-semibold text-main truncate block">
                        {workspaceDetail.owner?.name || workspaceDetail.owner?.email || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Stage</span>
                      <span className="font-semibold text-main capitalize block">
                        {workspaceDetail.stage ?? '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Seats (Paid)</span>
                      <span className="font-semibold text-main block tabular-nums">
                        {workspaceDetail.seats} /{' '}
                        {workspaceDetail.seats_limit == null ? 'Unlimited' : workspaceDetail.seats_limit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Health Score</span>
                      <span className="font-semibold text-main block tabular-nums">
                        {workspaceDetail.health_score ?? '-'}
                      </span>
                    </div>
                  </div>

                  {/* Subscription section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">Subscription</h3>
                    {workspaceDetail.subscription ? (
                      <div className="p-3.5 bg-surface-raised rounded-input border border-neutral-subtle text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-subtle">Plan tier:</span>
                          <span className="font-semibold text-main capitalize">
                            {workspaceDetail.subscription.plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle">Billing status:</span>
                          <span className="font-semibold text-main capitalize">
                            {workspaceDetail.subscription.billing_status}
                          </span>
                        </div>
                        {workspaceDetail.subscription.renews_at && (
                          <div className="flex justify-between">
                            <span className="text-subtle">Renews on:</span>
                            <span className="text-main tabular-nums">
                              {formatDate(workspaceDetail.subscription.renews_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">No active subscription found.</p>
                    )}
                  </div>

                  {/* Members section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                      Members ({workspaceDetail.members?.length || 0})
                    </h3>
                    <div className="border border-neutral-subtle rounded-card overflow-hidden divide-y divide-neutral-subtle text-xs">
                      {workspaceDetail.members && workspaceDetail.members.length > 0 ? (
                        workspaceDetail.members.map((m) => (
                          <div key={m.id || m.user_id} className="p-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-main">{m.name || m.email}</div>
                              <div className="text-[11px] text-muted">{m.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-neutral-subtle/50 text-[10px] rounded-pill capitalize">
                                {m.role}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWorkspaceId(null);
                                  setActiveTab('Users');
                                  void openUserProfile(m.user_id);
                                }}
                                className="text-brand hover:underline text-[11px]"
                              >
                                View user
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted">No members listed.</div>
                      )}
                    </div>
                  </div>

                  {/* Connected Integrations section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                      Connected Integrations
                    </h3>
                    <div className="p-3.5 bg-surface-raised rounded-card border border-neutral-subtle text-xs">
                      {workspaceDetail.integrations && workspaceDetail.integrations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {workspaceDetail.integrations.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-neutral-subtle rounded-[6px] text-main font-medium capitalize"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
                              {item.provider} ({item.status})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">None connected</span>
                      )}
                    </div>
                  </div>

                  {/* Usage Meters */}
                  {workspaceDetail.usage_meters && Object.keys(workspaceDetail.usage_meters).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">Usage Meters</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(workspaceDetail.usage_meters).map(([k, meter]) => (
                          <div
                            key={k}
                            className="p-3 bg-surface-raised border border-neutral-subtle rounded-input text-xs"
                          >
                            <span className="text-subtle capitalize block">{k.replace('_', ' ')}</span>
                            <span className="font-bold text-main mt-1 block tabular-nums">
                              {meter.used} / {meter.limit == null ? 'Unlimited' : meter.limit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: USER PROFILE & ACTIONS                                      */}
      {/* ==================================================================== */}
      {selectedUserId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => {
            setSelectedUserId(null);
            setUserDetail(null);
          }}
        >
          <div
            className="w-full max-w-2xl bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden max-h-[90vh] flex flex-col font-body"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-subtle bg-surface-raised flex items-center justify-between">
              <div>
                <h2 id="user-profile-title" className="text-base font-bold text-main">
                  User Profile
                </h2>
                <p className="text-xs text-subtle">Account credentials, session telemetry, and staff actions.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetail(null);
                }}
                className="p-1 rounded-[6px] text-subtle hover:text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {userDetailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
                  <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                  <p className="text-xs">Loading user profile...</p>
                </div>
              ) : userDetailError ? (
                <div className="p-4 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-sm rounded-input">
                  {userDetailError}
                </div>
              ) : userDetail ? (
                <>
                  {/* Account overview card */}
                  <div className="p-4 bg-surface-raised rounded-card border border-neutral-subtle space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-bold text-main">
                          {userDetail.full_name || userDetail.email}
                        </div>
                        <div className="text-xs text-subtle">{userDetail.email}</div>
                      </div>
                      <div>
                        {userDetail.status === 'disabled' ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-pill bg-danger-100 text-danger-800 border border-danger-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-pill bg-success-100 text-success-800 capitalize">
                            {userDetail.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-neutral-subtle text-xs">
                      <div>
                        <span className="text-muted block">Phone</span>
                        <span className="text-main font-medium">
                          {userDetail.phone != null
                            ? userDetail.phone
                            : userDetail.is_staff
                            ? 'Hidden for staff accounts'
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block">Joined</span>
                        <span className="text-main font-medium tabular-nums">{formatDate(userDetail.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Last active</span>
                        <span className="text-main font-medium tabular-nums">
                          {formatRelativeTime(userDetail.last_active_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Actions Bar */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">Actions</h3>
                    <div className="p-4 bg-surface border border-neutral-subtle rounded-card flex flex-wrap gap-2.5">
                      {/* Suspend */}
                      <button
                        type="button"
                        disabled={!userDetail.can?.suspend}
                        onClick={() => triggerSuspend(userDetail)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-input bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Suspend user
                      </button>

                      {/* Unsuspend */}
                      <button
                        type="button"
                        disabled={!userDetail.can?.unsuspend}
                        onClick={() => triggerUnsuspend(userDetail)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-input bg-success-500/10 text-success-700 hover:bg-success-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Unsuspend
                      </button>

                      {/* Password reset */}
                      {(() => {
                        const cd = cooldowns[`reset_${userDetail.id}`];
                        const isDisabled = !userDetail.can?.reset_password || (cd != null && cd > 0);
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => triggerPasswordReset(userDetail)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-input bg-brand/10 text-brand hover:bg-brand/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {cd ? `Reset password (${cd}s)` : 'Send password reset'}
                          </button>
                        );
                      })()}

                      {/* Resend verification */}
                      {(() => {
                        const cd = cooldowns[`verify_${userDetail.id}`];
                        const isDisabled = !userDetail.can?.resend_verification || (cd != null && cd > 0);
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => triggerResendVerification(userDetail)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-input bg-surface-raised border border-neutral-subtle text-main hover:bg-neutral-subtle/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {cd ? `Resend email (${cd}s)` : 'Resend verification'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Workspaces Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                      Workspaces ({userDetail.workspaces?.length || 0})
                    </h3>
                    <div className="border border-neutral-subtle rounded-card divide-y divide-neutral-subtle text-xs">
                      {userDetail.workspaces && userDetail.workspaces.length > 0 ? (
                        userDetail.workspaces.map((w) => (
                          <div key={w.id} className="p-3 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-main">{w.name}</div>
                              <div className="text-[11px] text-muted">Role: {w.role}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-pill text-[10px] bg-neutral-subtle/50 capitalize">
                                {w.plan || 'Free'}
                              </span>
                              <span className="px-2 py-0.5 rounded-pill text-[10px] bg-brand/10 text-brand capitalize">
                                {w.billing_status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted">No workspaces joined.</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Sessions */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">Recent Sessions</h3>
                    <div className="border border-neutral-subtle rounded-card divide-y divide-neutral-subtle text-xs">
                      {userDetail.is_staff && (!userDetail.sessions || userDetail.sessions.length === 0) ? (
                        <div className="p-4 text-center text-muted italic">
                          Hidden for staff accounts
                        </div>
                      ) : userDetail.sessions && userDetail.sessions.length > 0 ? (
                        userDetail.sessions.map((s) => (
                          <div key={s.id} className="p-3 flex items-center justify-between">
                            <div>
                              <div className="tabular-nums text-main">{s.ip_address || 'Unknown IP'}</div>
                              <div className="text-[11px] text-muted truncate max-w-xs">{s.user_agent || '-'}</div>
                            </div>
                            <div className="text-right text-[11px] text-muted">
                              <div>Signed in: {formatRelativeTime(s.signed_in_at)}</div>
                              {s.ended_at && <div>Ended: {formatRelativeTime(s.ended_at)}</div>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted">No recent sessions recorded.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Shared Reusable Staff Action Dialog */}
      <StaffActionDialog
        isOpen={actionDialogProps.isOpen}
        title={actionDialogProps.title}
        confirmCopy={actionDialogProps.confirmCopy}
        actionButtonLabel={actionDialogProps.actionButtonLabel}
        actionButtonVariant={actionDialogProps.actionButtonVariant}
        onClose={() => setActionDialogProps((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={actionDialogProps.onConfirm}
      />
    </div>
  );
}
