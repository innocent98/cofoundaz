import { describe, expect, it } from 'vitest';
import { parseEmails } from './event-form';
import { canManageCalendar } from '@/lib/calendar-format';

describe('parseEmails', () => {
  it('splits on commas, spaces and semicolons, lower-cases and de-duplicates', () => {
    expect(parseEmails('Ada@X.com, ada@x.com; b@y.org\nc@z.io').emails).toEqual(['ada@x.com', 'b@y.org', 'c@z.io']);
  });
  it('reports what is not an email', () => {
    expect(parseEmails('ok@x.com, nope, @bad').invalid).toEqual(['nope', '@bad']);
  });
  it('is empty for blank input', () => {
    expect(parseEmails('  ')).toEqual({ emails: [], invalid: [] });
  });
});

describe('canManageCalendar', () => {
  it('lets founders and team members manage, and every other role only read invited meetings', () => {
    expect(canManageCalendar('founder')).toBe(true);
    expect(canManageCalendar('team_member')).toBe(true);
    for (const r of ['mentor', 'accountant', 'legal_advisor', 'business_consultant', 'investor']) {
      expect(canManageCalendar(r)).toBe(false);
    }
  });
  it('treats an unknown role as core, since the server is the gate', () => {
    expect(canManageCalendar(null)).toBe(true);
  });
});
