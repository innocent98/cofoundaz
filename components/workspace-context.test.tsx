import { describe, expect, it } from 'vitest';
import { effectiveWorkspaceId } from './workspace-context';
import type { MeResponse } from '@/lib/api/profile';

// Live capture shape: an invited mentor also owns a draft workspace of their own,
// and /auth/me's active_workspace_id points at that one.
const me: MeResponse = {
  user: { id: 'u', email: 'throwaway-mentor@example.com' },
  profile: { full_name: null, role_title: 'Founder & CEO', country: null, avatar_url: null },
  memberships: [
    { startup_id: 'own', name: null, role: 'founder' },
    { startup_id: 'novapay', name: 'NovaPay', role: 'mentor' },
  ],
  active_workspace_id: 'own',
};

describe('effectiveWorkspaceId', () => {
  it('uses the stored X-Workspace-Id workspace when the caller is a member of it', () => {
    expect(effectiveWorkspaceId(me, 'novapay')).toBe('novapay');
  });

  it('ignores a stored workspace the caller does not belong to', () => {
    expect(effectiveWorkspaceId(me, 'someone-elses')).toBe('own');
  });

  it('falls back to /auth/me active workspace when nothing is stored', () => {
    expect(effectiveWorkspaceId(me, null)).toBe('own');
  });

  it('is null until the profile loads', () => {
    expect(effectiveWorkspaceId(null, 'novapay')).toBeNull();
  });
});
