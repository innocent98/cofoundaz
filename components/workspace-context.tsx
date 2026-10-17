'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useMe } from '@/hooks/useMe';
import type { MeResponse } from '@/lib/api/profile';
import { asMemberRole, type MemberRole } from '@/lib/nav-access';

interface WorkspaceContextValue {
  me: MeResponse | null;
  /** The workspace the app is acting in (the X-Workspace-Id it sends); null until known. */
  workspaceId: string | null;
  /** That workspace's name from the caller's memberships. */
  workspaceName: string | null;
  /** The caller's role in that workspace; null while loading or if unknown. */
  role: MemberRole | null;
  loading: boolean;
}

/**
 * The workspace in use is the one stored for X-Workspace-Id (set at login, on
 * switch, and when an invitation is accepted), not /auth/me's `active_workspace_id`:
 * an invited mentor also owns a draft workspace of their own, and their role in
 * the shared one is what decides what they may see.
 */
export function effectiveWorkspaceId(me: MeResponse | null, stored: string | null): string | null {
  if (!me) return null;
  if (stored && me.memberships.some((m) => m.startup_id === stored)) return stored;
  return me.active_workspace_id;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** One /auth/me fetch for the whole shell (sidebar, top bar, tab bar). */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();
  const value = useMemo<WorkspaceContextValue>(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('cf_workspace_id');
    } catch {
      /* ignore storage errors */
    }
    const workspaceId = effectiveWorkspaceId(me, stored);
    const membership = me?.memberships.find((m) => m.startup_id === workspaceId);
    return {
      me,
      loading,
      workspaceId,
      workspaceName: membership?.name?.trim() || null,
      role: asMemberRole(membership?.role),
    };
  }, [me, loading]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}
