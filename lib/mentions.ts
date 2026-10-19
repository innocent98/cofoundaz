import type { TeamMember } from '@/lib/api/comments';

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
