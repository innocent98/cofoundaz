'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import type { SmokeTest, SmokeTestStats, WaitlistSignup } from '@/hooks/useSmokeTests';
import { publicPageUrl, signalBanner, signupsToCsv } from '@/lib/validation-format';

const TILE = 'bg-surface-ghost border border-line-soft rounded-card p-4 flex flex-col gap-1';

export interface ResultsApi {
  getStats: (id: string) => Promise<SmokeTestStats>;
  getSignups: (id: string) => Promise<WaitlistSignup[]>;
  updateMetrics: (id: string, visits: number, signups: number) => Promise<unknown>;
  setStatus: (id: string, status: 'live' | 'ended') => Promise<unknown>;
}

export function SmokeResults({
  test,
  origin,
  api,
  onBack,
  onDelete,
  notify,
}: {
  test: SmokeTest;
  origin: string;
  api: ResultsApi;
  onBack: () => void;
  onDelete: () => void;
  notify: (msg: string) => void;
}) {
  const [stats, setStats] = useState<SmokeTestStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [signups, setSignups] = useState<WaitlistSignup[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visitsInput, setVisitsInput] = useState('');
  const [signupsInput, setSignupsInput] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);

  const { getStats, getSignups } = api;
  const hosted = Boolean(test.slug);
  const url = hosted ? publicPageUrl(origin, test.slug) : '';

  const refresh = useCallback(async () => {
    try {
      setStats(await getStats(test.id));
      setStatsError(false);
    } catch {
      setStatsError(true);
    }
    if (test.slug) {
      try {
        setSignups(await getSignups(test.id));
      } catch {
        setSignups((prev) => prev ?? []);
      }
    }
  }, [getStats, getSignups, test.id, test.slug]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
    if (test.status !== 'live') return;
    const t = setInterval(() => void refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh, test.status]);

  const copy = () => {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        notify('Page link copied.');
        setTimeout(() => setCopied(false), 2500);
      },
      () => notify('Could not copy. Select and copy it manually.')
    );
  };

  const downloadCsv = () => {
    const blob = new Blob([signupsToCsv(signups ?? [])], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${test.slug || 'waitlist'}-waitlist.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const changeStatus = (status: 'live' | 'ended') => {
    if (busy) return;
    setBusy(true);
    api
      .setStatus(test.id, status)
      .then(() => notify(status === 'live' ? 'Published.' : 'Test ended. The page is offline.'))
      .catch(() => notify('Could not change the status. Try again.'))
      .finally(() => setBusy(false));
  };

  const saveMetrics = () => {
    if (savingMetrics) return;
    const v = Math.max(0, Math.floor(Number(visitsInput) || 0));
    const s = Math.max(0, Math.floor(Number(signupsInput) || 0));
    setSavingMetrics(true);
    api
      .updateMetrics(test.id, v, s)
      .then(async () => {
        notify('Numbers updated.');
        await refresh();
      })
      .catch(() => notify('Could not save the numbers. Try again.'))
      .finally(() => setSavingMetrics(false));
  };

  const banner = stats ? signalBanner(stats) : null;
  const statusLabel = test.status === 'live' ? 'Live' : test.status === 'ended' ? 'Ended' : 'Draft';

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <button onClick={onBack} className="text-sm font-bold text-ink-muted hover:text-ink cursor-pointer">← Back</button>
        <h2 className="text-2xl font-display font-bold text-ink break-words min-w-0">{test.name}</h2>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-xe6efea text-brand-strong">{statusLabel}</span>
        <div className="flex items-center gap-2 md:ml-auto">
          {test.status !== 'live' && (
            <button onClick={() => changeStatus('live')} disabled={busy} className="bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white px-4 py-2 rounded-card font-bold text-sm cursor-pointer">
              {test.status === 'ended' ? 'Resume' : 'Publish'}
            </button>
          )}
          {test.status === 'live' && (
            <button onClick={() => changeStatus('ended')} disabled={busy} className="border border-brand-strong text-brand-strong hover:bg-neutral-xe6efea disabled:opacity-60 px-4 py-2 rounded-card font-bold text-sm cursor-pointer">
              End test
            </button>
          )}
          <button onClick={onDelete} aria-label={`Delete ${test.name}`} className="p-2 rounded-card text-ink-muted hover:text-danger-600 hover:bg-danger-xfbeae7 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hosted && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-4 md:p-5 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
            {test.status === 'live' ? 'Public page' : 'Public page (offline until you publish)'}
          </span>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <span data-testid="public-url" className="text-sm font-semibold text-brand-strong break-all flex-1 min-w-0">{url}</span>
            {test.status === 'live' && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={copy} className="flex items-center gap-1.5 bg-white border border-line-soft text-ink px-3 py-2 rounded-input text-xs font-semibold cursor-pointer hover:bg-surface-ghost">
                  {copied ? <Check className="w-3.5 h-3.5 text-brand-x2e7a56" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy link'}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-brand-strong hover:bg-brand-rail text-white px-3 py-2 rounded-input text-xs font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" /> Open page
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {!stats && !statsError ? (
        <div className="flex items-center justify-center gap-2 text-neutral-500 py-10">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading results…</span>
        </div>
      ) : statsError && !stats ? (
        <div className="bg-danger-xfbeae7 border border-danger-xf0c9c2 rounded-card px-4 py-3 text-sm text-danger-deep flex items-center justify-between gap-3">
          Could not load the results.
          <button onClick={() => void refresh()} className="text-xs font-semibold underline cursor-pointer">Retry</button>
        </div>
      ) : stats && banner ? (
        <>
          {banner.kind === 'verdict' ? (
            <div className={`p-4 rounded-modal border flex items-start gap-3 shadow-card ${banner.verdict === 'validated' ? 'bg-neutral-xe6efea border-neutral-xd5e3db' : 'bg-danger-tint border-danger-xf4c7c7'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${banner.verdict === 'validated' ? 'bg-brand-strong text-white' : 'bg-danger-600 text-white'}`}>
                <Check className="w-3.5 h-3.5" />
              </div>
              <p data-testid="signal-banner" className={`text-sm font-bold ${banner.verdict === 'validated' ? 'text-brand-strong' : 'text-danger-text'}`}>{banner.text}</p>
            </div>
          ) : (
            <div className="p-4 rounded-modal border bg-surface-ghost border-line-soft flex items-start gap-3 shadow-card">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-ink-subtle text-white font-bold text-xs">i</div>
              <p data-testid="signal-banner" className="text-sm font-bold text-ink">{banner.text}</p>
            </div>
          )}

          <div className="bg-white rounded-modal border border-line-soft shadow-card p-5 md:p-8 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-ink">Funnel</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={TILE}><span className="text-[11px] font-bold text-ink-soft uppercase">Visitors</span><span className="text-2xl font-display font-bold text-brand-strong">{stats.visits}</span></div>
              <div className={TILE}><span className="text-[11px] font-bold text-ink-soft uppercase">Signups</span><span className="text-2xl font-display font-bold text-brand-strong">{stats.signups}</span></div>
              <div className={TILE}><span className="text-[11px] font-bold text-ink-soft uppercase">CTA clicks</span><span className="text-2xl font-display font-bold text-brand-strong">{stats.cta_clicks}</span></div>
              <div className={TILE}><span className="text-[11px] font-bold text-ink-soft uppercase">Preorder clicks</span><span className="text-2xl font-display font-bold text-brand-strong">{stats.preorder_clicks}</span></div>
            </div>
            <p className="text-sm text-ink-muted">
              Conversion: <span className="font-bold text-ink">{stats.conversion}%</span> against your {stats.target_conversion}% bar
            </p>

            {!hosted && (
              <div className="border-t border-line-soft pt-6">
                <h4 className="text-sm font-bold text-ink">Record your numbers</h4>
                <p className="text-xs text-ink-muted mt-1 mb-3">For a page you host yourself. These add to the visits and signups counted here.</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="sr-visits" className="text-[11px] font-bold text-ink-soft uppercase">Visits</label>
                    <input id="sr-visits" type="number" min={0} value={visitsInput} onChange={(e) => setVisitsInput(e.target.value)} placeholder={String(test.manualVisits)} className="w-28 bg-surface-subtle border border-line-soft rounded-input px-3 py-2 text-sm outline-none focus:border-brand-strong" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="sr-signups" className="text-[11px] font-bold text-ink-soft uppercase">Signups</label>
                    <input id="sr-signups" type="number" min={0} value={signupsInput} onChange={(e) => setSignupsInput(e.target.value)} placeholder={String(test.manualSignups)} className="w-28 bg-surface-subtle border border-line-soft rounded-input px-3 py-2 text-sm outline-none focus:border-brand-strong" />
                  </div>
                  <button onClick={saveMetrics} disabled={savingMetrics} className="bg-brand-strong hover:bg-brand-rail text-white px-4 py-2 rounded-card font-bold text-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer">
                    {savingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {hosted && (
            <div className="bg-white rounded-modal border border-line-soft shadow-card p-5 md:p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">Waitlist{signups ? ` (${signups.length})` : ''}</h3>
                <button onClick={downloadCsv} disabled={!signups || signups.length === 0} className="flex items-center gap-1.5 border border-brand-strong text-brand-strong hover:bg-neutral-xe6efea disabled:opacity-50 px-3 py-2 rounded-card text-xs font-bold cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
              </div>
              {signups === null ? (
                <div className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading the waitlist…</div>
              ) : signups.length === 0 ? (
                <p className="text-sm text-ink-muted">No signups yet. Share the page link to start collecting emails.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[320px]">
                    <thead>
                      <tr className="border-b border-line-soft text-[11px] uppercase tracking-wider text-ink-soft">
                        <th className="py-2 pr-4 font-bold">Email</th>
                        <th className="py-2 font-bold">Signed up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-faint">
                      {signups.map((s) => (
                        <tr key={`${s.email}-${s.signed_up_at}`}>
                          <td className="py-2 pr-4 text-ink break-all">{s.email}</td>
                          <td className="py-2 text-ink-muted whitespace-nowrap">{new Date(s.signed_up_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
