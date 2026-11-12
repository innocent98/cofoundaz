import type { MemberRole } from '@/lib/nav-access';

export type InviteRole =
  | 'founder'
  | 'team_member'
  | 'mentor'
  | 'accountant'
  | 'legal_advisor'
  | 'business_consultant';

export interface InviteRoleOption {
  label: string;
  value: InviteRole;
  hint?: string;
}

export interface InviteRow {
  email: string;
  role: InviteRole;
}

export interface InviteResult {
  created: string[];
  skipped: string[];
  undelivered: string[];
}

export interface InviteFieldError {
  row: number;
  field: 'email' | 'role';
  message: string;
}

export interface TeamMemberRow {
  user_id: string;
  name: string | null;
  email: string;
  role: MemberRole | string;
  joined_at?: string | null;
  last_active_at?: string | null;
}

export interface RemoveMemberResult {
  document_grants_revoked: number;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at?: string;
  expired?: boolean;
}

export interface ResendInvitationResult {
  delivered: boolean;
}

export type CommentThreadFilter = 'all' | 'mentions' | 'unresolved';

export interface CommentThreadItem {
  id?: string;
  entity_type: string;
  entity_id: string;
  anchor: string | null;
  context: string;
  comment_count?: number;
  unresolved_count: number;
  mentions_me: boolean;
  last_comment: {
    snippet: string;
    author: string | { id?: string; name: string | null };
    created_at: string;
  } | null;
}

export interface AuditLogEntry {
  id: string;
  actor: {
    id?: string;
    name?: string | null;
  } | string | null;
  action: string;
  target: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  next_cursor: string | null;
}

