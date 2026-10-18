"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, LineChart, Plus } from "lucide-react";
import { useCashFlow, useRunway } from "@/hooks/useFinanceApi";
import { saveRunwayAssumptions, type FinanceError, type Runway, type RunwayScenario, type RunwayScenarioKey } from "@/lib/api/finance";
import { formatMoney, formatMonth, minorToThousands, shortMonth, thousandsToMinor } from "@/lib/finance/format";
import {
  EmptyBlock,
  Field,
  FormError,
  ForbiddenBlock,
  PageHeader,
  ResourceGate,
  darkBtn,
  inputCls,
  primaryBtn,
} from "../_components/ui";
import { useFinanceAction } from "../_components/useFinanceAction";

const SCENARIOS: { key: RunwayScenarioKey; label: string; stroke: string }[] = [
  { key: "base", label: "Base", stroke: "var(--color-green-900)" },
  { key: "best", label: "Best", stroke: "var(--color-copper-600)" },
  { key: "worst", label: "Worst", stroke: "var(--color-red-600)" },
];

function headline(s: RunwayScenario, horizon: number): { value: string; sub: string; critical: boolean } {
  // null and 0 are opposites: test both explicitly, never with a falsy check.
  if (s.runway_months === null) {
    return { value: `${horizon}+ months`, sub: `Cash stays above zero for the whole ${horizon} month projection.`, critical: false };
  }
  if (s.runway_months === 0) {
    return { value: "Out of cash", sub: "This scenario has no cash left now.", critical: true };
  }
  return {
    value: `${s.runway_months} months`,
    sub: s.cash_out_date ? `Cash runs out in ${formatMonth(s.cash_out_date)}.` : "Cash runs out inside the projection.",
    critical: s.runway_months < 6,
  };
}

function ProjectionChart({ runway, selected }: { runway: Runway; selected: RunwayScenarioKey }) {
  const all = SCENARIOS.flatMap((s) => runway.scenarios[s.key].by_month.map((p) => p.cash_balance));
  const min = Math.min(0, ...all);
  const max = Math.max(0, ...all);
  const span = max - min || 1;
  const n = runway.scenarios[selected].by_month.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - ((v - min) / span) * 100;
  const zeroY = y(0);
  const months = runway.scenarios[selected].by_month;

  return (
    <div className="space-y-2">
      <div className="relative min-h-[250px] h-[250px] border-l border-b border-sage-200">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100" role="img" aria-label="Projected cash balance for the base, best and worst scenarios">
          <line x1="0" x2="100" y1={zeroY} y2={zeroY} stroke="var(--color-red-200)" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {SCENARIOS.map((s) => (
            <polyline
              key={s.key}
              fill="none"
              stroke={s.stroke}
              strokeWidth={s.key === selected ? 2.5 : 1.5}
              strokeOpacity={s.key === selected ? 1 : 0.35}
              vectorEffect="non-scaling-stroke"
              points={runway.scenarios[s.key].by_month.map((p, i) => `${x(i)},${y(p.cash_balance)}`).join(" ")}
            />
          ))}
        </svg>
        <span className="absolute right-2 text-[10px] text-red-600 font-bold bg-white px-1 -translate-y-1/2" style={{ top: `${zeroY}%` }}>
          Zero cash
        </span>
      </div>
      <div className="flex justify-between text-[10px] font-medium text-sage-400">
        <span>{months[0] ? shortMonth(months[0].month) : ""}</span>
        <span>{months[n - 1] ? shortMonth(months[n - 1].month) : ""}</span>
      </div>
      <div className="flex items-center gap-4 text-xs font-medium text-sage-600 justify-center">
        {SCENARIOS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-input" style={{ background: s.stroke }}></span>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function AssumptionsPanel({
  runway,
  onSaved,
}: {
  runway: Runway;
  onSaved: (next: Runway) => void;
}) {
  const a = runway.assumptions;
  const [growth, setGrowth] = useState(String(a.mom_growth_percent));
  const [hiring, setHiring] = useState(String(minorToThousands(a.hiring_spend_minor)));
  const [oneOff, setOneOff] = useState(String(minorToThousands(a.one_off_costs_minor)));
  const [error, setError] = useState<FinanceError | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { run, busy } = useFinanceAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = Number(growth);
    const h = Number(hiring);
    const o = Number(oneOff);
    if (![g, h, o].every((v) => Number.isFinite(v) && v >= 0) || growth.trim() === "" || hiring.trim() === "" || oneOff.trim() === "") {
      return setLocalError("Enter zero or a positive number in every field.");
    }
    if (!Number.isInteger(g) || g > 1000) return setLocalError("Growth must be a whole number from 0 to 1000.");
    setLocalError(null);
    setError(null);
    // The screen speaks NGN thousands; the API wants kobo.
    const res = await run(
      () =>
        saveRunwayAssumptions({
          mom_growth_percent: g,
          hiring_spend_minor: thousandsToMinor(h),
          one_off_costs_minor: thousandsToMinor(o),
        }),
      { success: "Assumptions saved. Scenarios updated.", quiet: true },
    );
    if (res.ok) onSaved(res.data);
    else setError(res.error);
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="lg:col-span-4 bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-5">
      <h2 className="font-bold text-sage-900 border-b border-sage-100 pb-3">Assumptions</h2>
      <p className="text-xs text-sage-500">Saved for this workspace. Best and worst cases are fixed offsets from these.</p>
      <Field label="MoM growth %" htmlFor="rw-growth" error={error?.fieldErrors.mom_growth_percent}>
        <input id="rw-growth" type="number" min={0} max={1000} step={1} className={inputCls} value={growth} onChange={(e) => setGrowth(e.target.value)} />
      </Field>
      <Field label="Hiring spend (NGN thousands per month)" htmlFor="rw-hiring" error={error?.fieldErrors.hiring_spend_minor} hint="20 means 20,000 naira.">
        <input id="rw-hiring" type="number" min={0} step="any" className={inputCls} value={hiring} onChange={(e) => setHiring(e.target.value)} />
      </Field>
      <Field label="One-off costs (NGN thousands)" htmlFor="rw-oneoff" error={error?.fieldErrors.one_off_costs_minor} hint="50 means 50,000 naira.">
        <input id="rw-oneoff" type="number" min={0} step="any" className={inputCls} value={oneOff} onChange={(e) => setOneOff(e.target.value)} />
      </Field>
      <FormError message={localError ?? (error && !Object.keys(error.fieldErrors).length ? error.message : null)} />
      <button type="submit" className={`${darkBtn} w-full`} disabled={busy}>
        {busy ? "Saving" : "Save assumptions"}
      </button>
    </form>
  );
}

export default function RunwayPage() {
  const runway = useRunway();
  const cashFlow = useCashFlow();
  const [scenario, setScenario] = useState<RunwayScenarioKey>("base");

  const header = <PageHeader title="Runway & Scenarios" subtitle="Model your cash runway under different growth and hiring assumptions." />;

  if (runway.status === "forbidden") {
    return (
      <div className="space-y-6 animate-fadeIn">
        {header}
        <ForbiddenBlock />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}
      <ResourceGate resource={runway} loadingLabel="Loading runway">
        {(rw) => {
          const b = rw.baseline;
          // An empty workspace reads as "out of cash" (cash 0 means runway 0), so detect it first.
          const noData = b.cash_on_hand === 0 && b.monthly_revenue === 0 && b.monthly_burn === 0;
          if (noData) {
            return (
              <EmptyBlock
                icon={<LineChart className="w-6 h-6" aria-hidden="true" />}
                title="No cash data yet"
                body="Runway is projected from your transactions. Add your first transaction and the scenarios will appear here."
              >
                <Link href="/finance" className={primaryBtn}>
                  <Plus className="w-4 h-4" aria-hidden="true" /> Add a transaction
                </Link>
              </EmptyBlock>
            );
          }
          const s = rw.scenarios[scenario];
          const h = headline(s, rw.horizon_months);
          return (
            <>
              {cashFlow.data?.runway_low && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center gap-3 shadow-card">
                  <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
                  <p className="text-sm font-bold text-red-600">
                    {cashFlow.data.runway_months === null
                      ? "You are out of cash and still burning."
                      : `Runway is low: ${cashFlow.data.runway_months} months at your current burn.`}
                  </p>
                </div>
              )}

              <div className="bg-white p-6 md:p-8 rounded-modal border border-sage-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3" role="group" aria-label="Scenario">
                    {SCENARIOS.map((sc) => (
                      <button
                        key={sc.key}
                        type="button"
                        aria-pressed={scenario === sc.key}
                        onClick={() => setScenario(sc.key)}
                        className={`px-3 py-1 text-xs font-bold rounded-pill border transition-colors ${
                          scenario === sc.key ? "bg-green-900 text-white border-green-900" : "bg-sage-50 text-sage-600 border-sage-200 hover:bg-sage-100"
                        }`}
                      >
                        {sc.label} case
                      </button>
                    ))}
                  </div>
                  <p className={`text-4xl font-display font-bold mt-2 ${h.critical ? "text-red-600" : "text-sage-900"}`}>{h.value}</p>
                  <p className="text-sm text-sage-500 mt-2 font-medium">{h.sub}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                  <div className="p-4 bg-sage-50 border border-sage-200 rounded-card">
                    <p className="text-xs text-sage-500 font-medium uppercase mb-1">Avg net burn (scenario)</p>
                    <p className="text-xl font-bold text-red-600">{formatMoney(s.avg_net_burn_minor, b.currency)}</p>
                  </div>
                  <div className="p-4 bg-sage-50 border border-sage-200 rounded-card">
                    <p className="text-xs text-sage-500 font-medium uppercase mb-1">Cash on hand now</p>
                    <p className="text-xl font-bold text-sage-900">{formatMoney(b.cash_on_hand, b.currency)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <AssumptionsPanel key={JSON.stringify(rw.assumptions)} runway={rw} onSaved={runway.setData} />

                <div className="lg:col-span-8 bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-4">
                  <h2 className="font-bold text-sage-900 border-b border-sage-100 pb-3">Cash balance projection</h2>
                  <ProjectionChart runway={rw} selected={scenario} />
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-sage-700">Month by month ({SCENARIOS.find((x) => x.key === scenario)?.label} case)</summary>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-left min-w-[420px]">
                        <thead>
                          <tr className="text-xs text-sage-400 uppercase tracking-wider">
                            <th className="py-2 pr-4">Month</th>
                            <th className="py-2 pr-4 text-right">Net</th>
                            <th className="py-2 text-right">Cash balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-100">
                          {s.by_month.map((p) => (
                            <tr key={p.month}>
                              <td className="py-2 pr-4 text-sage-700">{formatMonth(p.month)}</td>
                              <td className="py-2 pr-4 text-right text-sage-600">{formatMoney(p.net, b.currency)}</td>
                              <td className={`py-2 text-right font-semibold ${p.cash_balance < 0 ? "text-red-600" : "text-sage-900"}`}>{formatMoney(p.cash_balance, b.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <p className="text-xs text-sage-500">
                    Based on the last 3 months of your transactions. Money in counts every inflow, including funding rounds, so a recent raise makes revenue look higher than it is.
                  </p>
                </div>
              </div>
            </>
          );
        }}
      </ResourceGate>
    </div>
  );
}
