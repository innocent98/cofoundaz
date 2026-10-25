"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Download, MessageSquare, Plus, Wallet } from "lucide-react";
import { useCashFlow, useCategories, useTransactions, useUncategorizedCount } from "@/hooks/useFinanceApi";
import {
  createTransaction,
  deleteTransaction,
  exportTransactionsXlsx,
  updateTransaction,
  type CashFlow,
  type Transaction,
  type TransactionDirection,
  type TransactionFilters,
  type TransactionSource,
  type FinanceError,
} from "@/lib/api/finance";
import { useAiDrawer } from "@/components/ai-drawer-context";
import { fundingCandidate } from "@/lib/finance/funding";
import { formatDate, formatMoney, plainText, todayIso, toMinor, minorToInput } from "@/lib/finance/format";
import { CategorySelect } from "./_components/CategorySelect";
import { CashFlowChart } from "./_components/charts";
import { LoadMore } from "./_components/LoadMore";
import {
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  FormError,
  ForbiddenBlock,
  LoadingBlock,
  Modal,
  PageHeader,
  darkBtn,
  dangerLinkBtn,
  inputCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "./_components/ui";
import { useFinanceAction } from "./_components/useFinanceAction";

type Filter = "all" | "uncategorized" | "in" | "out";

function RunwayBanner({ cashFlow, onAsk }: { cashFlow: CashFlow; onAsk: (seed: string) => void }) {
  // Drive the banner from runway_low, never from a null runway_months: null is
  // "not burning" OR "out of cash" depending on the flag and the burn.
  if (!cashFlow.runway_low) return null;
  const headline =
    cashFlow.runway_months === null
      ? "You are out of cash and still burning."
      : `Runway is under 6 months: ${cashFlow.runway_months} months left.`;
  return (
    <div className="bg-danger-50 border border-danger-200 rounded-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 rounded-full shadow-card text-danger-600">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-danger-600">{headline}</h2>
          <p className="text-sm text-danger-600 opacity-90 mt-0.5">Let&apos;s look at levers: costs, pricing or funding.</p>
        </div>
      </div>
      <button type="button" onClick={() => onAsk(advisorSeed(cashFlow))} className="bg-white border border-danger-200 text-danger-600 hover:bg-danger-50 px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold shadow-card transition-colors flex items-center gap-2">
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        Ask Finance Advisor
      </button>
    </div>
  );
}

// The Advisor now reads the founder's real cash, burn, runway and overdue invoices server-side
// (API slice e), so the seed is only a question and carries no figures from the client. (Live check: the
// wording "What levers should I look at first?" made the model return an empty completion, so avoid it.)
function advisorSeed(cf: CashFlow): string {
  return cf.runway_months === null
    ? "I am out of cash and still burning. Give me three ways to stretch what I have."
    : "Give me three ways to extend my runway.";
}

const SOURCE_LABEL: Record<TransactionSource, string> = {
  manual: "Manual",
  invoice: "Invoice",
  expense: "Expense",
  bank: "Bank",
  accounting: "Accounting",
  paystack: "Paystack",
  flutterwave: "Flutterwave",
};

/** Imported rows (payments and bank) keep their category editable; invoice and expense rows belong to their record. */
const CATEGORY_EDITABLE: TransactionSource[] = ["manual", "paystack", "flutterwave", "bank"];

function runwayTile(cf: CashFlow): { value: string; sub: string } {
  if (cf.runway_months !== null) return { value: `${cf.runway_months} months`, sub: "Cash on hand divided by burn" };
  if (cf.runway_low) return { value: "Out of cash", sub: "Still burning with no cash left" };
  return { value: "Not burning", sub: "No runway to project" };
}

function TransactionForm({
  initial,
  categories,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: Transaction;
  categories: string[];
  busy: boolean;
  error: FinanceError | null;
  onSubmit: (v: { date: string; description: string; category: string; amountMinor: number; direction: TransactionDirection }) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amount, setAmount] = useState(initial ? minorToInput(initial.amount_minor) : "");
  const [direction, setDirection] = useState<TransactionDirection>(initial?.direction ?? "out");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const minor = toMinor(amount);
    if (!description.trim()) return setLocalError("Add a description.");
    if (minor === null) return setLocalError("Enter an amount like 1500 or 1500.50.");
    setLocalError(null);
    onSubmit({ date, description: description.trim(), category: category.trim(), amountMinor: minor, direction });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-neutral-500">
        For money movements that are not an expense or an invoice. Spend with a receipt belongs under Expenses; do not add the same spend in both places.
      </p>
      <Field label="Type" htmlFor="tx-direction">
        <select id="tx-direction" className={inputCls} value={direction} onChange={(e) => setDirection(e.target.value as TransactionDirection)}>
          <option value="out">Money out</option>
          <option value="in">Money in</option>
        </select>
      </Field>
      <Field label="Description" htmlFor="tx-desc" error={error?.fieldErrors.description}>
        <input id="tx-desc" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (NGN)" htmlFor="tx-amount" error={error?.fieldErrors.amount_minor}>
          <input id="tx-amount" inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Date" htmlFor="tx-date" error={error?.fieldErrors.date}>
          <input id="tx-date" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Category (optional)" htmlFor="tx-cat" error={error?.fieldErrors.category}>
        <CategorySelect id="tx-cat" value={category} onChange={setCategory} options={categories} emptyLabel="No category" />
      </Field>
      <FormError message={localError ?? (error && !Object.keys(error.fieldErrors).length ? error.message : null)} />
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onCancel} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Saving" : initial ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}

const ADD_NEW = "__add_new__";

/** Inline category editor: pick one from the list, or add a new one. Saves on pick or on Set. */
function CategoryCell({
  tx,
  categories,
  busy,
  onSet,
}: {
  tx: Transaction;
  categories: string[];
  busy: boolean;
  onSet: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  if (!CATEGORY_EDITABLE.includes(tx.source)) {
    return tx.category ? (
      <span className="text-neutral-700 bg-white border border-neutral-200 px-2 py-1 rounded-input text-xs">{tx.category}</span>
    ) : (
      <span className="text-xs text-neutral-600">Uncategorized</span>
    );
  }
  if (adding) {
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            onSet(value.trim());
            setAdding(false);
            setValue("");
          }
        }}
      >
        <input
          aria-label={`New category for ${tx.description}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="New category"
          maxLength={120}
          autoComplete="off"
          className="text-xs bg-white border border-accent-600 text-accent-700 rounded-input px-2 py-1 max-md:min-h-11 w-32 outline-none font-medium"
        />
        <button type="submit" disabled={busy || !value.trim()} className={linkBtn}>
          Set
        </button>
        <button type="button" className={linkBtn} onClick={() => setAdding(false)}>
          Cancel
        </button>
      </form>
    );
  }
  const known = tx.category && !categories.some((c) => c.toLowerCase() === tx.category!.toLowerCase());
  return (
    <select
      aria-label={`Category for ${tx.description}`}
      value={tx.category ?? ""}
      disabled={busy}
      onChange={(e) => {
        if (e.target.value === ADD_NEW) setAdding(true);
        else if (e.target.value !== (tx.category ?? "")) onSet(e.target.value);
      }}
      className={`text-xs rounded-input px-2 py-1 max-md:min-h-11 max-w-[10rem] outline-none font-medium bg-white border ${
        tx.category ? "border-neutral-200 text-neutral-700" : "border-accent-600 text-accent-700"
      }`}
    >
      {!tx.category && <option value="">Add category</option>}
      {known && <option value={tx.category!}>{tx.category}</option>}
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
      <option value={ADD_NEW}>Add category...</option>
    </select>
  );
}

function filtersFor(filter: Filter): TransactionFilters {
  if (filter === "uncategorized") return { uncategorized: true };
  if (filter === "in" || filter === "out") return { direction: filter };
  return {};
}

function RowActions({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (tx.source === "manual") {
    return (
      <span className="inline-flex items-center gap-3">
        <button type="button" className={linkBtn} onClick={onEdit} aria-label={`Edit ${tx.description}`}>
          Edit
        </button>
        <button type="button" className={dangerLinkBtn} onClick={onDelete} aria-label={`Delete ${tx.description}`}>
          Delete
        </button>
      </span>
    );
  }
  if (tx.source === "invoice") {
    return (
      <Link href="/finance/invoices" className="text-xs text-neutral-500 hover:underline max-md:inline-flex max-md:items-center max-md:min-h-11">
        From an invoice. Mark it unpaid to change.
      </Link>
    );
  }
  if (tx.source === "expense") {
    return (
      <Link href="/finance/expenses" className="text-xs text-neutral-500 hover:underline max-md:inline-flex max-md:items-center max-md:min-h-11">
        From an expense. Edit it there.
      </Link>
    );
  }
  return <span className="text-xs text-neutral-600">Imported. Only the category can change.</span>;
}

function TxNote({ tx }: { tx: Transaction }) {
  if (tx.category !== "Paystack payout") return null;
  return <span className="block text-xs font-medium text-accent-700 mt-0.5">Paystack payout, not counted as income</span>;
}

export default function CashFlowPage() {
  const cashFlow = useCashFlow();
  const [filter, setFilter] = useState<Filter>("all");
  const transactions = useTransactions(filtersFor(filter));
  const uncategorized = useUncategorizedCount();
  const categoryList = useCategories();
  const categories = useMemo(() => (categoryList.data ?? []).map((c) => c.name), [categoryList.data]);
  const { openAiDrawer } = useAiDrawer();
  const { run, busy } = useFinanceAction();

  const [formFor, setFormFor] = useState<"new" | Transaction | null>(null);
  const [formError, setFormError] = useState<FinanceError | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);

  const refresh = async () => {
    await Promise.all([cashFlow.reload(), transactions.reload(), uncategorized.reload(), categoryList.reload()]);
  };

  const closeForm = () => {
    setFormFor(null);
    setFormError(null);
  };

  const today = todayIso();
  const visible = transactions.items;
  const uncategorizedCount = uncategorized.data ?? 0;
  const categorizeInline = async (tx: Transaction, category: string) => {
    const res = await run(() => updateTransaction(tx.id, { category: category || null }), { success: "Category saved." });
    if (res.ok) await refresh();
  };

  const submitForm = async (v: { date: string; description: string; category: string; amountMinor: number; direction: TransactionDirection }) => {
    setFormError(null);
    const editing = formFor && formFor !== "new" ? formFor : null;
    const res = editing
      ? await run(
          () =>
            updateTransaction(editing.id, {
              date: v.date,
              description: v.description,
              amount_minor: v.amountMinor,
              direction: v.direction,
              // Explicit null clears the category; only category may be null.
              category: v.category || null,
            }),
          { success: "Transaction updated.", quiet: true },
        )
      : await run(
          () =>
            createTransaction({
              date: v.date,
              description: v.description,
              amount_minor: v.amountMinor,
              direction: v.direction,
              ...(v.category ? { category: v.category } : {}),
            }),
          { success: "Transaction added.", quiet: true },
        );
    if (res.ok) {
      closeForm();
      await refresh();
    } else {
      setFormError(res.error);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await run(() => deleteTransaction(deleting.id), { success: "Transaction deleted." });
    setDeleting(null);
    if (res.ok) await refresh();
  };

  const header = (
    <PageHeader
      title="Cash Flow Analytics"
      subtitle="Monitor cash inflows, outflows, and net liquidity positions."
      action={
        <button type="button" onClick={() => setFormFor("new")} className={`${primaryBtn} w-fit`}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Add transaction
        </button>
      }
    />
  );

  if (cashFlow.status === "forbidden" || transactions.status === "forbidden") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <PageHeader title="Cash Flow Analytics" subtitle="Monitor cash inflows, outflows, and net liquidity positions." />
        <ForbiddenBlock />
      </div>
    );
  }

  const cf = cashFlow.data;
  const tile = cf ? runwayTile(cf) : null;
  const nudge = cf ? fundingCandidate(visible.filter((tx) => CATEGORY_EDITABLE.includes(tx.source)), cf.monthly_revenue, dismissedNudges) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}

      {cashFlow.status === "loading" ? (
        <LoadingBlock label="Loading cash flow" />
      ) : cashFlow.status === "error" || !cf ? (
        <ErrorBlock message={cashFlow.error ?? "Couldn't load cash flow."} onRetry={() => void cashFlow.reload()} />
      ) : (
        <>
          <RunwayBanner cashFlow={cf} onAsk={(seed) => openAiDrawer({ seed })} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-modal border border-neutral-200 shadow-card">
              <p className="text-xs text-neutral-500 font-medium uppercase">Cash on hand</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{formatMoney(cf.cash_on_hand, cf.currency)}</p>
              <span className="text-xs text-neutral-500 mt-2 block font-medium">Transactions dated today or earlier</span>
            </div>
            <div className="bg-white p-5 rounded-modal border border-neutral-200 shadow-card">
              <p className="text-xs text-neutral-500 font-medium uppercase">Monthly burn</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{formatMoney(cf.monthly_burn, cf.currency)}</p>
              <span className="text-xs text-neutral-500 mt-2 block font-medium">Net, average of the last 3 months, funding excluded</span>
            </div>
            <div className="bg-white p-5 rounded-modal border border-neutral-200 shadow-card">
              <p className="text-xs text-neutral-500 font-medium uppercase">Monthly revenue</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{formatMoney(cf.monthly_revenue, cf.currency)}</p>
              <span className="text-xs text-neutral-500 mt-2 block font-medium">Average of the last 3 months, funding excluded</span>
            </div>
            <div className="bg-white p-5 rounded-modal border border-neutral-200 shadow-card">
              <p className="text-xs text-neutral-500 font-medium uppercase">Runway</p>
              <p className={`text-2xl font-bold mt-1 ${cf.runway_low ? "text-danger-600" : "text-neutral-900"}`}>{tile?.value}</p>
              <span className="text-xs text-neutral-500 mt-2 block font-medium">{tile?.sub}</span>
            </div>
          </div>

          {nudge && (
            <div role="status" className="bg-accent-100 border border-accent-200 rounded-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-sm text-neutral-800">
                <span className="font-semibold">{formatMoney(nudge.amount_minor, nudge.currency)} came in uncategorised</span> ({plainText(nudge.description)}). Is this a raise or investment? Funding adds to your cash but is not counted as revenue.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={darkBtn} disabled={busy} onClick={() => void categorizeInline(nudge, "Funding")}>
                  Categorise as Funding
                </button>
                <button type="button" className={secondaryBtn} onClick={() => setDismissedNudges((d) => [...d, nudge.id])}>
                  It is revenue
                </button>
              </div>
            </div>
          )}

          {transactions.status === "ready" && visible.length === 0 && filter === "all" ? (
            <EmptyBlock
              icon={<Wallet className="w-6 h-6" aria-hidden="true" />}
              title="No transactions yet"
              body="Add your first transaction to see cash on hand, burn and runway. Spending is best logged under Expenses, and invoices post to the ledger when you mark them paid."
            >
              <button type="button" onClick={() => setFormFor("new")} className={darkBtn}>
                <Plus className="w-4 h-4" aria-hidden="true" /> Add your first transaction
              </button>
              <Link href="/finance/expenses" className={secondaryBtn}>
                Log an expense
              </Link>
            </EmptyBlock>
          ) : (
            <>
              <div className="bg-white rounded-modal border border-neutral-200 p-6 shadow-card space-y-4">
                <h2 className="font-bold text-neutral-900">Cash flow, last 6 months</h2>
                <CashFlowChart cashFlow={cf} />
              </div>

              <div className="bg-white rounded-modal border border-neutral-200 overflow-hidden shadow-card">
                <div className="p-4 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
                  <h2 className="font-bold text-neutral-900">Transactions</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        ["all", "All"],
                        ["uncategorized", "Needs a category"],
                        ["in", "Money in"],
                        ["out", "Money out"],
                      ] as [Filter, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        aria-pressed={filter === key}
                        className={`px-3 py-1 max-md:min-h-11 rounded-pill text-xs font-semibold transition-colors ${
                          filter === key ? "bg-brand-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {label}
                        {key === "uncategorized" && uncategorizedCount > 0 ? ` (${uncategorizedCount})` : ""}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`${secondaryBtn} !py-1 !px-3 text-xs`}
                      disabled={busy}
                      onClick={() => void run(() => exportTransactionsXlsx(filtersFor(filter)), { success: "Transactions exported to Excel.", fallback: "Couldn't export the transactions. Try again." })}
                    >
                      <Download className="w-4 h-4" aria-hidden="true" /> Export Excel
                    </button>
                  </div>
                </div>
                {transactions.status === "loading" ? (
                  <LoadingBlock label="Loading transactions" />
                ) : transactions.status === "error" ? (
                  <ErrorBlock message={transactions.error ?? "Couldn't load transactions."} onRetry={() => void transactions.reload()} />
                ) : visible.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 font-medium text-sm">No transactions match this filter.</div>
                ) : (
                  <>
                    <ul className="md:hidden divide-y divide-neutral-100" aria-label="Transactions">
                      {visible.map((tx) => (
                        <li key={tx.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-neutral-900 break-words">{plainText(tx.description)}</p>
                              <TxNote tx={tx} />
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {formatDate(tx.date)}
                                {tx.date > today ? " (scheduled)" : ""}
                              </p>
                            </div>
                            <p className={`font-bold whitespace-nowrap ${tx.direction === "in" ? "text-brand-800" : "text-neutral-900"}`}>
                              {tx.direction === "in" ? "+" : "-"}
                              {formatMoney(tx.amount_minor, tx.currency)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider border border-neutral-200">
                              {SOURCE_LABEL[tx.source] ?? tx.source}
                            </span>
                            <CategoryCell tx={tx} categories={categories} busy={busy} onSet={(c) => void categorizeInline(tx, c)} />
                          </div>
                          <RowActions tx={tx} onEdit={() => setFormFor(tx)} onDelete={() => setDeleting(tx)} />
                        </li>
                      ))}
                    </ul>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50/50 border-b border-neutral-100 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-4">Description</th>
                            <th className="py-4 px-4">Category</th>
                            <th className="py-4 px-4">Source</th>
                            <th className="py-4 px-4 text-right">Amount</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-sm">
                          {visible.map((tx) => (
                            <tr key={tx.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="py-4 px-6 text-neutral-600 font-medium whitespace-nowrap">
                                {formatDate(tx.date)}
                                {tx.date > today && (
                                  <span className="ml-2 bg-accent-100 text-accent-700 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider">Scheduled</span>
                                )}
                              </td>
                              <td className="py-4 px-4 font-semibold text-neutral-900">
                                {plainText(tx.description)}
                                <TxNote tx={tx} />
                              </td>
                              <td className="py-4 px-4">
                                <CategoryCell tx={tx} categories={categories} busy={busy} onSet={(c) => void categorizeInline(tx, c)} />
                              </td>
                              <td className="py-4 px-4">
                                <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider border border-neutral-200">
                                  {SOURCE_LABEL[tx.source] ?? tx.source}
                                </span>
                              </td>
                              <td className={`py-4 px-4 font-bold text-right whitespace-nowrap ${tx.direction === "in" ? "text-brand-800" : "text-neutral-900"}`}>
                                {tx.direction === "in" ? "+" : "-"}
                                {formatMoney(tx.amount_minor, tx.currency)}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <RowActions tx={tx} onEdit={() => setFormFor(tx)} onDelete={() => setDeleting(tx)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <LoadMore list={transactions} noun="transactions" />
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {formFor && (
        <Modal title={formFor === "new" ? "Add transaction" : "Edit transaction"} onClose={closeForm}>
          <TransactionForm
            initial={formFor === "new" ? undefined : formFor}
            categories={categories}
            busy={busy}
            error={formError}
            onSubmit={(v) => void submitForm(v)}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this transaction?"
          body={`"${plainText(deleting.description)}" will be removed and your cash on hand and runway will change. This cannot be undone.`}
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
