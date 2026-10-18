// @-mention helpers for the comment composer. The composer inserts "@Name" into
// the text and remembers the member id; on submit only mentions whose text is
// still present are sent as `mention_user_ids`.

export interface MentionCandidate {
  id: string;
  label: string;
}

/** The "@query" being typed right before the caret, or null when the caret isn't in one. */
export function activeMention(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1])) return null; // an email-like "a@b", not a mention
  const query = before.slice(at + 1);
  if (query.length > 40 || /[\n]/.test(query)) return null;
  return { start: at, query };
}

export function filterCandidates(all: MentionCandidate[], query: string): MentionCandidate[] {
  const q = query.trim().toLowerCase();
  return all.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 6);
}

/** Replace the active "@query" with "@Label " and return the new text and caret. */
export function insertMention(text: string, start: number, caret: number, label: string) {
  const insert = `@${label} `;
  return { text: text.slice(0, start) + insert + text.slice(caret), caret: start + insert.length };
}

/** Ids of picked members whose "@Label" is still in the text. */
export function liveMentionIds(text: string, picked: Map<string, string>): string[] {
  const ids: string[] = [];
  picked.forEach((label, id) => {
    if (text.includes(`@${label}`)) ids.push(id);
  });
  return ids;
}

/** Split a comment body into plain and mention segments, using the mentioned members' labels. */
export function splitMentions(body: string, labels: string[]): { text: string; mention: boolean }[] {
  const uniq = [...new Set(labels.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (uniq.length === 0) return [{ text: body, mention: false }];
  const escaped = uniq.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(@(?:${escaped.join('|')}))`);
  // With one capture group, split() puts the matches at the odd indices.
  return body
    .split(re)
    .map((text, i) => ({ text, mention: i % 2 === 1 }))
    .filter((seg) => seg.text !== '');
}
