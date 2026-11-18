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

/** Reads `/auth/me` and answers the caller's console, or null (not staff, or unreadable). */
export async function fetchStaffHome(): Promise<string | null> {
  try {
    const me = await apiClient<{ data?: { staff_role?: string | null } }>('/auth/me');
    return staffHome(me?.data?.staff_role);
  } catch {
    return null;
  }
}
