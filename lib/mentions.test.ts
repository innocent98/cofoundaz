import { describe, expect, it } from 'vitest';
import { activeMention, filterCandidates, insertMention, liveMentionIds, splitMentions } from './mentions';

describe('mentions', () => {
  it('finds the @query before the caret, but not inside an email', () => {
    expect(activeMention('hi @ad', 6)).toEqual({ start: 3, query: 'ad' });
    expect(activeMention('hi @', 4)).toEqual({ start: 3, query: '' });
    expect(activeMention('mail me a@b.com', 15)).toBeNull();
    expect(activeMention('no mention here', 5)).toBeNull();
  });

  it('filters candidates by label, case-insensitively', () => {
    const all = [
      { id: '1', label: 'Ada F' },
      { id: '2', label: 'tm@example.com' },
    ];
    expect(filterCandidates(all, 'ad').map((c) => c.id)).toEqual(['1']);
    expect(filterCandidates(all, '').length).toBe(2);
  });

  it('inserts "@Label " over the query and moves the caret past it', () => {
    expect(insertMention('hi @ad now', 3, 6, 'Ada F')).toEqual({ text: 'hi @Ada F  now', caret: 10 });
  });

  it('sends only mentions whose text is still in the body', () => {
    const picked = new Map([
      ['1', 'Ada F'],
      ['2', 'tm@example.com'],
    ]);
    expect(liveMentionIds('hello @Ada F please', picked)).toEqual(['1']);
    expect(liveMentionIds('nothing', picked)).toEqual([]);
  });

  it('splits a body into plain and mention segments', () => {
    expect(splitMentions('Can you own @Ada F today?', ['Ada F'])).toEqual([
      { text: 'Can you own ', mention: false },
      { text: '@Ada F', mention: true },
      { text: ' today?', mention: false },
    ]);
    expect(splitMentions('plain', [])).toEqual([{ text: 'plain', mention: false }]);
    expect(splitMentions('a (b) @x.y', ['x.y'])[1]).toEqual({ text: '@x.y', mention: true });
  });
});

import { activeMentionQuery, applyMention, filterMembers, mentionIdsIn } from './mentions';
import type { TeamMember } from './api/comments';

const ada: TeamMember = { user_id: 'u1', name: 'Ada F', email: 'ada@example.com', role: 'founder' };
const nameless: TeamMember = { user_id: 'u2', name: null, email: 'mate@example.com', role: 'team_member' };

describe('member mentions (business builder)', () => {
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
