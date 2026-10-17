"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, FileText, Plus, Sparkles } from "lucide-react";
import { useBudgets, useKnownCategories } from "@/hooks/useFinanceApi";
import {
  copyLastMonthBudgets,
  createBudget,
  deleteBudget,
  draftBudgetsFromActuals,
  updateBudget,
  type Budget,
  type FinanceError,
} from "@/lib/api/finance";
import { clampPercent, currentMonth, formatMoney, formatMonth, minorToInput, toMinor } from "@/lib/finance/format";
import { CategoryInput } from "../_components/CategoryInput";
import {
  ConfirmDialog,
  EmptyBlock,
  Field,
  FormError,
  ForbiddenBlock,
  Modal,
  PageHeader,
  ResourceGate,
  dangerLinkBtn,
  darkBtn,
  inputCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "../_components/ui";
import { useFinanceAction } from "../_components/useFinanceAction";
import { useToast } from "../ToastContext";

function BudgetForm({
  initial,
  month,
  categories,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: Budget;
  month: string;
  categories: string[];
  busy: boolean;
  error: FinanceError | null;
  onSubmit: (v: { category: string; limitMinor: number; notes: string }) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [limit, setLimit] = useState(initial ? minorToInput(initial.limit_minor) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const minor = toMinor(limit);
    if (!initial && !category.trim()) return setLocalError("Pick or type a category.");
    if (minor === null) return setLocalError("Enter a limit like 250000 or 250000.50.");
    setLocalError(null);
    onSubmit({ category: category.trim(), limitMinor: minor, notes: notes.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-sage-500">Budget for {formatMonth(month)}. Spent is worked out from your Expenses in the same category.</p>
      {initial ? (
        <p className="text-sm font-semibold text-sage-900">Category: {initial.category}</p>
      ) : (
        <Field label="Category" htmlFor="bd-cat" error={error?.fieldErrors.category} hint="Must match the category text on your expenses exactly.">
          <CategoryInput id="bd-cat" value={category} onChange={setCategory} options={categories} />
        </Field>
      )}
      <Field label="Monthly limit (NGN)" htmlFor="bd-limit" error={error?.fieldErrors.limit_minor}>
        <input id="bd-limit" inputMode="decimal" className={inputCls} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0.00" />
      </Field>
      <Field label="Notes (optional)" htmlFor="bd-notes">
        <textarea id="bd-notes" className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <FormError message={localError ?? (error && !Object.keys(error.fieldErrors).length ? error.message : null)} />
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onCancel} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Saving" : initial ? "Save changes" : "Create budget"}
        </button>
      </div>
    </form>
  );
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const budgets = useBudgets(month);
  const categories = useKnownCategories();
  const { run, busy } = useFinanceAction();
  const { triggerToast } = useToast();

  const [formFor, setFormFor] = useState<"new" | Budget | null>(null);
  const [formError, setFormError] = useState<FinanceError | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const closeForm = () => {
    setFormFor(null);
    setFormError(null);
  };

  if (budgets.status === "forbidden") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <PageHeader title="Budgets" subtitle="Set monthly spending limits by category and watch what is spent." />
        <ForbiddenBlock />
      </div>
    );
  }

  // Both seeders skip categories that already have a budget and return only what
  // they created, so refetch the month rather than appending the response.
  const seed = async (kind: "draft" | "copy") => {
    const res = await run(() => (kind === "draft" ? draftBudgetsFromActuals(month) : copyLastMonthBudgets(month)));
    if (!res.ok) return;
    const n = res.data.length;
    if (n === 0) {
      triggerToast(
        kind === "draft"
          ? "Nothing to add. Last month had no spending, or every category already has a budget."
          : "Nothing to add. Last month had no budgets, or every category already has one.",
      );
    } else {
      triggerToast(
        kind === "draft"
          ? `Added ${n} budget${n === 1 ? "" : "s"} from last month's spending.`
          : `Copied ${n} budget${n === 1 ? "" : "s"} from last month.`,
      );
    }
    await budgets.reload();
  };

  const submitForm = async (v: { category: string; limitMinor: number; notes: string }) => {
    setFormError(null);
    const editing = formFor && formFor !== "new" ? formFor : null;
    const res = editing
      ? await run(() => updateBudget(editing.id, { limit_minor: v.limitMinor, notes: v.notes || null }), { success: "Budget updated.", quiet: true })
      : await run(
          () =>
            createBudget({
              category: v.category,
              period_month: month,
              limit_minor: v.limitMinor,
              ...(v.notes ? { notes: v.notes } : {}),
            }),
          { success: "Budget created.", quiet: true },
        );
    if (res.ok) {
      closeForm();
      await budgets.reload();
    } else {
      setFormError(res.error);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await run(() => deleteBudget(deleting.id), { success: "Budget deleted. Your expenses are untouched." });
    setDeleting(null);
    if (res.ok) await budgets.reload();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Budgets"
        subtitle="Set monthly spending limits by category and watch what is spent."
        action={
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="bd-month">
              Month
            </label>
            <input
              id="bd-month"
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="bg-white border border-sage-200 rounded-card px-3 py-2 text-sm font-medium focus:outline-none focus:border-copper-600"
            />
            <button type="button" onClick={() => setFormFor("new")} className={primaryBtn}>
              <Plus className="w-4 h-4" aria-hidden="true" /> New budget
            </button>
          </div>
        }
      />

      <ResourceGate resource={budgets} loadingLabel="Loading budgets">
        {(rows) =>
          rows.length === 0 ? (
            <EmptyBlock
              icon={<FileText className="w-6 h-6" aria-hidden="true" />}
              title={`No budget set for ${formatMonth(month)}`}
              body="Draft limits from last month's spending, copy last month's budgets, or add one category at a time."
            >
              <button type="button" disabled={busy} onClick={() => void seed("draft")} className={darkBtn}>
                <Sparkles className="w-4 h-4" aria-hidden="true" /> Draft budget from actuals
              </button>
              <button type="button" disabled={busy} onClick={() => void seed("copy")} className={secondaryBtn}>
                <Copy className="w-4 h-4" aria-hidden="true" /> Copy last month
              </button>
              <button type="button" onClick={() => setFormFor("new")} className={secondaryBtn}>
                <Plus className="w-4 h-4" aria-hidden="true" /> Add one budget
              </button>
            </EmptyBlock>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-sage-500">
                  Spent comes from <Link href="/finance/expenses" className="underline font-semibold">Expenses</Link> in the same category. Manual transactions do not count.
                </p>
                <div className="flex gap-4">
                  <button type="button" disabled={busy} onClick={() => void seed("draft")} className="text-xs font-bold text-copper-600 hover:underline flex items-center gap-1 disabled:opacity-50">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Draft missing from actuals
                  </button>
                  <button type="button" disabled={busy} onClick={() => void seed("copy")} className="text-xs font-bold text-copper-600 hover:underline flex items-center gap-1 disabled:opacity-50">
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy last month&apos;s budgets
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map((b) => {
                  const over = b.over_budget;
                  return (
                    <div key={b.id} className={`bg-white p-5 rounded-modal border ${over ? "border-red-200" : "border-sage-200"} space-y-4 shadow-card`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h2 className="font-bold text-sage-900">{b.category}</h2>
                          <span className="text-xs text-sage-500 font-medium">{formatMonth(b.period_month)} allocation</span>
                        </div>
                        {over && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-input border border-red-200 uppercase tracking-wider">Over budget</span>}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={over ? "text-red-600" : "text-green-800"}>{b.percent_used === null ? "No limit set" : `${b.percent_used}% used`}</span>
                          <span className="text-sage-400">Limit: {formatMoney(b.limit_minor, b.currency)}</span>
                        </div>
                        {b.percent_used !== null && (
                          <div className="w-full bg-sage-100 rounded-pill h-2 overflow-hidden">
                            <div className={`${over ? "bg-red-600" : "bg-green-800"} h-full rounded-pill transition-all`} style={{ width: `${clampPercent(b.percent_used)}%` }}></div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-sage-100 text-sm">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-sage-400 font-bold uppercase tracking-wider">Spent</span>
                          <span className="font-semibold text-sage-900">{formatMoney(b.spent_minor, b.currency)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-sage-400 font-bold uppercase tracking-wider">{b.variance_minor > 0 ? "Over by" : "Left"}</span>
                          <span className={`font-semibold ${over ? "text-red-600" : "text-green-600"}`}>{formatMoney(Math.abs(b.variance_minor), b.currency)}</span>
                        </div>
                      </div>

                      {b.notes && <p className="text-xs text-sage-500">{b.notes}</p>}

                      <div className="flex justify-end gap-3 pt-1">
                        <button type="button" className={linkBtn} onClick={() => setFormFor(b)} aria-label={`Edit ${b.category} budget`}>
                          Edit
                        </button>
                        <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(b)} aria-label={`Delete ${b.category} budget`}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        }
      </ResourceGate>

      {formFor && (
        <Modal title={formFor === "new" ? "New budget" : `Edit ${formFor.category} budget`} onClose={closeForm}>
          <BudgetForm initial={formFor === "new" ? undefined : formFor} month={month} categories={categories} busy={busy} error={formError} onSubmit={(v) => void submitForm(v)} onCancel={closeForm} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this budget?"
          body={`The ${deleting.category} budget for ${formatMonth(deleting.period_month)} will be removed. Your expenses are not affected. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
