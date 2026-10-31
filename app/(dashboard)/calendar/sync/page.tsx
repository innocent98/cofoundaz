'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceUrl } from '@/lib/replace-url';
import { AlertTriangle } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useCalendarApi';
import { calendarApi, type GoogleCalendarOption, type GoogleConnection, type SyncDirection } from '@/lib/api/calendar';
import { DIRECTION_LABEL, callbackErrorMessage, syncSummaryLabel } from '@/lib/calendar-format';
import { ModalDialog } from '@/components/modal-dialog';
import { dangerBtn, inputClass, primaryBtn, secondaryBtn } from '@/components/calendar/drawer';
import { useCalendarToast } from '@/components/calendar/toast';

const PRIVACY = 'External event details stay private to you; teammates see only busy blocks.';
const CONNECTED_POLL_MS = 3000;
const CONNECTED_POLL_MAX = 10;

function when(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet';
}

function GoogleCard({ g, configured, reload, setLocal }: { g: GoogleConnection; configured: boolean; reload: () => void; setLocal: (g: GoogleConnection) => void }) {
  const { toast, run } = useCalendarToast();
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarOption[]>([]);
  const disconnectRef = useRef<HTMLButtonElement>(null);
  const active = g.status === 'active';

  useEffect(() => {
    if (!active) return;
    let live = true;
    calendarApi.googleCalendars().then(
      (r) => live && setCalendars(r.calendars),
      () => live && setCalendars([]),
    );
    return () => {
      live = false;
    };
  }, [active]);

  async function connect() {
    setBusy(true);
    const r = await run(() => calendarApi.connectGoogle());
    if (r.ok) {
      // Leaves the app for Google's consent screen; it returns to /calendar/sync?connected=google or ?error=<code>.
      window.location.assign(r.value.auth_url);
      return;
    }
    setBusy(false);
  }

  async function update(patch: { direction?: SyncDirection; calendar_id?: string }) {
    setBusy(true);
    const r = await run(() => calendarApi.updateGoogle(patch), 'Sync settings saved.');
    setBusy(false);
    if (r.ok) {
      setLocal(r.value);
      if (patch.calendar_id) reload();
    }
  }

  async function syncNow() {
    setBusy(true);
    const r = await run(() => calendarApi.syncGoogleNow());
    setBusy(false);
    if (r.ok) {
      setLocal(r.value.connection);
      toast(r.value.summary?.skipped ? 'Already synced a moment ago.' : 'Synced with Google.');
    }
  }

  async function disconnect() {
    setBusy(true);
    const r = await run(() => calendarApi.disconnectGoogle(), 'Google Calendar disconnected.');
    setBusy(false);
    setConfirmOff(false);
    if (r.ok) reload();
  }

  const writable = calendars.filter((c) => c.writable || g.direction === 'pull_only');

  return (
    <div className="bg-white border border-line rounded-[24px] p-5 md:p-6 shadow-card space-y-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-modal bg-brand-tint text-brand-strong flex items-center justify-center font-bold text-sm shrink-0" aria-hidden>G</div>
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-semibold text-sm text-ink">Google Calendar</h2>
          <p className="text-xs text-ink-muted break-words">
            {!configured ? 'Not available on this server' : g.connected ? `Connected as ${g.account_email}` : 'Not connected'}
          </p>
        </div>
      </div>

      {g.needs_attention && (
        <div role="alert" className="flex gap-2 rounded-modal border border-danger-bold bg-danger-tint px-3 py-2 text-xs text-danger-bold">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>Google no longer allows access. Reconnect to resume syncing.{g.last_error ? ` (${g.last_error})` : ''}</span>
        </div>
      )}

      {active && (
        <>
          <p className="text-xs text-ink-muted">
            Last sync: {when(g.last_sync_at)}{g.last_sync_summary ? ` · ${syncSummaryLabel(g.last_sync_summary)}` : g.last_sync_at ? '' : ' · Syncing…'}
          </p>

          <fieldset className="space-y-2" disabled={busy}>
            <legend className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider mb-1">Direction</legend>
            {(Object.keys(DIRECTION_LABEL) as SyncDirection[]).map((d) => (
              <label key={d} className="flex items-center gap-2 text-xs text-ink">
                <input type="radio" name="direction" checked={g.direction === d} onChange={() => update({ direction: d })} />
                {DIRECTION_LABEL[d]}
              </label>
            ))}
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="g-cal" className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Calendar</label>
            <select id="g-cal" className={inputClass} value={g.calendar_id} disabled={busy || writable.length === 0} onChange={(e) => update({ calendar_id: e.target.value })}>
              {writable.length === 0 && <option value={g.calendar_id}>{g.calendar_id}</option>}
              {writable.map((c) => <option key={c.id} value={c.id}>{c.name}{c.primary ? ' (primary)' : ''}{c.writable ? '' : ' (read only)'}</option>)}
            </select>
          </div>

          <p className="text-xs text-ink-muted">{PRIVACY}</p>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {!g.connected && <button type="button" onClick={connect} disabled={busy || !configured} className={primaryBtn}>{busy ? 'Opening Google…' : 'Connect'}</button>}
        {g.needs_attention && <button type="button" onClick={connect} disabled={busy || !configured} className={primaryBtn}>Reconnect</button>}
        {active && <button type="button" onClick={syncNow} disabled={busy} className={secondaryBtn}>Sync now</button>}
        {g.connected && <button ref={disconnectRef} type="button" onClick={() => setConfirmOff(true)} disabled={busy} className={dangerBtn}>Disconnect</button>}
      </div>

      {confirmOff && (
        <ModalDialog
          label="Disconnect Google"
          onClose={() => setConfirmOff(false)}
          returnFocusRef={disconnectRef}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          className="bg-white border border-line rounded-[24px] p-6 shadow-accent max-w-sm w-full space-y-4 outline-none"
        >
          <h2 className="text-lg font-display text-ink">Disconnect Google?</h2>
          <p className="text-xs text-ink-muted">Disconnect Google? Imported events are removed; your Cofoundaz events stay.</p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setConfirmOff(false)} className={secondaryBtn}>Keep connected</button>
            <button type="button" onClick={disconnect} disabled={busy} className={dangerBtn}>Disconnect</button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

function SyncContent() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useCalendarToast();
  const { data, loading, error, reload, setData } = useSyncStatus();
  const handled = useRef(false);
  const connectedParam = params.get('connected');
  const errorParam = params.get('error');

  // Google sends the browser back with ?connected=google or ?error=<code>: say so once, then clean the URL.
  useEffect(() => {
    if (handled.current || (!connectedParam && !errorParam)) return;
    handled.current = true;
    if (errorParam) toast(callbackErrorMessage(errorParam), 'error');
    else toast('Google Calendar connected.');
    replaceUrl(pathname);
  }, [connectedParam, errorParam, pathname, toast]);

  // The first sync runs in the background right after connecting: poll until it reports.
  const syncing = data?.google.status === 'active' && data.google.last_sync_at === null;
  const polls = useRef(0);
  useEffect(() => {
    if (!syncing) {
      polls.current = 0;
      return;
    }
    const t = setInterval(() => {
      polls.current += 1;
      if (polls.current > CONNECTED_POLL_MAX) clearInterval(t);
      else reload();
    }, CONNECTED_POLL_MS);
    return () => clearInterval(t);
  }, [syncing, reload]);

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display text-ink-strong tracking-tight">Calendar sync</h1>
        <p className="text-xs text-ink-muted">Bring your Google Calendar in so your mission never collides with a meeting. Only events you create in Cofoundaz are pushed to Google.</p>
      </div>

      {loading && !data && <p role="status" className="text-xs text-ink-muted">Loading sync settings…</p>}
      {error && !data && (
        <div role="alert" className="bg-danger-tint border border-danger-bold rounded-modal p-4 text-xs text-danger-bold flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <GoogleCard g={data.google} configured={data.configured} reload={reload} setLocal={(g) => setData({ ...data, google: g })} />
          <div className="bg-white border border-line rounded-[24px] p-5 md:p-6 shadow-card flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-modal bg-surface-muted text-ink-muted flex items-center justify-center font-bold text-sm shrink-0" aria-hidden>O</div>
            <div className="space-y-0.5">
              <h2 className="font-semibold text-sm text-ink">Outlook Calendar</h2>
              <p className="text-xs text-ink-muted">Coming soon</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SyncPage() {
  return (
    <Suspense fallback={<div role="status" aria-label="Loading" className="min-h-[50vh]" />}>
      <SyncContent />
    </Suspense>
  );
}
