"use client";

import React, { useId, useState } from "react";
import { useSalesAnalytics } from "@/hooks/useSalesCoach";
import {
  formatCycle,
  formatMoney,
  presetRange,
  rangeError,
  type SalesAnalytics,
} from "@/lib/api/sales";
import { CARD, EmptyState, INPUT, SalesGate } from "@/components/sales/shared";
import { BTN_SECONDARY } from "@/components/sales/shared";
import { RevenueChart, WinLossDonut } from "@/components/sales/analytics-charts";

type Preset = "7" | "30" | "90" | "365" | "custom";
const PRESETS: { value: Preset; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "custom", label: "Custom range" },
];

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={`${CARD} p-5 space-y-1`}>
      <span className="text-[11px] font-bold text-sage-600 uppercase tracking-wider block">{label}</span>
      <div className="text-xl md:text-3xl font-display font-bold text-sage-900 whitespace-nowrap">{value}</div>
      {note && <p className="text-xs text-sage-600">{note}</p>}
    </div>
  );
}

function Funnel({ funnel }: { funnel: SalesAnalytics["funnel"] }) {
  if (funnel.deals_created === 0) {
    return <p className="text-sm text-sage-600">No deals were created in this period, so there is no funnel to show. Try a longer range.</p>;
  }
  return (
    <ol className="space-y-5">
      {funnel.stages.map((s) => (
        <li key={s.stage_id} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-sage-700">
            <span className="truncate">{s.name}</span>
            <span className="shrink-0">
              <span className="font-bold text-sage-900 tabular-nums">{s.reached}</span>
              {s.conversion_from_previous_pct !== null && (
                <span className="text-sage-600"> · {s.conversion_from_previous_pct}% of the stage before</span>
              )}
            </span>
          </div>
          <div className="w-full bg-green-900/10 rounded-full h-3 overflow-hidden" aria-hidden="true">
            <div className="bg-[#1e4836] h-full rounded-full" style={{ width: `${Math.round((s.reached / funnel.deals_created) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Leaderboard({ rows }: { rows: SalesAnalytics["leaderboard"] }) {
  const anyActivity = rows.some((r) => r.total > 0);
  return (
    <section aria-label="Activity leaderboard" className={`${CARD} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-sage-200 bg-sage-50/50">
        <h3 className="text-sm font-bold text-sage-900">Activity leaderboard</h3>
        <p className="text-xs text-sage-600">Calls, emails, meetings and notes logged by each founder and team member in this period.</p>
      </div>
      {!anyActivity && <p className="px-6 py-4 text-sm text-sage-600">No activity was logged in this period.</p>}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-sage-200 text-[11px] font-bold text-sage-600 uppercase tracking-wider">
              <th scope="col" className="py-3 px-6">Member</th>
              <th scope="col" className="py-3 px-4 text-right">Calls</th>
              <th scope="col" className="py-3 px-4 text-right">Emails</th>
              <th scope="col" className="py-3 px-4 text-right">Meetings</th>
              <th scope="col" className="py-3 px-4 text-right">Notes</th>
              <th scope="col" className="py-3 px-6 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-100 text-sm">
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td className="py-3 px-6 font-medium text-sage-900 max-w-[16rem] truncate">{r.name}</td>
                <td className="py-3 px-4 text-right tabular-nums text-sage-700">{r.calls}</td>
                <td className="py-3 px-4 text-right tabular-nums text-sage-700">{r.emails}</td>
                <td className="py-3 px-4 text-right tabular-nums text-sage-700">{r.meetings}</td>
                <td className="py-3 px-4 text-right tabular-nums text-sage-700">{r.notes}</td>
                <td className="py-3 px-6 text-right tabular-nums font-bold text-sage-900">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const ids = useId();
  const [preset, setPreset] = useState<Preset>("30");
  const [applied, setApplied] = useState(() => presetRange(30));
  const [draft, setDraft] = useState(() => presetRange(30));
  const [customError, setCustomError] = useState<string | null>(null);
  const { data, status, error, reload } = useSalesAnalytics(applied);

  const pickPreset = (next: Preset) => {
    setPreset(next);
    setCustomError(null);
    if (next !== "custom") setApplied(presetRange(Number(next)));
  };
  const applyCustom = () => {
    const problem = rangeError(draft.from, draft.to);
    setCustomError(problem);
    if (!problem) setApplied({ from: draft.from, to: draft.to });
  };

  const revenueEmpty = data?.monthly_revenue.every((m) => m.value_minor === 0) ?? true;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-sage-900">Sales analytics</h1>
          {data && (
            <p className="text-sm text-sage-600 mt-0.5">
              {data.from} to {data.to}, in UTC days, both included.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor={`${ids}-range`} className="sr-only">Date range</label>
            <select
              id={`${ids}-range`}
              value={preset}
              onChange={(e) => pickPreset(e.target.value as Preset)}
              className="bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm font-semibold text-sage-900 outline-none focus:border-sage-400 shadow-card"
            >
              {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {preset === "custom" && (
            <>
              <div className="space-y-1">
                <label htmlFor={`${ids}-from`} className="text-[11px] font-bold text-sage-600 uppercase tracking-wider block">From</label>
                <input id={`${ids}-from`} type="date" className={INPUT} value={draft.from} max={draft.to} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${ids}-to`} className="text-[11px] font-bold text-sage-600 uppercase tracking-wider block">To</label>
                <input id={`${ids}-to`} type="date" className={INPUT} value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
              </div>
              <button type="button" onClick={applyCustom} className={BTN_SECONDARY}>Apply range</button>
            </>
          )}
        </div>
      </div>
      {customError && <p role="alert" className="text-sm text-red-700">{customError}</p>}

      <SalesGate status={status} error={error} onRetry={() => void reload()} loadingLabel="Loading your analytics">
        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Tile label="Deals created" value={String(data.funnel.deals_created)} note="In this period" />
              <Tile
                label="Closed won"
                value={formatMoney(data.won.value_minor)}
                note={`${data.won.count} ${data.won.count === 1 ? "deal" : "deals"} closed in this period`}
              />
              <Tile
                label="Win rate"
                value={data.win_loss.win_rate_pct === null ? "None yet" : `${data.win_loss.win_rate_pct}%`}
                note={`${data.win_loss.won} won, ${data.win_loss.lost} lost`}
              />
              <Tile label="Avg cycle length" value={formatCycle(data.avg_cycle_days)} note="Created to won, for deals won in this period" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section aria-label="Funnel by stage" className={`lg:col-span-7 ${CARD} p-6 md:p-8 space-y-6`}>
                <div>
                  <h3 className="text-sm font-bold text-sage-900">Funnel by stage</h3>
                  <p className="text-xs text-sage-600 mt-0.5">
                    Deals created in this period, and how many reached each stage or any stage after it.
                  </p>
                </div>
                <Funnel funnel={data.funnel} />
              </section>

              <section aria-label="Win and loss reasons" className={`lg:col-span-5 ${CARD} p-6 md:p-8 space-y-6`}>
                <div>
                  <h3 className="text-sm font-bold text-sage-900">Win / loss reasons</h3>
                  <p className="text-xs text-sage-600 mt-0.5">Deals closed in this period.</p>
                </div>
                <WinLossDonut winLoss={data.win_loss} />
              </section>
            </div>

            <Leaderboard rows={data.leaderboard} />

            <section aria-label="Closed-won revenue by month" className={`${CARD} p-6 md:p-8 space-y-4`}>
              <div>
                <h3 className="text-sm font-bold text-sage-900">Closed-won revenue, last 12 months</h3>
                <p className="text-xs text-sage-600 mt-0.5">By month the deal closed. This chart does not follow the date range above.</p>
              </div>
              {revenueEmpty ? (
                <EmptyState title="No closed-won revenue yet" body="Move a deal to Closed Won on the Pipeline and it appears here, in the month it closed." />
              ) : (
                <RevenueChart months={data.monthly_revenue} />
              )}
            </section>
          </>
        )}
      </SalesGate>
    </div>
  );
}
