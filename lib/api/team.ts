import { ApiError, apiClient } from './client';

// POST /team/invitations (BE guide: fe-integration-guide-team-invitations.md).
// Founder only. 1 to 20 rows; `investor` is not accepted here.

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

/** The modal labels mapped to the API's role values. */
export const INVITE_ROLE_OPTIONS: InviteRoleOption[] = [
  { label: 'Co-Founder', value: 'founder', hint: 'Co-Founders get full access.' },
  { label: 'Team Member', value: 'team_member' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'Legal Advisor', value: 'legal_advisor' },
  { label: 'Business Consultant', value: 'business_consultant' },
];

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
  /** Row index parsed from `invites.{row}.{email|role}`. */
  row: number;
  field: 'email' | 'role';
  message: string;
}

/** Thrown for a rejected invite request; carries what the modal needs to show. */
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

/** One plain-language line per outcome list, e.g. "Invited 1. Skipped 1 (already a member or already invited)." */
export function summarizeInvites(r: InviteResult): string {
  const parts: string[] = [];
  if (r.created.length) parts.push(`Invited ${r.created.length}.`);
  if (r.skipped.length) parts.push(`Skipped ${r.skipped.length} (already a member or already invited).`);
  return parts.join(' ');
}
