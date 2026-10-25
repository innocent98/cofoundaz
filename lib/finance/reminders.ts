import type { Invoice } from '@/lib/api/finance';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Automatic reminders stop after this many have been queued (manual ones count too). */
export const AUTO_REMIND_CAP = 8;

export interface ReminderView {
  /** The manual "Send reminder" button is offered. */
  canRemind: boolean;
  /** Why the button is disabled, or what happened last. */
  hint: string | null;
  /** One line about the automatic reminders. */
  auto: string;
}

function ago(ms: number): string {
  const h = Math.floor(ms / (60 * 60 * 1000));
  if (h < 1) return 'less than an hour ago';
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

/**
 * What the reminder controls of an invoice should say. `overdue` is the API's
 * derived status; the 24 hour gap is the server's clock, so the 422 must still be
 * handled when this says a reminder is allowed.
 */
export function reminderView(inv: Pick<Invoice, 'status' | 'auto_remind' | 'last_reminded_at' | 'reminder_count'>, nowMs: number): ReminderView {
  const last = inv.last_reminded_at ? Date.parse(inv.last_reminded_at) : null;
  const within24h = last !== null && !Number.isNaN(last) && nowMs - last < DAY_MS;
  const canRemind = inv.status === 'overdue' && !within24h;
  let hint: string | null = null;
  if (inv.status === 'overdue') {
    if (within24h && last !== null) hint = `Reminded ${ago(nowMs - last)}. You can send another after 24 hours.`;
    else if (last === null) hint = 'No reminder sent yet.';
    else hint = `Last reminder ${ago(nowMs - last)}.`;
  }
  let auto: string;
  if (!inv.auto_remind) auto = 'Automatic reminders are off.';
  else if (inv.reminder_count >= AUTO_REMIND_CAP) auto = `Automatic reminders paused (${AUTO_REMIND_CAP} sent).`;
  else if (last !== null) auto = 'Next automatic reminder about 7 days after the last one.';
  else auto = 'Automatic reminders are on: the first goes out after the due date, then every 7 days.';
  return { canRemind, hint, auto };
}

/** Characters outside Latin-1 print as "?" in the invoice PDF. */
export function hasNonLatin1(text: string): boolean {
  return /[^\u0000-ÿ]/.test(text);
}
