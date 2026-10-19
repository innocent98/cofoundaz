import type { TeamMember } from '@/lib/api/comments';

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

// --- Member-based helpers (Business Builder comment drawer) ---------------------------
// Same idea as above, keyed on TeamMember; follow-up: converge both composers on one set.

export function memberLabel(m: TeamMember): string {
  return m.name?.trim() || m.email;
}

/** The "@query" the caret is currently inside, or null. A mention can't contain a space or a second "@". */
export function activeMentionQuery(text: string, caret: number): { query: string; start: number } | null {
  const before = text.slice(0, caret);
  const m = /(^|\s)@([^\s@]*)$/.exec(before);
  if (!m) return null;
  return { query: m[2].toLowerCase(), start: before.length - m[2].length - 1 };
}

export function filterMembers(members: TeamMember[], query: string, limit = 5): TeamMember[] {
  const q = query.toLowerCase();
  return members
    .filter((m) => !q || memberLabel(m).toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    .slice(0, limit);
}

/** Replaces the active "@query" with "@Label " and returns the new text and caret. */
export function applyMention(
  text: string,
  caret: number,
  start: number,
  member: TeamMember
): { text: string; caret: number } {
  const insert = `@${memberLabel(member)} `;
  const next = text.slice(0, start) + insert + text.slice(caret);
  return { text: next, caret: start + insert.length };
}

/** Ids of the picked members whose "@Label" is still in the body (max 20, as the API allows). */
export function mentionIdsIn(body: string, picked: TeamMember[]): string[] {
  const ids = new Set<string>();
  for (const m of picked) {
    if (body.includes(`@${memberLabel(m)}`)) ids.add(m.user_id);
  }
  return [...ids].slice(0, 20);
}
