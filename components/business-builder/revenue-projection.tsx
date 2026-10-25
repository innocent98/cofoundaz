'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2, Send } from 'lucide-react';
import { businessBuilderApi, type RevenueProjection } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { PROJECTION_MONTHS, chartRows, formatNaira, parseGrowth } from '@/lib/bb-revenue';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';

const COLORS = ['var(--color-brand-strong)', 'var(--color-accent-600)', 'var(--color-brand-x3b7a57)', 'var(--color-accent-xc08457)', 'var(--color-brand-x75b29b)', 'var(--color-line-focus)'];

/**
 * The projected revenue chart (month 1 is each stream's est. monthly, compounding
 * at the growth rate) and "Send to financial model". `refreshKey` changes when the
 * streams do, so the chart follows edits.
 */
export function RevenueProjectionCard({ refreshKey, hasStreams }: { refreshKey: string; hasStreams: boolean }) {
  const router = useRouter();
  const { canEdit } = useBuilderAccess();
  const [months, setMonths] = useState<number>(12);
  const [growth, setGrowth] = useState<string>('');
  const [applied, setApplied] = useState<number | undefined>(undefined);
  const [data, setData] = useState<RevenueProjection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasStreams) return;
    let alive = true;
    void (async () => {
      try {
        const p = await businessBuilderApi.getRevenueProjection(months, applied);
        if (!alive) return;
        setData(p);
        setError(null);
        // Prefill the input with the rate the server used the first time.
        setGrowth((g) => (g === '' ? String(p.growth_pct) : g));
      } catch (err) {
        if (alive) setError(apiErrorInfo(err, 'Could not load the projection.').message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [months, applied, refreshKey, hasStreams]);

  if (!hasStreams) return null;

  const parsed = parseGrowth(growth);
  const growthInvalid = growth.trim() !== '' && parsed === null;

  const send = async () => {
    setSending(true);
    setSendError(null);
    try {
      await businessBuilderApi.sendRevenueToFinance();
      setConfirmSend(false);
      toast.success('Sent to your financial model', {
        duration: 8000,
        action: { label: 'Open financial model', onClick: () => router.push('/finance/model') },
      });
    } catch (err) {
      setSendError(apiErrorInfo(err, 'Could not send to your financial model.').message);
    } finally {
      setSending(false);
    }
  };

  const rows = data ? chartRows(data) : [];

  return (
    <section aria-labelledby="projection-title" className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="projection-title" className="text-sm font-bold text-ink">Projected revenue</h3>
          <p className="text-xs text-ink-soft mt-0.5">Each stream starts at its monthly estimate and grows at the rate you set.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[11px] font-bold tracking-wider text-ink-soft uppercase">
            Growth per month (%)
            <input
              inputMode="decimal"
              value={growth}
              onChange={(e) => setGrowth(e.target.value)}
              onBlur={() => parsed !== null && setApplied(parsed)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && parsed !== null) setApplied(parsed);
              }}
              aria-invalid={growthInvalid}
              className="w-28 border border-line-strong rounded-input px-3 py-2 text-xs normal-case tracking-normal text-ink focus:outline-none focus:border-line-focus"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold tracking-wider text-ink-soft uppercase">
            Months
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="border border-line-strong rounded-input px-3 py-2 text-xs normal-case tracking-normal text-ink bg-white focus:outline-none focus:border-line-focus">
              {PROJECTION_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
      </div>
      {growthInvalid && <p role="alert" className="text-[11px] font-semibold text-danger-600">Growth must be between -50 and 100.</p>}
      {error && <p role="alert" className="text-xs font-semibold text-danger-600">{error}</p>}

      <div className="h-64 w-full" role="img" aria-label={data ? `Projected revenue over ${data.months.length} months, reaching ${formatNaira(data.total[data.total.length - 1] ?? 0)} a month` : 'Projected revenue chart'}>
        {data ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line-soft)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-ink-soft)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-soft)' }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatNaira(v)} />
              <Tooltip formatter={(v) => formatNaira(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-line-soft)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.streams.map((s, i) => (
                <Area key={s.id} type="monotone" stackId="rev" dataKey={s.id} name={s.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.25} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-card bg-surface-ghost animate-pulse" />
        )}
      </div>

      {data && (
        <p className="text-xs text-ink-body">
          Month {data.months.length}: <span className="font-bold text-brand-strong">{formatNaira(data.total[data.total.length - 1] ?? 0)}</span> a month, from{' '}
          <span className="font-bold">{formatNaira(data.total[0] ?? 0)}</span> today.
        </p>
      )}

      {canEdit && (
        <div className="border-t border-line-soft pt-4 flex flex-col gap-2">
          {confirmSend ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-ink-body">This replaces what you sent before. Real transactions still win in your model.</span>
              <button type="button" onClick={send} disabled={sending} className="flex items-center gap-1.5 px-4 py-2 bg-brand-strong hover:bg-brand-rail-ink disabled:opacity-60 text-white rounded-card text-xs font-bold">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {sending ? 'Sending' : 'Yes, send it'}
              </button>
              <button type="button" onClick={() => setConfirmSend(false)} className="px-4 py-2 bg-white border border-neutral-xdcdcd6 rounded-card text-xs font-bold">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmSend(true)} className="self-start flex items-center gap-1.5 px-4 py-2.5 bg-brand-strong hover:bg-brand-rail-ink text-white rounded-card text-xs font-bold shadow-card">
              <Send className="w-3.5 h-3.5" /> Send to financial model
            </button>
          )}
          {sendError && <p role="alert" className="text-[11px] font-semibold text-danger-600">{sendError}</p>}
        </div>
      )}
    </section>
  );
}
