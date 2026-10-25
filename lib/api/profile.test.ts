import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from './client';
import { hasProfileName, updateProfileName, type MeResponse } from './profile';

const spy = vi.spyOn(clientModule, 'apiClient');

// Captured shape from fe-integration-guide-profile.md (me_patch_ok.json); ids are placeholders.
const me: MeResponse = {
  user: { id: '6087acf5-f674-447f-88a2-cd46baffe39a', email: 'rewalk-tm@example.com', status: 'active' },
  profile: { full_name: 'Rewalk Teammate', role_title: 'Founder & CEO', country: null, avatar_url: null },
  memberships: [{ startup_id: '11ba2aa0-8c8d-4035-adb8-62530988ed44', name: 'NovaPay', role: 'team_member' }],
  active_workspace_id: '11ba2aa0-8c8d-4035-adb8-62530988ed44',
};

describe('profile api', () => {
  beforeEach(() => {
    spy.mockReset();
    spy.mockResolvedValue({ data: me });
  });

  it('PATCHes /auth/me with full_name and returns the unwrapped me', async () => {
    spy.mockResolvedValue({ data: me, meta: null });
    const out = await updateProfileName('  Rewalk   Teammate  ');
    expect(spy).toHaveBeenCalledWith('/auth/me', { method: 'PATCH', body: JSON.stringify({ full_name: '  Rewalk   Teammate  ' }) });
    expect(out.profile.full_name).toBe('Rewalk Teammate');
  });

  it('treats a null profile and a null or blank name the same: no name', () => {
    expect(hasProfileName(me)).toBe(true);
    expect(hasProfileName({ ...me, profile: { ...me.profile, full_name: null } })).toBe(false);
    expect(hasProfileName({ ...me, profile: { ...me.profile, full_name: '   ' } })).toBe(false);
    expect(hasProfileName({ ...me, profile: null as unknown as MeResponse['profile'] })).toBe(false);
    expect(hasProfileName(null)).toBe(false);
  });
});
