"use client";

import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  patchModelAssumptions,
  recalculateModel,
  toFinanceError,
  type FinanceError,
  type FinancialModel,
  type ModelAssumptions,
  type ModelAssumptionsPatch,
  type ModelOverrides,
} from "@/lib/api/finance";
import { formatMonth } from "@/lib/finance/format";
import { buildPatch, stateFromAssumptions, type CostRow, type EditorState, type HiringRow } from "@/lib/finance/modelEdits";
import { ConfirmDialog, FormError, dangerLinkBtn, inputCls, linkBtn, primaryBtn, secondaryBtn } from "../_components/ui";
import { useToast } from "../ToastContext";

type Scalar = keyof Pick<EditorState, "growth" | "opexGrowth" | "cogs" | "ar" | "ap" | "rev0" | "costs0" | "depreciation">;

const SCALARS: { key: Scalar; label: string; unit: string; override: keyof ModelOverrides; money?: boolean }[] = [
  { key: "growth", label: "Revenue growth", unit: "% per month", override: "monthly_revenue_growth_pct" },
  { key: "cogs", label: "COGS", unit: "% of revenue", override: "cogs_pct_of_revenue" },
  { key: "opexGrowth", label: "Opex growth", unit: "% per month", override: "monthly_opex_growth_pct" },
  { key: "ar", label: "Receivable days", unit: "days", override: "ar_days" },
  { key: "ap", label: "Payable days", unit: "days", override: "ap_days" },
  { key: "rev0", label: "Starting monthly revenue", unit: "NGN", override: "revenue_0_minor", money: true },
  { key: "costs0", label: "Starting monthly costs", unit: "NGN", override: "monthly_costs_0_minor", money: true },
  { key: "depreciation", label: "Depreciation", unit: "months", override: "depreciation_months" },
];

/** The AI's suggestion for a field, shown beside an edited value. */
function suggested(model: FinancialModel, f: (typeof SCALARS)[number]): string | null {
  const ai = model.ai_assumptions as Record<string, unknown> | null;
  const v = ai?.[f.override as string];
  if (typeof v !== "number") return null;
  return f.money ? String(Math.round(v / 100)) : String(v);
}

function MonthSelect({ id, value, months, onChange, label }: { id: string; value: string; months: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <select id={id} aria-label={label} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        Month
      </option>
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonth(m)}
        </option>
      ))}
    </select>
  );
}

/**
 * The assumptions editor. It is remounted (via `key`) whenever the server copy of
 * the model changes, so its inputs always start from what the engine used and no
 * effect has to copy props into state.
 */
export function ModelEditor({
  model,
  assumptions,
  onModel,
}: {
  model: FinancialModel;
  assumptions: ModelAssumptions;
  onModel: (m: FinancialModel) => void;
}) {
  const { triggerToast } = useToast();
  const months = model.months ?? [];
  const [state, setState] = useState<EditorState>(() => stateFromAssumptions(assumptions));
  const [busy, setBusy] = useState<null | "save" | "recalc" | "reset">(null);
  const [error, setError] = useState<FinanceError | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  // Only the Recalculate response carries warnings, so they live on the model the page holds.
  const warnings = model.warnings ?? [];
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const overrides = model.overrides ?? {};
  const edited = (k: keyof ModelOverrides) => Object.prototype.hasOwnProperty.call(overrides, k);
  const set = <K extends keyof EditorState>(k: K, v: EditorState[K]) => setState((s) => ({ ...s, [k]: v }));

  const fieldError = (prefix: string) =>
    error ? Object.entries(error.fieldErrors).filter(([f]) => f === prefix || f.startsWith(`${prefix}[`)).map(([, m]) => m) : [];

  const savePatch = async (patch: ModelAssumptionsPatch): Promise<FinancialModel | null> => {
    try {
      return await patchModelAssumptions(model.id, patch);
    } catch (err) {
      setError(toFinanceError(err, "Couldn't save your edits. Try again."));
      return null;
    }
  };

  const built = () => {
    setError(null);
    setLocalError(null);
    const res = buildPatch(state, assumptions, months);
    if ("error" in res) {
      setLocalError(res.error);
      return null;
    }
    return res.patch;
  };

  const save = async () => {
    const patch = built();
    if (!patch) return;
    if (Object.keys(patch).length === 0) return triggerToast("Nothing changed.");
    setBusy("save");
    const next = await savePatch(patch);
    setBusy(null);
    if (next) {
      onModel(next);
      triggerToast("Edits saved. Recalculate to update the statements.");
    }
  };

  const recalculate = async (refreshActuals = false) => {
    const patch = built();
    if (!patch) return;
    setBusy("recalc");
    setConfirmRefresh(false);
    try {
      if (Object.keys(patch).length > 0) {
        const saved = await savePatch(patch);
        if (!saved) return;
      }
      const next = await recalculateModel(model.id, refreshActuals);
      onModel(next);
      triggerToast(refreshActuals ? "Recalculated from your latest numbers." : "Recalculated.");
    } catch (err) {
      setError(toFinanceError(err, "Couldn't recalculate. Try again."));
    } finally {
      setBusy(null);
    }
  };

  // Clearing an override puts the AI's value back; it saves straight away.
  const reset = async (keys: (keyof ModelOverrides)[]) => {
    setBusy("reset");
    setError(null);
    const patch: ModelAssumptionsPatch = {};
    for (const k of keys) (patch as Record<string, null>)[k as string] = null;
    const next = await savePatch(patch);
    setBusy(null);
    if (next) {
      onModel(next);
      triggerToast("Back to the AI value. Recalculate to update the statements.");
    }
  };

  const hiringRows = state.hiring;
  const setHiring = (i: number, patch: Partial<HiringRow>) => set("hiring", hiringRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const setCost = (key: "oneOffs" | "capex", i: number, patch: Partial<CostRow>) =>
    set(key, state[key].map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const firstMonth = months[0] ?? "";

  const costList = (key: "oneOffs" | "capex", title: string, help: string, overrideKey: "one_offs" | "capex", apiField: string, noun: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-neutral-600 uppercase">{title}</p>
        <span className="flex items-center gap-3">
          {edited(overrideKey) && (
            <button type="button" className={linkBtn} disabled={busy !== null} onClick={() => void reset([overrideKey])}>
              Clear edits
            </button>
          )}
          <button type="button" className={linkBtn} onClick={() => set(key, [...state[key], { label: "", month: firstMonth, amount: "" }])}>
            <Plus className="w-3 h-3 inline" aria-hidden="true" /> Add
          </button>
        </span>
      </div>
      <p className="text-xs text-neutral-500">{help}</p>
      {state[key].map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_7rem_6rem_auto] gap-2 items-center">
          <input aria-label={`${noun} ${i + 1} label`} placeholder="Label" className={inputCls} value={r.label} maxLength={120} onChange={(e) => setCost(key, i, { label: e.target.value })} />
          <MonthSelect id={`${key}-m-${i}`} label={`${noun} ${i + 1} month`} value={r.month} months={months} onChange={(v) => setCost(key, i, { month: v })} />
          <input aria-label={`${noun} ${i + 1} amount in naira`} placeholder="NGN" inputMode="decimal" className={inputCls} value={r.amount} onChange={(e) => setCost(key, i, { amount: e.target.value })} />
          <button type="button" className={dangerLinkBtn} aria-label={`Remove ${noun.toLowerCase()} ${i + 1}`} onClick={() => set(key, state[key].filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      {fieldError(apiField).map((m, i) => (
        <p key={i} className="text-xs font-medium text-danger-600">
          {m}
        </p>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-modal border border-neutral-200 p-6 shadow-card space-y-5">
      <div>
        <h2 className="font-bold text-neutral-900 border-b border-neutral-100 pb-3">Edit assumptions</h2>
        <p className="text-xs text-neutral-500 mt-2">
          Change a number, then Recalculate. Recalculating is instant and does not use the AI. Starting figures are the monthly levels the projection grows from.
        </p>
      </div>

      {model.assumptions?.revenue_source === "business_builder" && (
        <p role="note" className="text-xs font-semibold text-warning bg-warning-50 border border-warning-500/40 rounded-input px-3 py-2">
          Starting revenue comes from your Business Builder plan, not from actuals. Change it below if it is off.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCALARS.filter((f) => !f.money || (model.assumptions as Record<string, unknown> | null)?.[f.override as string] !== undefined).map((f) => {
          const ai = edited(f.override) ? suggested(model, f) : null;
          const errs = fieldError(f.override as string);
          return (
            <div key={f.key} className="space-y-1">
              <label htmlFor={`me-${f.key}`} className="text-xs font-bold text-neutral-500 uppercase">
                {f.label} <span className="font-medium normal-case text-neutral-600">({f.unit})</span>
              </label>
              <input id={`me-${f.key}`} inputMode="decimal" className={inputCls} value={state[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              {edited(f.override) && (
                <p className="text-xs text-neutral-500">
                  Edited{ai !== null ? `. AI suggested ${ai}` : ""}.{" "}
                  <button type="button" className={linkBtn} disabled={busy !== null} onClick={() => void reset([f.override])}>
                    Use AI value
                  </button>
                </p>
              )}
              {errs.map((m, i) => (
                <p key={i} className="text-xs font-medium text-danger-600">
                  {m}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-neutral-600 uppercase">Hiring plan</p>
          <span className="flex items-center gap-3">
            {edited("hiring_plan") && (
              <button type="button" className={linkBtn} disabled={busy !== null} onClick={() => void reset(["hiring_plan"])}>
                Clear edits
              </button>
            )}
            <button type="button" className={linkBtn} onClick={() => set("hiring", [...hiringRows, { role: "", start: firstMonth, cost: "" }])}>
              <Plus className="w-3 h-3 inline" aria-hidden="true" /> Add hire
            </button>
          </span>
        </div>
        <p className="text-xs text-neutral-500">A monthly cost that starts in the month you pick and continues after it.</p>
        {hiringRows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_7rem_6rem_auto] gap-2 items-center">
            <input aria-label={`Hire ${i + 1} role`} placeholder="Role" className={inputCls} value={r.role} maxLength={120} onChange={(e) => setHiring(i, { role: e.target.value })} />
            <MonthSelect id={`h-m-${i}`} label={`Hire ${i + 1} start month`} value={r.start} months={months} onChange={(v) => setHiring(i, { start: v })} />
            <input aria-label={`Hire ${i + 1} monthly cost in naira`} placeholder="NGN / month" inputMode="decimal" className={inputCls} value={r.cost} onChange={(e) => setHiring(i, { cost: e.target.value })} />
            <button type="button" className={dangerLinkBtn} aria-label={`Remove hire ${i + 1}`} onClick={() => set("hiring", hiringRows.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        {fieldError("hiring_plan").map((m, i) => (
          <p key={i} className="text-xs font-medium text-danger-600">
            {m}
          </p>
        ))}
      </div>

      {costList("oneOffs", "One-off costs", "A one-time operating cost in the month you pick.", "one_offs", "one_offs", "One-off")}
      {costList("capex", "Capex", "Cash out in the month you pick, then depreciated straight-line from the next month.", "capex", "capex", "Capex")}

      {warnings.length > 0 && (
        <ul role="status" className="text-xs font-medium text-warning bg-warning-50 border border-warning-500/40 rounded-input px-3 py-2 space-y-1">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      <FormError message={localError ?? (error && !Object.keys(error.fieldErrors).length ? error.message : null)} />

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
        <button type="button" className={primaryBtn} disabled={busy !== null} onClick={() => void recalculate()}>
          <RefreshCw className={`w-4 h-4 ${busy === "recalc" ? "animate-spin" : ""}`} aria-hidden="true" />
          {busy === "recalc" ? "Recalculating" : "Recalculate"}
        </button>
        <button type="button" className={secondaryBtn} disabled={busy !== null} onClick={() => void save()}>
          {busy === "save" ? "Saving" : "Save edits"}
        </button>
        <button type="button" className={`${linkBtn} ml-auto`} disabled={busy !== null} onClick={() => setConfirmRefresh(true)}>
          Refresh from my latest numbers
        </button>
      </div>

      {confirmRefresh && (
        <ConfirmDialog
          title="Refresh from your latest numbers?"
          body="This re-reads your ledger and restarts the projection from today. Your saved edits are kept, but any edit dated outside the new window is left out and listed as a warning."
          confirmLabel="Refresh and recalculate"
          busy={busy === "recalc"}
          onConfirm={() => void recalculate(true)}
          onCancel={() => setConfirmRefresh(false)}
        />
      )}
    </div>
  );
}
