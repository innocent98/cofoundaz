import { apiClient } from './client';

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

export async function listMembers(): Promise<TeamMember[]> {
  const res = await apiClient<{ data?: TeamMember[] }>('/team/members');
  return res?.data ?? [];
}
