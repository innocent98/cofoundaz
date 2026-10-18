"use client";

import React, { useState } from "react";
import { AlertTriangle, Download, Loader2, Settings2, Sparkles } from "lucide-react";
import { useFinancialModel } from "@/hooks/useFinancialModel";
import type { FinancialModel, ModelStatement } from "@/lib/api/finance";
import { formatDate, formatMajor, formatMonth } from "@/lib/finance/format";
import { applyRevenueSensitivity, modelToCsv } from "@/lib/finance/model";
import { useToast } from "../ToastContext";
import { ErrorBlock, ForbiddenBlock, LoadingBlock, PageHeader, darkBtn, primaryBtn, secondaryBtn } from "../_components/ui";

type Tab = "pnl" | "cashflow" | "balancesheet";

const TABS: { key: Tab; label: string; statement: (m: FinancialModel) => ModelStatement | null }[] = [
  { key: "pnl", label: "P&L", statement: (m) => m.pnl },
  { key: "cashflow", label: "Cash Flow", statement: (m) => m.cash_flow },
  { key: "balancesheet", label: "Balance Sheet", statement: (m) => m.balance_sheet },
];

const TOTAL_ROWS = new Set(["Gross profit", "Net income", "Closing cash"]);

export default function FinancialModelPage() {
  const { phase, model, error, timedOut, starting, generate, checkAgain } = useFinancialModel();
  const { triggerToast } = useToast();
  const [tab, setTab] = useState<Tab>("pnl");
  const [sensitivity, setSensitivity] = useState(0);

  const onGenerate = async () => {
    const res = await generate();
    if (res.ok) triggerToast("Building your model. This can take a little while.");
    else triggerToast(res.message ?? "Couldn't start the model.", "error");
  };

  const exportCsv = () => {
    if (!model) return;
    const blob = new Blob([modelToCsv(model)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-model-${model.generated_at?.slice(0, 10) ?? "export"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    triggerToast("Model exported as CSV.");
  };

  const header = (
    <div className="space-y-1">
      <PageHeader title="Financial model" subtitle="An AI-assisted 12 month projection built from your actual transactions." />
    </div>
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}

      {phase === "loading" && <LoadingBlock label="Loading your model" />}

      {phase === "error" && <ErrorBlock message={error ?? "Couldn't load your financial model."} onRetry={() => void checkAgain()} />}

      {phase === "none" && (
        <div className="bg-white rounded-modal border border-sage-200 p-12 shadow-card flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-copper-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-display font-bold text-sage-900 mb-2">Build your 3-statement model</h2>
          <p className="text-sm text-sage-500 mb-8 max-w-md">
            We take your last three months of transactions, ask the AI for growth and cost assumptions, and compute a 12 month P&amp;L, cash flow and balance sheet. Add transactions first for a meaningful result.
          </p>
          {generateCta("Generate model")}
        </div>
      )}

      {phase === "generating" && (
        <div role="status" aria-live="polite" className="bg-white rounded-modal border border-sage-200 p-12 shadow-card flex flex-col items-center justify-center text-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-copper-600" aria-hidden="true" />
          <h2 className="text-xl font-display font-bold text-sage-900">Building your model</h2>
          {timedOut ? (
            <>
              <p className="text-sm text-sage-500 max-w-md">This is taking longer than usual. It is still running on our side, so you can check again in a moment.</p>
              <button type="button" onClick={() => void checkAgain()} className={secondaryBtn}>
                Check again
              </button>
            </>
          ) : (
            <p className="text-sm text-sage-500 max-w-md">Analyzing your actuals and choosing assumptions. This page updates by itself.</p>
          )}
        </div>
      )}

      {phase === "failed" && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-modal p-8 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-red-700">The model could not be built</h2>
          <p className="text-sm text-red-600">{model?.error ?? "Something went wrong while generating."}</p>
          <button type="button" onClick={() => void onGenerate()} disabled={starting} className={primaryBtn}>
            {starting ? "Starting" : "Regenerate"}
          </button>
        </div>
      )}

      {phase === "complete" && model && model.months && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-sage-200/60 p-1 rounded-card w-fit border border-sage-300/50" role="tablist" aria-label="Statements">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-1.5 rounded-input text-sm font-medium transition-all ${tab === t.key ? "bg-white text-sage-900 shadow-card font-semibold" : "text-sage-600 hover:text-sage-900"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => void onGenerate()} disabled={starting} className={secondaryBtn}>
                <Sparkles className="w-4 h-4" aria-hidden="true" /> {starting ? "Starting" : "Regenerate"}
              </button>
              <button type="button" onClick={exportCsv} className={secondaryBtn}>
                <Download className="w-4 h-4" aria-hidden="true" /> Export CSV
              </button>
            </div>
          </div>

          <p className="text-xs text-sage-500">
            Projection generated {formatDate(model.generated_at)}. AI-assisted estimate from your last three months of actuals, not a guarantee. Negative cash means the plan runs out of money. Amounts in {model.currency}.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-9 bg-white rounded-modal border border-sage-200/90 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                {TABS.filter((t) => t.key === tab).map((t) => {
                  const statement = t.statement(model);
                  const rows = statement ? (t.key === "pnl" ? applyRevenueSensitivity(statement.rows, sensitivity) : statement.rows) : [];
                  return (
                    <table key={t.key} className="w-full text-left border-collapse min-w-[1100px]">
                      <caption className="sr-only">{t.label}</caption>
                      <thead>
                        <tr className="border-b border-sage-100 text-[11px] font-bold text-sage-400 uppercase tracking-wider bg-sage-50/50">
                          <th className="py-4 px-6 font-semibold">{t.label}</th>
                          {model.months!.map((mo) => (
                            <th key={mo} className="py-4 px-3 font-semibold text-right whitespace-nowrap">
                              {formatMonth(mo)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sage-100 text-sm">
                        {rows.map((r) => (
                          <tr key={r.label} className="hover:bg-sage-50/60 transition-colors">
                            <td className={`py-3 px-6 text-sage-900 whitespace-nowrap ${TOTAL_ROWS.has(r.label) ? "font-bold" : "font-medium"}`}>{r.label}</td>
                            {r.values.map((v, i) => (
                              <td key={i} className={`py-3 px-3 text-right whitespace-nowrap ${v < 0 ? "text-red-600 font-semibold" : "text-sage-600"} ${TOTAL_ROWS.has(r.label) ? "font-bold" : ""}`}>
                                {formatMajor(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-3">
                <h2 className="font-bold text-sage-900 border-b border-sage-100 pb-3">AI assumptions</h2>
                {model.assumptions && (
                  <>
                    <dl className="text-sm space-y-2">
                      {[
                        ["Revenue growth", `${model.assumptions.monthly_revenue_growth_pct}% per month`],
                        ["COGS", `${model.assumptions.cogs_pct_of_revenue}% of revenue`],
                        ["Opex growth", `${model.assumptions.monthly_opex_growth_pct}% per month`],
                        ["Receivables", `${model.assumptions.ar_days} days`],
                        ["Payables", `${model.assumptions.ap_days} days`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <dt className="text-sage-500">{k}</dt>
                          <dd className="font-semibold text-sage-900 text-right">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {model.assumptions.narrative && <p className="text-xs text-sage-600 border-t border-sage-100 pt-3">{model.assumptions.narrative}</p>}
                  </>
                )}
              </div>

              {tab === "pnl" && (
                <div className="bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2 border-b border-sage-100 pb-3">
                    <Settings2 className="w-4 h-4 text-sage-500" aria-hidden="true" />
                    <h2 className="font-bold text-sage-900">Sensitivity</h2>
                  </div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="sens" className="text-xs font-bold text-sage-500 uppercase tracking-wider">
                      Revenue adjustment
                    </label>
                    <span className={`text-sm font-bold ${sensitivity > 0 ? "text-green-600" : sensitivity < 0 ? "text-red-600" : "text-sage-900"}`}>
                      {sensitivity > 0 ? "+" : ""}
                      {sensitivity}%
                    </span>
                  </div>
                  <input id="sens" type="range" min={-20} max={20} step={5} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className="w-full accent-copper-600" />
                  <p className="text-xs text-sage-500">Adjusts revenue and COGS on the P&amp;L view only. Cash flow and balance sheet stay as generated.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
