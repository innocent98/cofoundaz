"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, Plus, Wallet } from "lucide-react";
import { useCashFlow, useTransactions, useKnownCategories } from "@/hooks/useFinanceApi";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type CashFlow,
  type Transaction,
  type TransactionDirection,
  type FinanceError,
} from "@/lib/api/finance";
import { useAiDrawer } from "@/components/ai-drawer-context";
import { formatDate, formatMoney, plainText, shortMonth, todayIso, toMinor, minorToInput } from "@/lib/finance/format";
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

function RunwayBanner({ cashFlow, onAsk }: { cashFlow: CashFlow; onAsk: () => void }) {
  // Drive the banner from runway_low, never from a null runway_months: null is
  // "not burning" OR "out of cash" depending on the flag and the burn.
  if (!cashFlow.runway_low) return null;
  const headline =
    cashFlow.runway_months === null
      ? "You are out of cash and still burning."
      : `Runway is under 6 months: ${cashFlow.runway_months} months left.`;
  return (
    <div className="bg-red-50 border border-red-200 rounded-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 rounded-full shadow-card text-red-600">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-red-600">{headline}</h2>
          <p className="text-sm text-red-600 opacity-90 mt-0.5">Let&apos;s look at levers: costs, pricing or funding.</p>
        </div>
      </div>
      <button type="button" onClick={onAsk} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-card text-sm font-semibold shadow-card transition-colors flex items-center gap-2">
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        Ask Finance Advisor
      </button>
    </div>
  );
}

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
      <p className="text-xs text-sage-500">
        For money movements that are not an expense or an invoice. Log spend under Expenses so it is not counted twice.
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
        <input id="tx-cat" list="tx-cat-list" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} maxLength={120} />
        <datalist id="tx-cat-list">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
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
  const [value, setValue] = useState("");
  if (tx.category) {
    return <span className="text-sage-700 bg-white border border-sage-200 px-2 py-1 rounded-input text-xs">{tx.category}</span>;
  }
  if (tx.source !== "manual") return <span className="text-xs text-sage-400">Uncategorized</span>;
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSet(value.trim());
      }}
    >
      <input
        aria-label={`Category for ${tx.description}`}
        list="tx-cat-list-inline"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add category"
        maxLength={120}
        className="text-xs bg-white border border-copper-600 text-copper-700 rounded-input px-2 py-1 w-32 outline-none font-medium"
      />
      <datalist id="tx-cat-list-inline">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <button type="submit" disabled={busy || !value.trim()} className={linkBtn}>
        Set
      </button>
    </form>
  );
}

export default function CashFlowPage() {
  const cashFlow = useCashFlow();
  const transactions = useTransactions();
  const categories = useKnownCategories();
  const { openAiDrawer } = useAiDrawer();
  const { run, busy } = useFinanceAction();

  const [filter, setFilter] = useState<Filter>("all");
  const [formFor, setFormFor] = useState<"new" | Transaction | null>(null);
  const [formError, setFormError] = useState<FinanceError | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const refresh = async () => {
    await Promise.all([cashFlow.reload(), transactions.reload()]);
  };

  const closeForm = () => {
    setFormFor(null);
    setFormError(null);
  };

  const today = todayIso();
  const all = useMemo(() => transactions.data ?? [], [transactions.data]);
  const uncategorizedCount = all.filter((t) => !t.category).length;
  const visible = all.filter((t) => {
    if (filter === "uncategorized") return !t.category;
    if (filter === "in" || filter === "out") return t.direction === filter;
    return true;
  });

  const categorizeInline = async (tx: Transaction, category: string) => {
    const res = await run(() => updateTransaction(tx.id, { category }), { success: "Category saved." });
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
  const maxBar = cf ? Math.max(1, ...cf.by_month.flatMap((m) => [m.inflow, m.outflow])) : 1;
  const tile = cf ? runwayTile(cf) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}

      {cashFlow.status === "loading" || transactions.status === "loading" ? (
        <LoadingBlock label="Loading cash flow" />
      ) : cashFlow.status === "error" || !cf ? (
        <ErrorBlock message={cashFlow.error ?? "Couldn't load cash flow."} onRetry={() => void cashFlow.reload()} />
      ) : (
        <>
          <RunwayBanner cashFlow={cf} onAsk={openAiDrawer} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
              <p className="text-xs text-sage-500 font-medium uppercase">Cash on hand</p>
              <p className="text-2xl font-bold text-sage-900 mt-1">{formatMoney(cf.cash_on_hand, cf.currency)}</p>
              <span className="text-xs text-sage-500 mt-2 block font-medium">Transactions dated today or earlier</span>
            </div>
            <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
              <p className="text-xs text-sage-500 font-medium uppercase">Monthly burn</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatMoney(cf.monthly_burn, cf.currency)}</p>
              <span className="text-xs text-sage-500 mt-2 block font-medium">Net, average of the last 3 months</span>
            </div>
            <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
              <p className="text-xs text-sage-500 font-medium uppercase">Monthly money in</p>
              <p className="text-2xl font-bold text-sage-900 mt-1">{formatMoney(cf.monthly_revenue, cf.currency)}</p>
              <span className="text-xs text-sage-500 mt-2 block font-medium">All inflows, average of the last 3 months</span>
            </div>
            <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
              <p className="text-xs text-sage-500 font-medium uppercase">Runway</p>
              <p className={`text-2xl font-bold mt-1 ${cf.runway_low ? "text-red-600" : "text-sage-900"}`}>{tile?.value}</p>
              <span className="text-xs text-sage-500 mt-2 block font-medium">{tile?.sub}</span>
            </div>
          </div>

          {all.length === 0 ? (
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
              <div className="bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-4">
                <h2 className="font-bold text-sage-900">Cash flow, last 6 months</h2>
                <div className="h-48 w-full flex items-end justify-between gap-2 border-b border-sage-100 pb-2">
                  {cf.by_month.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col justify-end gap-1 items-center h-full" title={`${m.month}: in ${formatMoney(m.inflow, cf.currency)}, out ${formatMoney(m.outflow, cf.currency)}`}>
                      <div className="w-full flex gap-1 justify-center items-end h-[80%]">
                        <div className="w-1/3 bg-green-800 rounded-t-input" style={{ height: `${(m.inflow / maxBar) * 100}%` }}></div>
                        <div className="w-1/3 bg-red-600 rounded-t-input" style={{ height: `${(m.outflow / maxBar) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] text-sage-400 font-medium">{shortMonth(m.month)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-sage-600 justify-center">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-input bg-green-800"></div> Money in</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-input bg-red-600"></div> Money out</div>
                </div>
              </div>

              <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
                <div className="p-4 border-b border-sage-100 flex flex-wrap items-center justify-between gap-3 bg-sage-50/50">
                  <h2 className="font-bold text-sage-900">Transactions</h2>
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
                        className={`px-3 py-1 rounded-pill text-xs font-semibold transition-colors ${
                          filter === key ? "bg-green-900 text-white" : "bg-white border border-sage-200 text-sage-600 hover:bg-sage-50"
                        }`}
                      >
                        {label}
                        {key === "uncategorized" && uncategorizedCount > 0 ? ` (${uncategorizedCount})` : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-sage-50/50 border-b border-sage-100 text-xs font-bold text-sage-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-4">Description</th>
                        <th className="py-4 px-4">Category</th>
                        <th className="py-4 px-4">Source</th>
                        <th className="py-4 px-4 text-right">Amount</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                      {visible.map((tx) => (
                        <tr key={tx.id} className="hover:bg-sage-50/50 transition-colors">
                          <td className="py-4 px-6 text-sage-600 font-medium whitespace-nowrap">
                            {formatDate(tx.date)}
                            {tx.date > today && (
                              <span className="ml-2 bg-copper-100 text-copper-700 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider">Scheduled</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-semibold text-sage-900">{plainText(tx.description)}</td>
                          <td className="py-4 px-4">
                            <CategoryCell tx={tx} categories={categories} busy={busy} onSet={(c) => void categorizeInline(tx, c)} />
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-sage-100 text-sage-600 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider border border-sage-200">
                              {tx.source}
                            </span>
                          </td>
                          <td className={`py-4 px-4 font-bold text-right whitespace-nowrap ${tx.direction === "in" ? "text-green-800" : "text-sage-900"}`}>
                            {tx.direction === "in" ? "+" : "-"}
                            {formatMoney(tx.amount_minor, tx.currency)}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            {tx.source === "manual" ? (
                              <span className="inline-flex items-center gap-3">
                                <button type="button" className={linkBtn} onClick={() => setFormFor(tx)} aria-label={`Edit ${tx.description}`}>
                                  Edit
                                </button>
                                <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(tx)} aria-label={`Delete ${tx.description}`}>
                                  Delete
                                </button>
                              </span>
                            ) : tx.source === "invoice" ? (
                              <Link href="/finance/invoices" className="text-xs text-sage-500 hover:underline">
                                From an invoice. Mark it unpaid to change.
                              </Link>
                            ) : tx.source === "expense" ? (
                              <Link href="/finance/expenses" className="text-xs text-sage-500 hover:underline">
                                From an expense. Edit it there.
                              </Link>
                            ) : (
                              <span className="text-xs text-sage-400">Managed by its source</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visible.length === 0 && <div className="p-8 text-center text-sage-500 font-medium text-sm">No transactions match this filter.</div>}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {transactions.status === "error" && cf && <ErrorBlock message={transactions.error ?? "Couldn't load transactions."} onRetry={() => void transactions.reload()} />}

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
