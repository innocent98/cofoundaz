"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, Download, Loader2, RefreshCw, Settings2, Sparkles } from "lucide-react";
import { useFinancialModel } from "@/hooks/useFinancialModel";
import { recalculateModel, toFinanceError, type FinancialModel, type ModelRow, type ModelStatement } from "@/lib/api/finance";
import { formatDate, formatMajor, formatMoney, formatMonth } from "@/lib/finance/format";
import { applyRevenueSensitivity, modelToCsv } from "@/lib/finance/model";
import { useToast } from "../ToastContext";
import { ModelChart, type ModelChartPoint } from "../_components/charts";
import { ConfirmDialog, ErrorBlock, ForbiddenBlock, LoadingBlock, PageHeader, darkBtn, primaryBtn, secondaryBtn } from "../_components/ui";
import { ModelEditor } from "./ModelEditor";

type Tab = "pnl" | "cashflow" | "balancesheet";
type View = "monthly" | "yearly";

const TABS: { key: Tab; label: string }[] = [
  { key: "pnl", label: "P&L" },
  { key: "cashflow", label: "Cash Flow" },
  { key: "balancesheet", label: "Balance Sheet" },
];

const TOTAL_ROWS = new Set(["Gross profit", "Net income", "Closing cash", "Total assets", "Total liabilities", "Total equity", "Total liabilities + equity"]);

function statementOf(model: FinancialModel, tab: Tab, view: View): ModelStatement | null {
  const src = view === "yearly" && model.yearly ? model.yearly : model;
  return tab === "pnl" ? src.pnl : tab === "cashflow" ? src.cash_flow : src.balance_sheet;
}

const valuesOf = (rows: ModelRow[] | undefined, label: string): number[] => rows?.find((r) => r.label === label)?.values ?? [];

function chartPoints(model: FinancialModel, view: View): ModelChartPoint[] {
  const yearly = view === "yearly" && model.yearly;
  const src = yearly ? model.yearly! : model;
  const labels = yearly ? model.yearly!.periods.map((p) => p.label) : (model.months ?? []).map(formatMonth);
  const revenue = valuesOf(src.pnl?.rows, "Revenue");
  const net = valuesOf(src.pnl?.rows, "Net income");
  const cash = valuesOf(src.cash_flow?.rows, "Closing cash");
  return labels.map((label, i) => ({ label, revenue: revenue[i] ?? 0, netIncome: net[i] ?? 0, cash: cash[i] ?? 0 }));
}

export default function FinancialModelPage() {
  const { phase, model, error, timedOut, starting, generate, checkAgain, replaceModel } = useFinancialModel();
  const { triggerToast } = useToast();
  const [tab, setTab] = useState<Tab>("pnl");
  const [view, setView] = useState<View>("monthly");
  const [sensitivity, setSensitivity] = useState(0);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);

  const onGenerate = async () => {
    setConfirmRegen(false);
    const res = await generate();
    if (!res.ok) triggerToast(res.message ?? "Couldn't start the model.", "error");
    else if (res.alreadyRunning) triggerToast("A model is already being built. Showing its progress.");
    else triggerToast("Building your model. This can take a little while.");
  };

  const recalcStale = async () => {
    if (!model) return;
    setRecalcBusy(true);
    try {
      replaceModel(await recalculateModel(model.id));
      triggerToast("Recalculated.");
    } catch (err) {
      triggerToast(toFinanceError(err, "Couldn't recalculate. Try again.").message, "error");
    } finally {
      setRecalcBusy(false);
    }
  };

  const exportCsv = () => {
    if (!model) return;
    const blob = new Blob([modelToCsv(model, view === "yearly")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-model-${view}-${model.generated_at?.slice(0, 10) ?? "export"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    triggerToast("Model exported as CSV.");
  };

  const points = useMemo(() => (model && model.months ? chartPoints(model, view) : []), [model, view]);

  const header = (
    <PageHeader title="Financial model" subtitle="An editable 36 month projection built from your actual transactions." />
  );

  if (phase === "forbidden") {
    return (
      <div className="space-y-6 animate-fadeIn">
        {header}
        <ForbiddenBlock />
      </div>
    );
  }

  const generateCta = (label: string) => (
    <button type="button" onClick={() => void onGenerate()} disabled={starting} className={`${darkBtn} px-6 py-3`}>
      {starting ? "Starting" : label}
    </button>
  );

  const checkOk = model?.balance_check?.balanced === true;
  const yearlyOk = view === "monthly" || model?.yearly;

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}

      {phase === "loading" && <LoadingBlock label="Loading your model" />}

      {phase === "error" && <ErrorBlock message={error ?? "Couldn't load your financial model."} onRetry={() => void checkAgain()} />}

      {phase === "none" && (
        <div className="bg-white rounded-modal border border-neutral-200 p-12 shadow-card flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-accent-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Build my 3-statement model</h2>
          <p className="text-sm text-neutral-500 mb-8 max-w-md">
            We take your last three months of transactions, ask the AI for growth and cost assumptions, and compute a 36 month P&amp;L, cash flow and balance sheet. You can then edit every assumption and recalculate without the AI. Add transactions first for a meaningful result.
          </p>
          {generateCta("Build my 3-statement model")}
        </div>
      )}

      {phase === "generating" && (
        <div role="status" aria-live="polite" className="bg-white rounded-modal border border-neutral-200 p-12 shadow-card flex flex-col items-center justify-center text-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-600" aria-hidden="true" />
          <h2 className="text-xl font-display font-bold text-neutral-900">Building your model</h2>
          {timedOut ? (
            <>
              <p className="text-sm text-neutral-500 max-w-md">This is taking longer than usual. It is still running on our side, so you can check again in a moment.</p>
              <button type="button" onClick={() => void checkAgain()} className={secondaryBtn}>
                Check again
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-500 max-w-md">Analyzing your actuals and choosing assumptions. This page updates by itself.</p>
          )}
        </div>
      )}

      {phase === "failed" && (
        <div role="alert" className="bg-danger-50 border border-danger-200 rounded-modal p-8 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="w-6 h-6 text-danger-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-danger-700">The model could not be built</h2>
          <p className="text-sm text-danger-600">{model?.error ?? "Something went wrong while generating."}</p>
          <button type="button" onClick={() => void onGenerate()} disabled={starting} className={primaryBtn}>
            {starting ? "Starting" : "Regenerate"}
          </button>
        </div>
      )}

      {phase === "complete" && model && model.months && (
        <>
          {model.stale && (
            <div role="status" className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-accent-100/70 border border-accent-200 rounded-card p-4">
              <p className="text-sm font-semibold text-accent-700">Edited, not yet recalculated. The tables and chart below do not include your latest edits.</p>
              <button type="button" className={darkBtn} disabled={recalcBusy} onClick={() => void recalcStale()}>
                <RefreshCw className={`w-4 h-4 ${recalcBusy ? "animate-spin" : ""}`} aria-hidden="true" /> {recalcBusy ? "Recalculating" : "Recalculate"}
              </button>
            </div>
          )}

          {model.balance_check && !model.balance_check.balanced && (
            <p role="alert" className="text-sm font-semibold text-danger-700 bg-danger-50 border border-danger-200 rounded-card p-4">
              The balance sheet does not balance by {formatMoney(model.balance_check.max_abs_difference_minor, model.currency)}. Do not rely on this model until it is fixed.
            </p>
          )}

          {model.balance_check === null && (
            <p role="note" className="text-xs text-neutral-600 bg-white border border-neutral-200 rounded-card p-3">
              This model was built before the balance check existed. Recalculate to upgrade it to 36 months with a balance check.
            </p>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-neutral-200/60 p-1 rounded-card w-fit border border-neutral-300/50" role="tablist" aria-label="Statements">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-1.5 max-md:min-h-11 rounded-input text-sm font-medium transition-all ${tab === t.key ? "bg-white text-neutral-900 shadow-card font-semibold" : "text-neutral-600 hover:text-neutral-900"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-200/60 p-1 rounded-card w-fit border border-neutral-300/50" role="group" aria-label="Period">
                {(["monthly", "yearly"] as View[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    disabled={v === "yearly" && !model.yearly}
                    onClick={() => setView(v)}
                    className={`px-4 py-1.5 max-md:min-h-11 rounded-input text-sm font-medium transition-all disabled:opacity-50 ${view === v ? "bg-white text-neutral-900 shadow-card font-semibold" : "text-neutral-600 hover:text-neutral-900"}`}
                  >
                    {v === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setConfirmRegen(true)} disabled={starting} className={secondaryBtn}>
                <Sparkles className="w-4 h-4" aria-hidden="true" /> {starting ? "Starting" : "Regenerate"}
              </button>
              <button type="button" onClick={exportCsv} disabled={!yearlyOk} className={secondaryBtn}>
                <Download className="w-4 h-4" aria-hidden="true" /> Export CSV
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            AI-built from your actuals and assumptions: investor-grade structure, your numbers. Projection generated {formatDate(model.generated_at)}
            {model.recalculated_at ? `, recalculated ${formatDate(model.recalculated_at)}` : ""}. An estimate, not a guarantee and not financial advice. Negative cash means the plan runs out of money. Amounts in {model.currency}.
          </p>

          <div className="bg-white rounded-modal border border-neutral-200 p-6 shadow-card space-y-3">
            <h2 className="font-bold text-neutral-900">Revenue, net income and cash ({view === "monthly" ? "monthly" : "yearly"})</h2>
            <ModelChart points={points} currency={model.currency} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 min-w-0 bg-white rounded-modal border border-neutral-200/90 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                {TABS.filter((t) => t.key === tab).map((t) => {
                  const statement = statementOf(model, t.key, view);
                  const rows = statement ? (t.key === "pnl" ? applyRevenueSensitivity(statement.rows, sensitivity) : statement.rows) : [];
                  const columns =
                    view === "yearly" && model.yearly
                      ? model.yearly.periods.map((p) => ({ key: p.label, label: p.label, title: `${formatMonth(p.start_month)} to ${formatMonth(p.end_month)}` }))
                      : model.months!.map((mo) => ({ key: mo, label: formatMonth(mo), title: mo }));
                  return (
                    <table key={t.key} className="w-full text-left border-collapse">
                      <caption className="sr-only">
                        {t.label}, {view}
                      </caption>
                      <thead>
                        <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-600 uppercase tracking-wider bg-neutral-50/50">
                          <th className="py-4 px-6 font-semibold sticky left-0 bg-neutral-50 z-10 whitespace-nowrap">{t.label}</th>
                          {columns.map((c) => (
                            <th key={c.key} title={c.title} className="py-4 px-3 font-semibold text-right whitespace-nowrap">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-sm">
                        {rows.map((r) => {
                          const isCheck = r.label === "Balance check";
                          return (
                            <tr key={r.label} className="hover:bg-neutral-50/60 transition-colors">
                              <td className={`py-3 px-6 text-neutral-900 whitespace-nowrap sticky left-0 bg-white z-10 ${TOTAL_ROWS.has(r.label) ? "font-bold" : "font-medium"}`}>{r.label}</td>
                              {r.values.map((v, i) => (
                                <td
                                  key={i}
                                  className={`py-3 px-3 text-right whitespace-nowrap ${
                                    isCheck ? (v === 0 ? "text-brand-800 font-semibold" : "text-danger-600 font-bold") : v < 0 ? "text-danger-600 font-semibold" : "text-neutral-600"
                                  } ${TOTAL_ROWS.has(r.label) ? "font-bold" : ""}`}
                                >
                                  {formatMajor(v)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })}
              </div>
              {tab === "balancesheet" && model.balance_check && (
                <p className={`flex items-center gap-1.5 text-xs font-semibold px-6 py-3 border-t border-neutral-100 ${checkOk ? "text-brand-800" : "text-danger-600"}`}>
                  {checkOk && <Check className="w-4 h-4" aria-hidden="true" />}
                  {checkOk ? "Balance check: assets equal liabilities plus equity in every period." : "Balance check failed in at least one period."}
                </p>
              )}
              <p className="text-xs text-neutral-500 px-6 py-3 border-t border-neutral-100">
                Paid-in capital is the money you recorded under the category Funding. A raise recorded under another category shows up in retained earnings instead.
              </p>
            </div>

            <div className="xl:col-span-4 space-y-6 min-w-0">
              {model.assumptions && <ModelEditor key={`${model.id}:${model.recalculated_at}:${JSON.stringify(model.overrides)}`} model={model} assumptions={model.assumptions} onModel={replaceModel} />}

              {model.assumptions?.narrative && (
                <div className="bg-white rounded-modal border border-neutral-200 p-6 shadow-card space-y-2">
                  <h2 className="font-bold text-neutral-900 border-b border-neutral-100 pb-3">AI note</h2>
                  <p className="text-xs text-neutral-600">{model.assumptions.narrative}</p>
                </div>
              )}

              {tab === "pnl" && (
                <div className="bg-white rounded-modal border border-neutral-200 p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Settings2 className="w-4 h-4 text-neutral-500" aria-hidden="true" />
                    <h2 className="font-bold text-neutral-900">Sensitivity</h2>
                  </div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="sens" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Revenue adjustment
                    </label>
                    <span className={`text-sm font-bold ${sensitivity > 0 ? "text-brand-600" : sensitivity < 0 ? "text-danger-600" : "text-neutral-900"}`}>
                      {sensitivity > 0 ? "+" : ""}
                      {sensitivity}%
                    </span>
                  </div>
                  <input id="sens" type="range" min={-20} max={20} step={5} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className="w-full accent-accent-600 max-md:min-h-11" />
                  <p className="text-xs text-neutral-500">Adjusts revenue and COGS on the P&amp;L view only. Cash flow, the balance sheet and the chart stay as calculated.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {confirmRegen && (
        <ConfirmDialog
          title="Regenerate with the AI?"
          body="This asks the AI for fresh assumptions and builds a new model from your latest numbers. It uses your workspace's AI budget. To change assumptions yourself, edit them and use Recalculate instead, which is instant and free."
          confirmLabel="Regenerate"
          busy={starting}
          onConfirm={() => void onGenerate()}
          onCancel={() => setConfirmRegen(false)}
        />
      )}
    </div>
  );
}
