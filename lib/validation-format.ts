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
