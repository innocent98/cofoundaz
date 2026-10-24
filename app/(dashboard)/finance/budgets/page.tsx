"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, FileText, Plus, Sparkles } from "lucide-react";
import { useBudgets, useCategories } from "@/hooks/useFinanceApi";
import {
  copyLastMonthBudgets,
  createBudget,
  deleteBudget,
  draftBudgetsFromActuals,
  updateBudget,
  type Budget,
  type BudgetStatus,
  type FinanceError,
} from "@/lib/api/finance";
import { clampPercent, currentMonth, formatMoney, formatMonth, minorToInput, toMinor } from "@/lib/finance/format";
import { CategorySelect } from "../_components/CategorySelect";
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
  const [limit, setLimit] = useState(initial?.limit_minor != null ? minorToInput(initial.limit_minor) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const minor = toMinor(limit);
    if (!category.trim()) return setLocalError("Pick or type a category.");
    if (minor === null) return setLocalError("Enter a limit like 250000 or 250000.50.");
    setLocalError(null);
    onSubmit({ category: category.trim(), limitMinor: minor, notes: notes.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-sage-500">Budget for {formatMonth(month)}. Spent is every money-out entry in the same category this month.</p>
      {initial ? (
        <p className="text-sm font-semibold text-sage-900">Category: {initial.category}</p>
      ) : (
        <Field label="Category" htmlFor="bd-cat" error={error?.fieldErrors.category} hint="Spend in this category is matched to the budget automatically.">
          <CategorySelect id="bd-cat" value={category} onChange={setCategory} options={categories} />
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
          {busy ? "Saving" : initial?.id ? "Save changes" : "Create budget"}
        </button>
      </div>
    </form>
  );
}

const STATUS_LABEL: Record<BudgetStatus, string> = {
  under: "Under budget",
  near: "Near the limit",
  over: "Over budget",
  unbudgeted: "No budget set",
};

function StatusChip({ status }: { status: BudgetStatus }) {
  const tone =
    status === "over"
      ? "bg-red-50 text-red-600 border-red-200"
      : status === "near"
        ? "bg-copper-100 text-copper-700 border-copper-200"
        : status === "unbudgeted"
          ? "bg-sage-100 text-sage-600 border-sage-200"
          : "bg-green-50 text-green-800 border-green-200";
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-input border uppercase tracking-wider ${tone}`}>{STATUS_LABEL[status]}</span>;
}

function VarianceBar({ b }: { b: Budget }) {
  const over = b.over_budget;
  return (
    <div className="space-y-1">
      <div className="w-full bg-sage-100 rounded-pill h-2 overflow-hidden" role="img" aria-label={b.percent_used === null ? "No limit" : `${b.percent_used}% of the budget used`}>
        <div className={`${over ? "bg-red-600" : "bg-green-800"} h-full rounded-pill`} style={{ width: `${clampPercent(b.percent_used)}%` }}></div>
      </div>
      <p className="text-[11px] text-sage-500">{b.percent_used === null ? "No limit set" : `${b.percent_used}% used`}</p>
    </div>
  );
}

function RowButtons({ b, onEdit, onDelete }: { b: Budget; onEdit: () => void; onDelete: () => void }) {
  if (b.unbudgeted || !b.id) {
    return (
      <button type="button" className={linkBtn} onClick={onEdit} aria-label={`Set a budget for ${b.category}`}>
        Set budget
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" className={linkBtn} onClick={onEdit} aria-label={`Edit ${b.category} budget`}>
        Edit
      </button>
      <button type="button" className={dangerLinkBtn} onClick={onDelete} aria-label={`Delete ${b.category} budget`}>
        Delete
      </button>
    </span>
  );
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const budgets = useBudgets(month);
  const categoryList = useCategories();
  const categories = (categoryList.data ?? []).map((c) => c.name);
  const { run, busy } = useFinanceAction();
  const { triggerToast } = useToast();

  const [formFor, setFormFor] = useState<"new" | Budget | null>(null);
  const [formError, setFormError] = useState<FinanceError | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const refreshAll = async () => {
    await Promise.all([budgets.reload(), categoryList.reload()]);
  };

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
    const editing = formFor && formFor !== "new" && formFor.id ? formFor : null;
    const res = editing && editing.id
      ? await run(() => updateBudget(editing.id as string, { limit_minor: v.limitMinor, notes: v.notes || null }), { success: "Budget updated.", quiet: true })
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
      await refreshAll();
    } else {
      setFormError(res.error);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (!deleting.id) return;
    const deletingId = deleting.id;
    const res = await run(() => deleteBudget(deletingId), { success: "Budget deleted. Your expenses are untouched." });
    setDeleting(null);
    if (res.ok) await refreshAll();
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
              body="A budget is a plan for your money. Start with last month's actuals."
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
                <p className="text-xs text-sage-500 max-w-xl">
                  Spent is every money-out entry of the month in the category: manual transactions, <Link href="/finance/expenses" className="underline font-semibold">expenses</Link> and imported payments. Totals can look higher than before because manual spend now counts.
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

              <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
                <ul className="md:hidden divide-y divide-sage-100" aria-label="Budgets">
                  {rows.map((b) => (
                    <li key={b.id ?? `u-${b.category}`} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-bold text-sage-900">{b.category}</h2>
                        <StatusChip status={b.status} />
                      </div>
                      <p className="text-xs text-sage-500">
                        Spent {formatMoney(b.spent_minor, b.currency)}
                        {b.limit_minor === null ? "" : ` of ${formatMoney(b.limit_minor, b.currency)}`}
                      </p>
                      {b.limit_minor !== null && <VarianceBar b={b} />}
                      <RowButtons b={b} onEdit={() => setFormFor(b)} onDelete={() => setDeleting(b)} />
                    </li>
                  ))}
                </ul>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sage-50/50 border-b border-sage-100 text-[11px] text-sage-400 font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-4 text-right">Budget</th>
                        <th className="py-4 px-4 text-right">Spent</th>
                        <th className="py-4 px-4 text-right">Variance</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                      {rows.map((b) => (
                        <tr key={b.id ?? `u-${b.category}`} className="hover:bg-sage-50/50 transition-colors align-top">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-sage-900">{b.category}</p>
                            {b.notes && <p className="text-xs text-sage-500 mt-0.5">{b.notes}</p>}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap text-sage-700">
                            {b.limit_minor === null ? <span className="text-sage-400">None</span> : formatMoney(b.limit_minor, b.currency)}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap font-semibold text-sage-900">{formatMoney(b.spent_minor, b.currency)}</td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {b.variance_minor === null ? (
                              <span className="text-sage-400">Not applicable</span>
                            ) : (
                              <span className={b.variance_minor > 0 ? "text-red-600 font-semibold" : "text-green-800 font-semibold"}>
                                {b.variance_minor > 0 ? "Over by " : "Left "}
                                {formatMoney(Math.abs(b.variance_minor), b.currency)}
                                {b.variance_percent !== null && (
                                  <span className="block text-xs font-medium">{b.variance_percent > 0 ? "+" : ""}{b.variance_percent}%</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 w-48">
                            <StatusChip status={b.status} />
                            {b.limit_minor !== null && <div className="mt-2"><VarianceBar b={b} /></div>}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <RowButtons b={b} onEdit={() => setFormFor(b)} onDelete={() => setDeleting(b)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        }
      </ResourceGate>

      {formFor && (
        <Modal title={formFor === "new" ? "New budget" : formFor.id ? `Edit ${formFor.category} budget` : `Set ${formFor.category} budget`} onClose={closeForm}>
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
