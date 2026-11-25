import { apiClient } from '@/lib/api/client';

// Platform staff (Admin, Super Admin) never go through founder onboarding (SO4): they land on
// their console instead. `GET /auth/me` returns `staff_role` ("admin" | "super_admin" | null).

export type StaffRole = 'admin' | 'super_admin';

/** The console a staff member lands on, or null for everyone else. */
export function staffHome(role: string | null | undefined): string | null {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin-portal';
  return null;
}

/** A path already inside a console, kept as the landing when a staff member was sent to log in from it. */
export function isConsolePath(path: string | null | undefined): boolean {
  return !!path && /^\/(admin-portal|super-admin)(\/|\?|$)/.test(path);
}

export interface StaffMe {
  staff_role?: string | null;
  active_workspace_id?: string | null;
  memberships?: unknown[] | null;
}

/**
 * Where a signed-in person lands INSTEAD of the founder flow, or null to use the founder flow.
 * Only staff with no workspace of their own go to the console: a staff member who is also a
 * founder (or a member somewhere) keeps the normal flow, so they can finish their own onboarding
 * and a founder `next` link still works.
 */
export function staffLanding(me: StaffMe | null | undefined): string | null {
  if (!me) return null;
  const hasWorkspace = !!me.active_workspace_id || (me.memberships?.length ?? 0) > 0;
  return hasWorkspace ? null : staffHome(me.staff_role);
}

/** Reads `/auth/me` and answers `staffLanding`, or null (not staff-only, or unreadable). */
export async function fetchStaffHome(): Promise<string | null> {
  try {
    const me = await apiClient<{ data?: StaffMe }>('/auth/me');
    return staffLanding(me?.data);
  } catch {
    return null;
  }
}
