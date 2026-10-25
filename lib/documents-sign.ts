import type { Executed, LinkCopy, RequestStatus, Signer, SignerStatus } from '@/lib/api/signatures';

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  awaiting: 'Awaiting',
  complete: 'Complete',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/** "25 Oct 2026, 17:42" in the viewer's own time zone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

/** What to show for one signer: label, the time that goes with it, and whether a link can exist. */
export function signerState(s: Signer, previous: Signer | null, requestStatus: RequestStatus = 'awaiting'): { label: string; detail: string; tone: 'success' | 'info' | 'warning' | 'muted' } {
  const status: SignerStatus = s.status;
  if (status === 'signed') return { label: 'Signed', detail: formatDateTime(s.signed_at), tone: 'success' };
  // A dead request has no one to wait for: say what happened instead of "Awaiting".
  if (requestStatus === 'cancelled') return { label: 'Not signed', detail: 'The request was cancelled', tone: 'muted' };
  if (requestStatus === 'expired') return { label: 'Not signed', detail: 'The request expired', tone: 'muted' };
  if (status === 'viewed') return { label: 'Viewed', detail: `Opened ${formatDateTime(s.viewed_at)}`, tone: 'info' };
  if (status === 'waiting') {
    const who = previous ? previous.name || previous.email : 'the signer before them';
    return { label: 'Waiting', detail: `Waiting for ${who} to sign`, tone: 'muted' };
  }
  return { label: 'Awaiting', detail: s.notified_at ? `Sent ${formatDateTime(s.notified_at)}` : 'Link sent', tone: 'warning' };
}

/** "Link copied by Ada at 25 Oct 2026, 17:42" (the first entry per signer is the link handed to the sender on send). */
export function linkAuditLine(c: LinkCopy): string {
  const who = c.name || c.email || 'a team member';
  return c.via === 'created' ? `Link shown to ${who} when sent, ${formatDateTime(c.at)}` : `Link copied by ${who}, ${formatDateTime(c.at)}`;
}

export type ExecutedUi =
  | { kind: 'none' }
  | { kind: 'preparing' }
  | { kind: 'ready'; fileId: string; filename: string; sizeBytes: number }
  | { kind: 'legacy' };

export function executedUi(e: Executed): ExecutedUi {
  if (!e) return { kind: 'none' };
  if (e.state === 'ready') return { kind: 'ready', fileId: e.file_id, filename: e.filename, sizeBytes: e.size_bytes };
  if (e.state === 'legacy') return { kind: 'legacy' };
  return { kind: 'preparing' };
}

export interface ExpiryChoice {
  id: string;
  label: string;
  /** null = never expires. */
  days: number | null;
}
export const SEND_EXPIRY_CHOICES: ExpiryChoice[] = [
  { id: '7', label: '7 days', days: 7 },
  { id: '14', label: '14 days', days: 14 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: 'never', label: 'Never expires', days: null },
];
export const DEFAULT_SEND_EXPIRY = '14';

/** Only a clean PDF can be signed (BE-D): others are refused with PDF_REQUIRED, so say so before. */
export function signability(f: { mime: string; scan_status: string }): 'ok' | 'not_pdf' | 'scan' {
  if (f.scan_status !== 'clean') return 'scan';
  return f.mime === 'application/pdf' ? 'ok' : 'not_pdf';
}

/** Local end-of-day for a yyyy-mm-dd date as an ISO instant (what the share expiry endpoint wants). */
export function endOfDayIso(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 0).toISOString();
}

/** Earliest and latest date a link share can expire on (tomorrow .. 365 days ahead), as yyyy-mm-dd. */
export function shareExpiryBounds(now = new Date()): { min: string; max: string } {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const min = new Date(now);
  min.setDate(min.getDate() + 1);
  const max = new Date(now);
  max.setDate(max.getDate() + 364);
  return { min: iso(min), max: iso(max) };
}
