import { describe, expect, it } from 'vitest';
import { activeMentionQuery, applyMention, filterMembers, mentionIdsIn } from './mentions';
import type { TeamMember } from './api/comments';

const ada: TeamMember = { user_id: 'u1', name: 'Ada F', email: 'ada@example.com', role: 'founder' };
const nameless: TeamMember = { user_id: 'u2', name: null, email: 'mate@example.com', role: 'team_member' };

describe('mentions', () => {
  it('detects the @query at the caret', () => {
    expect(activeMentionQuery('hello @ad', 9)).toEqual({ query: 'ad', start: 6 });
    expect(activeMentionQuery('@', 1)).toEqual({ query: '', start: 0 });
    expect(activeMentionQuery('mail me at a@b.com', 18)).toBeNull();
    expect(activeMentionQuery('hello @ad there', 15)).toBeNull();
  });

  it('filters by name or email and falls back to the email label', () => {
    expect(filterMembers([ada, nameless], 'ma').map((m) => m.user_id)).toEqual(['u2']);
    expect(filterMembers([ada, nameless], '').length).toBe(2);
  });

  it('inserts the mention and moves the caret', () => {
    const r = applyMention('hi @ad', 6, 3, ada);
    expect(r.text).toBe('hi @Ada F ');
    expect(r.caret).toBe(10);
  });

  it('keeps only ids whose @label is still in the body', () => {
    expect(mentionIdsIn('thanks @Ada F please', [ada, nameless])).toEqual(['u1']);
    expect(mentionIdsIn('no mentions left', [ada])).toEqual([]);
    expect(mentionIdsIn('@mate@example.com ok', [nameless])).toEqual(['u2']);
  });
});
