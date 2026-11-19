import { accessTokenForRequest } from '@/lib/auth/session';
import { ApiError, apiClient, API_BASE } from './client';
export type {
  InviteRole,
  InviteRoleOption,
  InviteRow,
  InviteResult,
  InviteFieldError,
  TeamMemberRow,
  RemoveMemberResult,
  PendingInvitation,
  ResendInvitationResult,
  CommentThreadFilter,
  CommentThreadItem,
  AuditLogEntry,
  AuditLogResponse,
} from '@/types/team';
import type {
  InviteRoleOption,
  InviteRow,
  InviteResult,
  InviteFieldError,
  TeamMemberRow,
  RemoveMemberResult,
  PendingInvitation,
  ResendInvitationResult,
  CommentThreadFilter,
  CommentThreadItem,
  AuditLogEntry,
  AuditLogResponse,
} from '@/types/team';

/** The modal labels mapped to the API's role values. */
export const INVITE_ROLE_OPTIONS: InviteRoleOption[] = [
  { label: 'Co-Founder', value: 'founder', hint: 'Co-Founders get full access.' },
  { label: 'Team Member', value: 'team_member' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'Legal Advisor', value: 'legal_advisor' },
  { label: 'Business Consultant', value: 'business_consultant' },
];

export class InviteError extends Error {
  constructor(
    message: string,
    public kind: 'validation' | 'forbidden' | 'daily_limit' | 'rate_limit' | 'unknown',
    public fieldErrors: InviteFieldError[] = [],
  ) {
    super(message);
  }
}

const INVITE_FIELD = /^invites\.(\d+)\.(email|role)$/;

export function parseFieldErrors(raw: unknown): InviteFieldError[] {
  if (!Array.isArray(raw)) return [];
  const out: InviteFieldError[] = [];
  for (const item of raw as Array<{ field?: string; message?: string }>) {
    const m = INVITE_FIELD.exec(item.field ?? '');
    if (m) out.push({ row: Number(m[1]), field: m[2] as 'email' | 'role', message: item.message ?? 'Check this field.' });
  }
  return out;
}

export async function sendInvitations(invites: InviteRow[]): Promise<InviteResult> {
  try {
    const res = await apiClient<{ data?: Partial<InviteResult> }>('/team/invitations', {
      method: 'POST',
      body: JSON.stringify({ invites }),
    });
    return {
      created: res?.data?.created ?? [],
      skipped: res?.data?.skipped ?? [],
      undelivered: res?.data?.undelivered ?? [],
    };
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.data as { error?: { code?: string; message?: string; field_errors?: unknown } } | null;
      const apiMessage = body?.error?.message;
      if (err.status === 422) {
        throw new InviteError(apiMessage ?? 'Please check the highlighted fields.', 'validation', parseFieldErrors(body?.error?.field_errors));
      }
      if (err.status === 403) {
        throw new InviteError("You don't have permission to invite people.", 'forbidden');
      }
      if (err.status === 429) {
        if (body?.error?.code === 'INVITE_LIMIT_REACHED') {
          throw new InviteError(apiMessage ?? "You've sent a lot of invitations today. Try again tomorrow.", 'daily_limit');
        }
        throw new InviteError('Too many requests. Wait a minute and try again.', 'rate_limit');
      }
    }
    throw new InviteError("Couldn't send your invitations. Try again.", 'unknown');
  }
}

export function summarizeInvites(r: InviteResult): string {
  const parts: string[] = [];
  if (r.created.length) parts.push(`Invited ${r.created.length}.`);
  if (r.skipped.length) parts.push(`Skipped ${r.skipped.length} (already a member or already invited).`);
  return parts.join(' ');
}

// -------------------------------------------------------------
// Members
// -------------------------------------------------------------

export async function getTeamMembers(): Promise<TeamMemberRow[]> {
  const res = await apiClient<{ data?: TeamMemberRow[] }>('/team/members');
  return Array.isArray(res?.data) ? res.data : [];
}

export async function updateMemberRole(userId: string, role: string): Promise<TeamMemberRow> {
  const res = await apiClient<{ data: TeamMemberRow }>(`/team/members/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return res.data;
}

export async function removeMember(userId: string): Promise<RemoveMemberResult> {
  const res = await apiClient<{ data?: RemoveMemberResult }>(`/team/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  return {
    document_grants_revoked: res?.data?.document_grants_revoked ?? 0,
  };
}

export async function leaveWorkspace(): Promise<void> {
  await apiClient('/team/leave', {
    method: 'POST',
  });
}

// -------------------------------------------------------------
// Invitations (Pending)
// -------------------------------------------------------------

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const res = await apiClient<{ data?: PendingInvitation[] }>('/team/invitations');
  return Array.isArray(res?.data) ? res.data : [];
}

export async function resendInvitation(id: string): Promise<ResendInvitationResult> {
  const res = await apiClient<{ data?: ResendInvitationResult }>(`/team/invitations/${encodeURIComponent(id)}/resend`, {
    method: 'POST',
  });
  return {
    delivered: res?.data?.delivered ?? true,
  };
}

export async function revokeInvitation(id: string): Promise<void> {
  await apiClient(`/team/invitations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Comments Threads
// -------------------------------------------------------------

export async function getCommentThreads(filter: CommentThreadFilter = 'all'): Promise<CommentThreadItem[]> {
  const q = new URLSearchParams({ filter });
  const res = await apiClient<{ data?: CommentThreadItem[] }>(`/team/comments/threads?${q.toString()}`);
  return Array.isArray(res?.data) ? res.data : [];
}

// -------------------------------------------------------------
// Audit Log
// -------------------------------------------------------------

export async function getTeamAuditLogs(cursor?: string): Promise<AuditLogResponse> {
  const q = new URLSearchParams({ limit: '30' });
  if (cursor) q.set('cursor', cursor);
  const res = await apiClient<{ data?: { entries?: AuditLogEntry[]; next_cursor?: string | null } }>(
    `/team/audit?${q.toString()}`
  );
  return {
    items: res?.data?.entries ?? [],
    next_cursor: res?.data?.next_cursor ?? null,
  };
}

export async function exportTeamAuditCsv(): Promise<{ blob: Blob; filename: string }> {
  const headers = new Headers();
  // The access token lives in memory only (D-AUTH-6); this renews it from the refresh cookie on a cold page.
  const token = await accessTokenForRequest();
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (workspaceId) headers.set('X-Workspace-Id', workspaceId);

  const res = await fetch(`${API_BASE}/team/audit/export`, { headers });
  if (!res.ok) {
    let errData: unknown = null;
    try {
      errData = await res.json();
    } catch {
      /* not json */
    }
    throw new ApiError(res.status, res.statusText, errData);
  }
  const blob = await res.blob();
  return { blob, filename: 'team-audit-log.csv' };
}
