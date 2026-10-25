import type { SmokeTestStats, WaitlistSignup } from '@/lib/api/validation';

/** PRD 09.6 nudge copy. */
export function nudgeCopy(statement: string): string {
  return `Your riskiest untested assumption: '${statement}'. Want an experiment for it?`;
}

export function publicPageUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, '')}/p/${slug}`;
}

/** Lower-case dashes-only suggestion; the server is the judge of validity. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export type SignalBanner =
  | { kind: 'verdict'; verdict: 'validated' | 'weak'; text: string }
  | { kind: 'collecting'; text: string };

/** Banner from the server's own verdict; the FE does no verdict math. */
export function signalBanner(stats: Pick<SmokeTestStats, 'verdict' | 'conversion' | 'target_conversion' | 'visits' | 'sample_needed'>): SignalBanner {
  if (stats.verdict) {
    return {
      kind: 'verdict',
      verdict: stats.verdict,
      text: `Signal: ${stats.conversion}% conversion against your ${stats.target_conversion}% bar → looks ${stats.verdict}.`,
    };
  }
  return { kind: 'collecting', text: `${stats.visits} of ${stats.sample_needed} visitors so far` };
}

function csvCell(v: string): string {
  // Neutralise spreadsheet formulas, then quote.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function signupsToCsv(rows: WaitlistSignup[]): string {
  const lines = ['email,signed_up_at', ...rows.map((r) => `${csvCell(r.email)},${csvCell(r.signed_up_at)}`)];
  return `${lines.join('\n')}\n`;
}

/** One random id per browser per page, kept in localStorage. */
export function getVisitorId(slug: string, storage?: Pick<Storage, 'getItem' | 'setItem'>): string {
  const key = `cf_visitor_${slug}`;
  const fresh = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  try {
    const s = storage ?? window.localStorage;
    const existing = s.getItem(key);
    if (existing && existing.length >= 8 && existing.length <= 64) return existing;
    const id = fresh();
    s.setItem(key, id);
    return id;
  } catch {
    return fresh();
  }
}

/** Delete-confirm copy for each kind of validation item. */
export function deleteWarning(kind: 'assumption' | 'experiment' | 'interview' | 'survey', extra?: { signups?: number }): string {
  switch (kind) {
    case 'assumption':
      return 'It is also removed from any interviews and experiments it was linked to.';
    case 'experiment':
      return extra?.signups
        ? `Its page goes offline. This also deletes its waitlist of ${extra.signups} email${extra.signups === 1 ? '' : 's'}.`
        : 'Its page goes offline and its waitlist is deleted.';
    case 'interview':
      return 'This interview note is deleted for good.';
    case 'survey':
      return 'Its share link stops working and all of its responses are deleted.';
  }
}

// --- Slice (b): scripts + Insight Synthesizer ---------------------------------

export const SCRIPT_HINT = 'Ask about the last time it happened, not hypotheticals.';
export const MAX_SCRIPT_ASSUMPTIONS = 5;
export const MAX_SCRIPT_QUESTIONS = 30;
export const MAX_SCRIPT_TEXT = 500;
export const STILL_WORKING_COPY = 'Still working, check back in a minute.';
export const AI_LABEL = 'AI-generated from your customer evidence. Check it before you act on it.';

/** Model prose is rendered as plain text; this only swaps em/en dashes for commas (never used on quotes). */
export function plainProse(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ', ');
}

/** "Based on 3 interviews, 3 survey answers and 2 feedback items" from the report's `inputs`. */
export function insightInputsLine(inputs: { interviews?: number; open_answers?: number; feedback?: number } | null | undefined): string {
  const parts: string[] = [];
  const i = inputs?.interviews ?? 0;
  const a = inputs?.open_answers ?? 0;
  const f = inputs?.feedback ?? 0;
  if (i > 0) parts.push(`${i} ${i === 1 ? 'interview' : 'interviews'}`);
  if (a > 0) parts.push(`${a} survey ${a === 1 ? 'answer' : 'answers'}`);
  if (f > 0) parts.push(`${f} feedback ${f === 1 ? 'item' : 'items'}`);
  if (parts.length === 0) return 'Based on your customer evidence';
  const last = parts.pop() as string;
  return `Based on ${parts.length ? `${parts.join(', ')} and ${last}` : last}`;
}

/** First-line client check mirroring the API's 422 copy, so the user sees it before a round trip. */
export function validateScriptDraft(title: string, questions: Array<{ question: string; tip: string }>): string | null {
  if (!title.trim()) return 'Give the script a title.';
  if (questions.length === 0) return 'A script needs at least one question.';
  if (questions.length > MAX_SCRIPT_QUESTIONS) return `A script may have at most ${MAX_SCRIPT_QUESTIONS} questions.`;
  if (questions.some((q) => !q.question.trim())) return 'Each question needs text.';
  if (questions.some((q) => q.question.length > MAX_SCRIPT_TEXT || q.tip.length > MAX_SCRIPT_TEXT)) {
    return 'Questions and tips are limited to 500 characters.';
  }
  return null;
}

/** Move item `from` to index `to`; returns a new array (no-op when out of range). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// --- Slice (c): MVP feedback + survey answers ---------------------------------

export const SOURCE_LABEL: Record<'interview' | 'survey' | 'in_app' | 'email', string> = {
  interview: 'Interview',
  survey: 'Survey',
  in_app: 'In-app',
  email: 'Email',
};

/** Local calendar date as YYYY-MM-DD (what `<input type="date">` and the API use). */
export function todayIso(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** "19 Oct 2026" from an ISO date, without a timezone shift. */
export function formatReceivedOn(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function validateFeedbackDraft(text: string, receivedOn: string): string | null {
  if (!text.trim()) return 'Write what the customer said.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn)) return 'Pick the date you heard it.';
  return null;
}

export const SHARE_LINK_ROTATE_WARNING = "Anyone with the old link won't be able to answer.";

export function surveyShareUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/s/${token}`;
}
