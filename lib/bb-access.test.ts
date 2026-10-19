import { describe, expect, it } from 'vitest';
import { SUGGEST_KIND, builderAccess } from './bb-access';

describe('builderAccess', () => {
  it('lets founders and team members edit directly', () => {
    for (const r of ['founder', 'team_member'] as const) {
      const a = builderAccess(r, false);
      expect(a).toMatchObject({ mode: 'edit', canEdit: true, suggestMode: false, canWrite: true });
    }
  });

  it('puts only the business consultant in suggest mode', () => {
    const a = builderAccess('business_consultant', false);
    expect(a).toMatchObject({ mode: 'suggest', canEdit: false, suggestMode: true, canWrite: true });
  });

  it('keeps every other role read-only', () => {
    for (const r of ['mentor', 'investor', 'legal_advisor', 'accountant'] as const) {
      const a = builderAccess(r, false);
      expect(a).toMatchObject({ mode: 'read', canEdit: false, suggestMode: false, canWrite: false });
    }
  });

  it('stays read-only while the role loads, then falls back to the founder UI if it is unknown', () => {
    expect(builderAccess(null, true).mode).toBe('read');
    expect(builderAccess(null, false).mode).toBe('edit');
  });

  it('lets everyone but investors comment', () => {
    expect(builderAccess('investor', false).canComment).toBe(false);
    expect(builderAccess('mentor', false).canComment).toBe(true);
    expect(builderAccess('business_consultant', false).canComment).toBe(true);
  });

  it('maps record URL segments to suggestion kinds', () => {
    expect(SUGGEST_KIND).toEqual({
      personas: 'persona',
      competitors: 'competitor',
      pricing: 'pricing',
      'revenue-streams': 'revenue_stream',
    });
  });
});
