"use client";

import React, { useRef, useState } from "react";
import { FileText, Plus, Receipt, UploadCloud } from "lucide-react";
import { useCategories, useExpenses, useExpenseSummary } from "@/hooks/useFinanceApi";
import {
  RECEIPT_MAX_BYTES,
  RECEIPT_TYPES,
  createExpense,
  deleteExpense,
  removeExpenseReceipt,
  updateExpense,
  uploadExpenseReceipt,
  type Expense,
  type FinanceError,
} from "@/lib/api/finance";
import { currentMonth, formatDate, formatMoney, formatMonth, minorToInput, todayIso, toMinor } from "@/lib/finance/format";
import { CategorySelect } from "../_components/CategorySelect";
import { ExpenseDonut } from "../_components/charts";
import { LoadMore } from "../_components/LoadMore";
import { ReceiptButton } from "../_components/ReceiptButton";
import {
  ConfirmDialog,
  EmptyBlock,
  Field,
  FormError,
  ForbiddenBlock,
  LoadingBlock,
  Modal,
  PageHeader,
  ErrorBlock,
  dangerLinkBtn,
  darkBtn,
  inputCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "../_components/ui";
import { useFinanceAction } from "../_components/useFinanceAction";
import { useToast } from "../ToastContext";

function validateReceipt(file: File): string | null {
  if (!(RECEIPT_TYPES as readonly string[]).includes(file.type)) return "Receipt must be a PNG, JPEG, or PDF.";
  if (file.size > RECEIPT_MAX_BYTES) return "Receipt exceeds the 10 MB limit.";
  return null;
}

function ExpenseForm({
  initial,
  categories,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: Expense;
  categories: string[];
  busy: boolean;
  error: FinanceError | null;
  onSubmit: (v: { vendor: string; category: string; date: string; amountMinor: number; recurring: boolean; notes: string; receipt: File | null }) => void;
  onCancel: () => void;
}) {
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [date, setDate] = useState(initial?.expense_date ?? todayIso());
  const [amount, setAmount] = useState(initial ? minorToInput(initial.amount_minor) : "");
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const minor = toMinor(amount);
    if (!vendor.trim()) return setLocalError("Add the vendor.");
    if (!category.trim()) return setLocalError("Pick or type a category.");
    if (minor === null) return setLocalError("Enter an amount like 1500 or 1500.50.");
    if (receipt) {
      const bad = validateReceipt(receipt);
      if (bad) return setLocalError(bad);
    }
    setLocalError(null);
    onSubmit({ vendor: vendor.trim(), category: category.trim(), date, amountMinor: minor, recurring, notes: notes.trim(), receipt });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Vendor" htmlFor="ex-vendor" error={error?.fieldErrors.vendor}>
        <input id="ex-vendor" className={inputCls} value={vendor} onChange={(e) => setVendor(e.target.value)} maxLength={200} />
      </Field>
      <Field label="Category" htmlFor="ex-cat" error={error?.fieldErrors.category} hint="Budgets match by category, so pick the one you budget against.">
        <CategorySelect id="ex-cat" value={category} onChange={setCategory} options={categories} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (NGN)" htmlFor="ex-amount" error={error?.fieldErrors.amount_minor}>
          <input id="ex-amount" inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Date" htmlFor="ex-date" error={error?.fieldErrors.expense_date}>
          <input id="ex-date" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes (optional)" htmlFor="ex-notes">
        <textarea id="ex-notes" className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 max-md:min-h-11 text-sm text-neutral-700">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-accent-600" />
        Recurring (a label only; the next one is not created for you)
      </label>
      {!initial && (
        <Field label="Receipt (optional)" htmlFor="ex-receipt" hint="PNG, JPEG or PDF, up to 10 MB.">
          <input id="ex-receipt" type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} className="text-sm max-md:min-h-11 max-md:py-2.5" />
        </Field>
      )}
      <p className="text-xs text-neutral-500">
        Saving this deducts the amount from your cash on hand on the expense date{initial ? " (editing changes it in place)" : ""}. Do not also add it as a transaction.
      </p>
      <FormError message={localError ?? (error && !Object.keys(error.fieldErrors).length ? error.message : null)} />
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onCancel} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Saving" : initial ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}

export default function ExpensesPage() {
  const [month, setMonth] = useState(currentMonth());
  const expenses = useExpenses(month);
  const summary = useExpenseSummary(month);
  const categoryList = useCategories();
  const categories = (categoryList.data ?? []).map((c) => c.name);
  const { run, busy } = useFinanceAction();
  const { triggerToast } = useToast();

  const [formFor, setFormFor] = useState<"new" | Expense | null>(null);
  const [formError, setFormError] = useState<FinanceError | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [removingReceipt, setRemovingReceipt] = useState<Expense | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<Expense | null>(null);

  const refresh = async () => {
    await Promise.all([expenses.reload(), summary.reload(), categoryList.reload()]);
  };
  const closeForm = () => {
    setFormFor(null);
    setFormError(null);
  };

  if (expenses.status === "forbidden") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <PageHeader title="Expenses" subtitle="Track operational spend, receipts and where the money goes." />
        <ForbiddenBlock />
      </div>
    );
  }

  const pickReceipt = (exp: Expense) => {
    uploadTarget.current = exp;
    fileInputRef.current?.click();
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const exp = uploadTarget.current;
    e.target.value = "";
    if (!file || !exp) return;
    const bad = validateReceipt(file);
    if (bad) return triggerToast(bad, "error");
    const res = await run(() => uploadExpenseReceipt(exp.id, file), { success: exp.has_receipt ? "Receipt replaced." : "Receipt attached." });
    if (res.ok) await refresh();
  };

  const submitForm = async (v: { vendor: string; category: string; date: string; amountMinor: number; recurring: boolean; notes: string; receipt: File | null }) => {
    setFormError(null);
    const editing = formFor && formFor !== "new" ? formFor : null;
    const res = editing
      ? await run(
          () =>
            updateExpense(editing.id, {
              vendor: v.vendor,
              category: v.category,
              expense_date: v.date,
              amount_minor: v.amountMinor,
              recurring: v.recurring,
              // notes is the only field allowed to be an explicit null.
              notes: v.notes || null,
            }),
          { success: "Expense updated. Cash on hand adjusted.", quiet: true },
        )
      : await run(
          () =>
            createExpense({
              vendor: v.vendor,
              category: v.category,
              expense_date: v.date,
              amount_minor: v.amountMinor,
              recurring: v.recurring,
              ...(v.notes ? { notes: v.notes } : {}),
            }),
          { success: "Expense added and deducted from cash on hand.", quiet: true },
        );
    if (!res.ok) return setFormError(res.error);
    if (!editing && v.receipt) {
      const up = await run(() => uploadExpenseReceipt(res.data.id, v.receipt as File), { success: "Receipt attached." });
      if (!up.ok) triggerToast("The expense was saved, but the receipt did not upload. Try attaching it again.", "error");
    }
    closeForm();
    await refresh();
  };

  const toggleRecurring = async (exp: Expense) => {
    const res = await run(() => updateExpense(exp.id, { recurring: !exp.recurring }), {
      success: exp.recurring ? "Marked as one-off." : "Marked as recurring.",
    });
    if (res.ok) await refresh();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await run(() => deleteExpense(deleting.id), { success: "Expense deleted. The amount was added back to cash on hand." });
    setDeleting(null);
    if (res.ok) await refresh();
  };

  const confirmRemoveReceipt = async () => {
    if (!removingReceipt) return;
    const res = await run(() => removeExpenseReceipt(removingReceipt.id), { success: "Receipt removed." });
    setRemovingReceipt(null);
    if (res.ok) await refresh();
  };

  const today = todayIso();

  // Receipts open only through the signed-link route; the expense never carries a storage URL.
  const receiptControls = (exp: Expense) =>
    exp.has_receipt ? (
      <>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-800">
          <FileText className="w-4 h-4" aria-hidden="true" /> On file
        </span>
        <ReceiptButton expenseId={exp.id} vendor={exp.vendor} onMissing={() => void refresh()} />
        <button type="button" className={linkBtn} disabled={busy} onClick={() => pickReceipt(exp)} aria-label={`Replace receipt for ${exp.vendor}`}>
          Replace
        </button>
        <button type="button" className={dangerLinkBtn} disabled={busy} onClick={() => setRemovingReceipt(exp)} aria-label={`Remove receipt for ${exp.vendor}`}>
          Remove
        </button>
      </>
    ) : (
      <button type="button" className={`${linkBtn} inline-flex items-center gap-1 text-accent-600`} disabled={busy} onClick={() => pickReceipt(exp)} aria-label={`Attach receipt for ${exp.vendor}`}>
        <UploadCloud className="w-4 h-4" aria-hidden="true" /> Attach
      </button>
    );

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Expenses"
        subtitle="Track operational spend, receipts and where the money goes."
        action={
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="exp-month">
              Month
            </label>
            <input
              id="exp-month"
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="bg-white border border-neutral-200 rounded-card px-3 py-2 max-md:min-h-11 text-sm font-medium focus:outline-none focus:border-accent-600"
            />
            <button type="button" onClick={() => setFormFor("new")} className={primaryBtn}>
              <Plus className="w-4 h-4" aria-hidden="true" /> Add expense
            </button>
          </div>
        }
      />

      <div className="bg-white p-6 rounded-modal border border-neutral-200 shadow-card space-y-4">
        <h2 className="font-bold text-neutral-900 border-b border-neutral-100 pb-2">Category breakdown ({formatMonth(month)})</h2>
        {summary.status === "loading" ? (
          <LoadingBlock label="Loading breakdown" />
        ) : summary.status === "ready" && summary.data && summary.data.rows.length > 0 ? (
          <>
            <ExpenseDonut rows={summary.data.rows} total={summary.data.total_minor} currency={summary.data.currency} />
            <p className="text-[11px] text-neutral-600">Includes expenses dated later in the month.</p>
          </>
        ) : summary.status === "error" ? (
          <p role="alert" className="text-sm text-danger-600">
            {summary.error}
          </p>
        ) : (
          <p className="text-sm text-neutral-500">No expenses in {formatMonth(month)} yet.</p>
        )}
      </div>

      {expenses.status === "loading" ? (
        <LoadingBlock label="Loading expenses" />
      ) : expenses.status === "error" ? (
        <ErrorBlock message={expenses.error ?? "Couldn't load expenses."} onRetry={() => void expenses.reload()} />
      ) : expenses.items.length === 0 ? (
        <EmptyBlock icon={<Receipt className="w-6 h-6" aria-hidden="true" />} title={`No expenses in ${formatMonth(month)}`} body="Log what you spend. Each expense comes off your cash on hand, feeds your budgets and can carry a receipt.">
          <button type="button" onClick={() => setFormFor("new")} className={darkBtn}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add an expense
          </button>
        </EmptyBlock>
      ) : (
        <div className="bg-white rounded-modal border border-neutral-200 overflow-hidden shadow-card">
          <ul className="md:hidden divide-y divide-neutral-100" aria-label="Expenses">
            {expenses.items.map((exp) => (
              <li key={exp.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 break-words">{exp.vendor}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(exp.expense_date)} · {exp.category}
                      {exp.expense_date > today ? " · Scheduled" : ""}
                    </p>
                    {exp.notes && <p className="text-xs text-neutral-600 mt-0.5">{exp.notes}</p>}
                  </div>
                  <p className="font-bold text-neutral-900 whitespace-nowrap">{formatMoney(exp.amount_minor, exp.currency)}</p>
                </div>
                <label className="flex items-center gap-2 max-md:min-h-11 text-xs text-neutral-600">
                  <input type="checkbox" checked={exp.recurring} disabled={busy} onChange={() => void toggleRecurring(exp)} className="accent-accent-600" />
                  Recurring
                </label>
                <div className="flex flex-wrap items-center gap-3">{receiptControls(exp)}</div>
                <div className="flex items-center gap-4">
                  <button type="button" className={linkBtn} onClick={() => setFormFor(exp)} aria-label={`Edit ${exp.vendor}`}>
                    Edit
                  </button>
                  <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(exp)} aria-label={`Delete ${exp.vendor}`}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[11px] text-neutral-600 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Vendor / date</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-center">Recurring</th>
                  <th className="py-4 px-4">Receipt</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {expenses.items.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <p className="font-semibold text-neutral-900">{exp.vendor}</p>
                      <p className="text-xs text-neutral-500 font-medium">
                        {formatDate(exp.expense_date)}
                        {exp.expense_date > today && <span className="ml-2 text-accent-700 font-bold">Scheduled</span>}
                      </p>
                      {exp.notes && <p className="text-xs text-neutral-600 mt-0.5">{exp.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-medium">{exp.category}</td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={exp.recurring}
                        disabled={busy}
                        onChange={() => void toggleRecurring(exp)}
                        aria-label={`Recurring for ${exp.vendor}`}
                        className="accent-accent-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{receiptControls(exp)}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900 text-right whitespace-nowrap">{formatMoney(exp.amount_minor, exp.currency)}</td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-3">
                        <button type="button" className={linkBtn} onClick={() => setFormFor(exp)} aria-label={`Edit ${exp.vendor}`}>
                          Edit
                        </button>
                        <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(exp)} aria-label={`Delete ${exp.vendor}`}>
                          Delete
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LoadMore list={expenses} noun="expenses" />
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={(e) => void onFileChosen(e)} className="hidden" accept="image/png,image/jpeg,application/pdf" aria-label="Receipt file" />

      {formFor && (
        <Modal title={formFor === "new" ? "Add expense" : "Edit expense"} onClose={closeForm}>
          <ExpenseForm initial={formFor === "new" ? undefined : formFor} categories={categories} busy={busy} error={formError} onSubmit={(v) => void submitForm(v)} onCancel={closeForm} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this expense?"
          body={`${deleting.vendor} (${formatMoney(deleting.amount_minor, deleting.currency)}) will be removed, its receipt deleted, and the amount added back to your cash on hand. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}

      {removingReceipt && (
        <ConfirmDialog
          title="Remove this receipt?"
          body={`The receipt for ${removingReceipt.vendor} will be deleted. The expense stays.`}
          confirmLabel="Remove receipt"
          danger
          busy={busy}
          onConfirm={() => void confirmRemoveReceipt()}
          onCancel={() => setRemovingReceipt(null)}
        />
      )}
    </div>
  );
}
