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
