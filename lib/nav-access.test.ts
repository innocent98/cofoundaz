import { describe, expect, it } from 'vitest';
import { asMemberRole, canInvite, canSee, roleLabel } from './nav-access';

describe('nav access (PRD §2.1)', () => {
  it('founder sees everything, including the founder-only Journal', () => {
    for (const href of ['/mission', '/finance', '/journal', '/team', '/funding']) {
      expect(canSee(href, 'founder')).toBe(true);
    }
  });

  it('accountant sees only Finance, Documents, Notifications, Settings (plus Dashboard and Calendar, where they see only meetings they are invited to)', () => {
    const visible = ['/dashboard', '/finance', '/documents', '/notifications', '/settings', '/calendar'];
    for (const href of visible) expect(canSee(href, 'accountant')).toBe(true);
    for (const href of ['/mission', '/ai', '/marketing', '/journal', '/team', '/roadmap', '/legal']) {
      expect(canSee(href, 'accountant')).toBe(false);
    }
  });

  it('journal is founder only, even for team members', () => {
    expect(canSee('/journal', 'team_member')).toBe(false);
    expect(canSee('/journal', 'mentor')).toBe(false);
  });

  it('mentors read roadmap and health but cannot open finance or the AI co-founder', () => {
    expect(canSee('/roadmap', 'mentor')).toBe(true);
    expect(canSee('/health', 'mentor')).toBe(true);
    expect(canSee('/finance', 'mentor')).toBe(false);
    expect(canSee('/ai', 'mentor')).toBe(false);
  });

  it('an unknown role keeps the nav usable but never reveals the Journal', () => {
    expect(canSee('/finance', null)).toBe(true);
    expect(canSee('/journal', null)).toBe(false);
  });

  it('an unlisted route is visible', () => {
    expect(canSee('/something-new', 'investor')).toBe(true);
  });

  it('only founders may invite', () => {
    expect(canInvite('founder')).toBe(true);
    expect(canInvite('team_member')).toBe(false);
    expect(canInvite(null)).toBe(false);
  });

  it('roleLabel names every workspace role', () => {
    expect(roleLabel('founder')).toBe('Founder');
    expect(roleLabel('team_member')).toBe('Team Member');
    expect(roleLabel('mentor')).toBe('Mentor');
    expect(roleLabel('business_consultant')).toBe('Business Consultant');
    expect(roleLabel('legal_advisor')).toBe('Legal Advisor');
  });

  it('asMemberRole narrows only known roles', () => {
    expect(asMemberRole('mentor')).toBe('mentor');
    expect(asMemberRole('admin')).toBeNull();
    expect(asMemberRole(undefined)).toBeNull();
  });
});
