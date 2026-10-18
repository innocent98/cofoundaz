"use client";

import React, { useState } from "react";
import { FileText, Plus, Printer, Send } from "lucide-react";
import { useInvoices } from "@/hooks/useFinanceApi";
import {
  createInvoice,
  deleteInvoice,
  markInvoicePaid,
  markInvoiceUnpaid,
  sendInvoice,
  updateInvoice,
  type FinanceError,
  type Invoice,
  type InvoiceInput,
  type InvoiceStatus,
  type InvoiceTerms,
} from "@/lib/api/finance";
import { formatDate, formatMoney, minorToInput } from "@/lib/finance/format";
import { parseLine, previewTotals, type DraftLine } from "@/lib/finance/invoiceMath";
import { printInvoice, type PrintableInvoice } from "@/lib/finance/printInvoice";
import {
  ConfirmDialog,
  EmptyBlock,
  Field,
  FormError,
  ForbiddenBlock,
  PageHeader,
  ResourceGate,
  dangerLinkBtn,
  darkBtn,
  inputCls,
  labelCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "../_components/ui";
import { useFinanceAction } from "../_components/useFinanceAction";
import { useToast } from "../ToastContext";

const FILTERS: { key: "all" | InvoiceStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

const TERMS: { value: InvoiceTerms; label: string }[] = [
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "due_on_receipt", label: "Due on receipt" },
];

type Pending =
  | { kind: "send"; invoice: Invoice }
  | { kind: "paid"; invoice: Invoice }
  | { kind: "unpaid"; invoice: Invoice }
  | { kind: "delete"; invoice: Invoice };

function printableFromInvoice(inv: Invoice): PrintableInvoice {
  return {
    number: inv.number,
    clientName: inv.client_name,
    clientEmail: inv.client_email,
    currency: inv.currency,
    lines: inv.line_items.map((l) => ({ description: l.description, quantity: l.quantity, unitMinor: l.unit_price_minor, amountMinor: l.amount_minor })),
    subtotalMinor: inv.subtotal_minor,
    taxPercent: inv.tax_percent,
    taxMinor: inv.tax_minor,
    totalMinor: inv.total_minor,
    issuedOn: inv.issued_on,
    dueOn: inv.due_on,
    status: inv.status,
  };
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cls =
    status === "paid"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "overdue"
        ? "bg-red-50 text-red-600 border-red-200"
        : status === "sent"
          ? "bg-copper-100 text-copper-700 border-copper-200"
          : "bg-sage-100 text-sage-600 border-sage-200";
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-pill border uppercase tracking-wider ${cls}`}>{status}</span>;
}

function Builder({
  editing,
  onClose,
  onSaved,
}: {
  editing: Invoice | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { triggerToast } = useToast();
  const { run, busy } = useFinanceAction();
  const [clientName, setClientName] = useState(editing?.client_name ?? "");
  const [clientEmail, setClientEmail] = useState(editing?.client_email ?? "");
  const [lines, setLines] = useState<DraftLine[]>(
    editing
      ? editing.line_items.map((l) => ({ description: l.description, quantity: String(l.quantity), price: minorToInput(l.unit_price_minor) }))
      : [{ description: "", quantity: "1", price: "" }],
  );
  const [taxPercent, setTaxPercent] = useState(editing ? String(editing.tax_percent) : "0");
  const [terms, setTerms] = useState<InvoiceTerms>(editing?.terms ?? "net_30");
  const [error, setError] = useState<FinanceError | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);

  const tax = Number(taxPercent);
  const totals = previewTotals(lines, tax);
  const setLine = (i: number, patch: Partial<DraftLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const buildInput = (): InvoiceInput | null => {
    if (!clientName.trim()) return fail("Add the client's name.");
    if (!clientEmail.trim()) return fail("Add the client's email. The invoice is sent there.");
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) return fail("Tax must be between 0 and 100.");
    const parsed = lines.map(parseLine);
    if (parsed.some((l) => l === null)) return fail("Each line needs a description, a whole quantity of 1 or more, and a price like 1500 or 1500.50.");
    setLocalError(null);
    return {
      client_name: clientName.trim(),
      client_email: clientEmail.trim(),
      line_items: parsed as NonNullable<(typeof parsed)[number]>[],
      tax_percent: tax,
      terms,
    };
  };

  function fail(message: string): null {
    setLocalError(message);
    return null;
  }

  // Saves the draft (create or PATCH), then optionally sends it. Totals come from
  // the response, never from the preview.
  const save = async (thenSend: boolean) => {
    const input = buildInput();
    if (!input) return;
    setError(null);
    const saved = await run(() => (editing ? updateInvoice(editing.id, input) : createInvoice(input)), { quiet: true });
    if (!saved.ok) {
      setError(saved.error);
      setConfirmSend(false);
      return;
    }
    if (thenSend) {
      const sent = await run(() => sendInvoice(saved.data.id), { success: `Invoice ${saved.data.number} sent to ${saved.data.client_email}.` });
      if (!sent.ok) {
        // The draft exists; keep the user on the list so they can retry the send.
        triggerToast(`Invoice ${saved.data.number} was saved as a draft but not sent.`, "error");
      }
    } else {
      triggerToast(`Draft ${saved.data.number} saved.`);
    }
    await onSaved();
    onClose();
  };

  const printPreview = () => {
    const parsed = lines.map(parseLine);
    const ok = printInvoice({
      number: editing?.number ?? "Draft",
      clientName: clientName || "Client",
      clientEmail,
      currency: "NGN",
      lines: parsed.flatMap((l) => (l ? [{ description: l.description, quantity: l.quantity, unitMinor: l.unit_price_minor, amountMinor: l.quantity * l.unit_price_minor }] : [])),
      subtotalMinor: totals.subtotal,
      taxPercent: Number.isFinite(tax) ? tax : 0,
      taxMinor: totals.tax,
      totalMinor: totals.total,
      issuedOn: null,
      dueOn: null,
      status: "draft",
    });
    if (!ok) triggerToast("Your browser blocked the print window. Allow pop-ups and try again.", "error");
  };

  const lineErr = error?.fieldErrors.line_items;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-sage-100 pb-4">
          <h2 className="text-xl font-display font-bold text-sage-900">{editing ? `Edit ${editing.number}` : "Invoice builder"}</h2>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-sage-500 hover:text-sage-700 transition-colors">
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Client name" htmlFor="inv-client" error={error?.fieldErrors.client_name}>
              <input id="inv-client" className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={200} />
            </Field>
            <Field label="Client email" htmlFor="inv-email" error={error?.fieldErrors.client_email}>
              <input id="inv-email" type="email" className={inputCls} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </Field>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className={labelCls}>Line items (NGN)</span>
              <button type="button" onClick={() => setLines((ls) => [...ls, { description: "", quantity: "1", price: "" }])} className="text-xs font-bold text-copper-600 hover:underline">
                + Add item
              </button>
            </div>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[5rem_1fr_auto] gap-2 items-center">
                <input aria-label={`Line ${i + 1} description`} placeholder="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} className={`${inputCls} col-span-3`} />
                <input aria-label={`Line ${i + 1} quantity`} placeholder="Qty" inputMode="numeric" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} className={inputCls} />
                <input aria-label={`Line ${i + 1} unit price`} placeholder="Price" inputMode="decimal" value={l.price} onChange={(e) => setLine(i, { price: e.target.value })} className={inputCls} />
                {lines.length > 1 ? (
                  <button type="button" aria-label={`Remove line ${i + 1}`} onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className={dangerLinkBtn}>
                    Remove
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
            {lineErr && <p className="text-xs font-medium text-red-600">{lineErr}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Field label="Tax %" htmlFor="inv-tax" error={error?.fieldErrors.tax_percent}>
                <input id="inv-tax" type="number" min={0} max={100} step="any" className={inputCls} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Terms" htmlFor="inv-terms" error={error?.fieldErrors.terms}>
                <select id="inv-terms" className={inputCls} value={terms} onChange={(e) => setTerms(e.target.value as InvoiceTerms)}>
                  {TERMS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <FormError message={localError ?? (error && !Object.keys(error.fieldErrors).length ? error.message : null)} />

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-sage-100">
          <button type="button" onClick={() => void save(false)} disabled={busy} className={`${secondaryBtn} flex-1`}>
            {busy ? "Saving" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (buildInput()) setConfirmSend(true);
            }}
            disabled={busy}
            className={`${darkBtn} flex-1`}
          >
            <Send className="w-4 h-4" aria-hidden="true" /> Save and send
          </button>
          <button type="button" onClick={printPreview} className={`${secondaryBtn} w-full`}>
            <Printer className="w-4 h-4" aria-hidden="true" /> Print or save as PDF
          </button>
        </div>
      </div>

      <div className="bg-sage-50 rounded-modal border border-sage-200 p-8 shadow-card flex flex-col justify-between">
        <div className="bg-white border border-sage-200 shadow-card p-8 rounded-card min-h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-2xl font-bold text-sage-900">INVOICE</p>
              <p className="text-xs text-sage-500 font-medium">{editing?.number ?? "Number assigned when saved"}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sage-900">{clientName || "Client name"}</p>
              <p className="text-xs text-sage-500 font-medium">{TERMS.find((t) => t.value === terms)?.label}</p>
            </div>
          </div>
          <div className="flex-1 border-y border-sage-100 py-4 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-sage-400 border-b border-sage-50">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const p = parseLine(l);
                  return p ? (
                    <tr key={i}>
                      <td className="py-2 text-sage-800 font-medium">
                        {p.description} (x{p.quantity})
                      </td>
                      <td className="py-2 text-right font-bold text-sage-900">{formatMoney(p.quantity * p.unit_price_minor)}</td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
          </div>
          <div className="w-full flex flex-col items-end text-sm space-y-1">
            <div className="w-1/2 flex justify-between font-medium text-sage-600">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="w-1/2 flex justify-between font-medium text-sage-600">
              <span>Tax ({Number.isFinite(tax) ? tax : 0}%)</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
            <div className="w-1/2 flex justify-between font-bold text-lg text-sage-900 pt-2 border-t border-sage-100">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-sage-400 font-bold uppercase tracking-widest mt-6">Preview. The server confirms the totals when you save.</p>
      </div>

      {confirmSend && (
        <ConfirmDialog
          title="Send this invoice?"
          body={`This saves the invoice and emails it to ${clientEmail.trim()}. Once sent it cannot be recalled or edited.`}
          confirmLabel="Send invoice"
          busy={busy}
          onConfirm={() => void save(true)}
          onCancel={() => setConfirmSend(false)}
        />
      )}
    </div>
  );
}

export default function InvoicesPage() {
  const invoices = useInvoices();
  const { run, busy } = useFinanceAction();
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [builder, setBuilder] = useState<{ editing: Invoice | null } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const { triggerToast } = useToast();

  const header = (
    <PageHeader
      title="Invoices"
      subtitle="Manage client billings, payments, and receivables."
      action={
        !builder && (
          <button type="button" onClick={() => setBuilder({ editing: null })} className={`${primaryBtn} w-fit`}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Create invoice
          </button>
        )
      }
    />
  );

  if (invoices.status === "forbidden") {
    return (
      <div className="space-y-6 animate-fadeIn">
        {header}
        <ForbiddenBlock />
      </div>
    );
  }

  const toggleAutoRemind = async (inv: Invoice) => {
    const res = await run(() => updateInvoice(inv.id, { auto_remind: !inv.auto_remind }), {
      success: inv.auto_remind ? "Auto-remind turned off." : "Auto-remind turned on.",
    });
    if (res.ok) await invoices.reload();
  };

  const confirmPending = async () => {
    if (!pending) return;
    const inv = pending.invoice;
    const res =
      pending.kind === "send"
        ? await run(() => sendInvoice(inv.id), { success: `Invoice ${inv.number} sent to ${inv.client_email}.` })
        : pending.kind === "paid"
          ? await run(() => markInvoicePaid(inv.id), { success: `Invoice ${inv.number} marked paid. ${formatMoney(inv.total_minor, inv.currency)} added to cash on hand.` })
          : pending.kind === "unpaid"
            ? await run(() => markInvoiceUnpaid(inv.id), { success: `Invoice ${inv.number} marked unpaid. The payment was removed from your books.` })
            : await run(() => deleteInvoice(inv.id), { success: `Draft ${inv.number} deleted.` });
    setPending(null);
    if (res.ok) await invoices.reload();
  };

  const pendingCopy = (p: Pending) => {
    const inv = p.invoice;
    switch (p.kind) {
      case "send":
        return { title: "Send this invoice?", body: `${inv.number} will be emailed to ${inv.client_email}. Once sent it cannot be recalled or edited.`, label: "Send invoice", danger: false };
      case "paid":
        return { title: "Mark as paid?", body: `This adds ${formatMoney(inv.total_minor, inv.currency)} to your cash on hand today and updates your runway.`, label: "Mark paid", danger: false };
      case "unpaid":
        return { title: "Mark as unpaid?", body: `This removes the ${formatMoney(inv.total_minor, inv.currency)} payment from your books and the invoice goes back to sent.`, label: "Mark unpaid", danger: false };
      default:
        return { title: "Delete this draft?", body: `${inv.number} will be removed. This cannot be undone.`, label: "Delete", danger: true };
    }
  };

  const doPrint = (inv: Invoice) => {
    if (!printInvoice(printableFromInvoice(inv))) triggerToast("Your browser blocked the print window. Allow pop-ups and try again.", "error");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}
      {builder ? (
        <Builder editing={builder.editing} onClose={() => setBuilder(null)} onSaved={invoices.reload} />
      ) : (
        <ResourceGate resource={invoices} loadingLabel="Loading invoices">
          {(all) => {
            if (all.length === 0) {
              return (
                <EmptyBlock icon={<FileText className="w-6 h-6" aria-hidden="true" />} title="No invoices yet" body="Create your first invoice, send it to a client, and record the payment to move your cash flow and runway.">
                  <button type="button" onClick={() => setBuilder({ editing: null })} className={darkBtn}>
                    <Plus className="w-4 h-4" aria-hidden="true" /> Create your first invoice
                  </button>
                </EmptyBlock>
              );
            }
            const shown = filter === "all" ? all : all.filter((i) => i.status === filter);
            return (
              <>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      aria-pressed={filter === f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                        filter === f.key ? "bg-green-900 text-white" : "bg-white border border-sage-200 text-sage-600 hover:bg-sage-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-sage-50/50 border-b border-sage-100 text-xs text-sage-400 font-bold uppercase tracking-wider">
                          <th className="py-4 px-6">Invoice</th>
                          <th className="py-4 px-4">Client</th>
                          <th className="py-4 px-4">Due</th>
                          <th className="py-4 px-4 text-right">Amount</th>
                          <th className="py-4 px-4 text-center">Auto-remind</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sage-100 text-sm">
                        {shown.map((inv) => (
                          <tr key={inv.id} className="hover:bg-sage-50/50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-sage-900">{inv.number}</td>
                            <td className="py-4 px-4 text-sage-600 font-medium">
                              {inv.client_name}
                              <span className="block text-xs text-sage-400">{inv.client_email}</span>
                            </td>
                            <td className="py-4 px-4 text-sage-500 font-medium">{inv.due_on ? formatDate(inv.due_on) : "Set when sent"}</td>
                            <td className="py-4 px-4 font-bold text-sage-900 text-right">{formatMoney(inv.total_minor, inv.currency)}</td>
                            <td className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={inv.auto_remind}
                                disabled={busy}
                                onChange={() => void toggleAutoRemind(inv)}
                                aria-label={`Auto-remind for ${inv.number}`}
                                className="accent-green-900 cursor-pointer"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-3">
                                {inv.status === "draft" && (
                                  <>
                                    <button type="button" className={linkBtn} onClick={() => setBuilder({ editing: inv })} aria-label={`Edit ${inv.number}`}>
                                      Edit
                                    </button>
                                    <button type="button" className={linkBtn} onClick={() => setPending({ kind: "send", invoice: inv })} aria-label={`Send ${inv.number}`}>
                                      Send
                                    </button>
                                    <button type="button" className={dangerLinkBtn} onClick={() => setPending({ kind: "delete", invoice: inv })} aria-label={`Delete ${inv.number}`}>
                                      Delete
                                    </button>
                                  </>
                                )}
                                {(inv.status === "sent" || inv.status === "overdue") && (
                                  <button type="button" className={linkBtn} onClick={() => setPending({ kind: "paid", invoice: inv })} aria-label={`Mark ${inv.number} paid`}>
                                    Mark paid
                                  </button>
                                )}
                                {inv.status === "paid" && (
                                  <button type="button" className={linkBtn} onClick={() => setPending({ kind: "unpaid", invoice: inv })} aria-label={`Mark ${inv.number} unpaid`}>
                                    Mark unpaid
                                  </button>
                                )}
                                <button type="button" className={linkBtn} onClick={() => doPrint(inv)} aria-label={`Print ${inv.number}`}>
                                  Print
                                </button>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {shown.length === 0 && <div className="p-8 text-center text-sage-500 font-medium text-sm">No invoices with this status.</div>}
                  </div>
                </div>
                <p className="text-xs text-sage-500">Auto-remind is saved on the invoice, but reminders are not sent automatically yet. Overdue is worked out from the due date.</p>
              </>
            );
          }}
        </ResourceGate>
      )}

      {pending && (
        <ConfirmDialog
          title={pendingCopy(pending).title}
          body={pendingCopy(pending).body}
          confirmLabel={pendingCopy(pending).label}
          danger={pendingCopy(pending).danger}
          busy={busy}
          onConfirm={() => void confirmPending()}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
