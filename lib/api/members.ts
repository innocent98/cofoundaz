import { ApiError, apiClient } from './client';

// GET /team/members (BE guide: fe-integration-guide-roadmap-prd.md §2). Active
// members for owner / assignee pickers and @-mentions. `name` can be null.

export interface TeamMember {
  user_id: string;
  name: string | null;
  email: string;
  role: string;
}

/** Name, else email: what a picker or mention shows for a member. */
export function memberLabel(m: Pick<TeamMember, 'name' | 'email'>): string {
  return m.name?.trim() || m.email;
}

/**
 * Founder and team member only: the list carries every e-mail, so the other five roles get 403.
 * That is not an error for a picker: they simply have no one to pick or @-mention.
 */
export async function listMembers(): Promise<TeamMember[]> {
  try {
    const res = await apiClient<{ data?: TeamMember[] }>('/team/members');
    return res?.data ?? [];
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return [];
    throw err;
  }
}
