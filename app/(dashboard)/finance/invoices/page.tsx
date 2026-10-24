"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, FileText, Plus, Printer, Send } from "lucide-react";
import { useInvoices } from "@/hooks/useFinanceApi";
import {
  createInvoice,
  createPayLink,
  deleteInvoice,
  downloadInvoicePdf,
  markInvoicePaid,
  markInvoiceUnpaid,
  remindInvoice,
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
import { printInvoice } from "@/lib/finance/printInvoice";
import { hasNonLatin1, reminderView } from "@/lib/finance/reminders";
import { LoadMore } from "../_components/LoadMore";
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
  | { kind: "remind"; invoice: Invoice }
  | { kind: "send"; invoice: Invoice }
  | { kind: "paid"; invoice: Invoice }
  | { kind: "unpaid"; invoice: Invoice }
  | { kind: "delete"; invoice: Invoice };

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
  const [autoRemind, setAutoRemind] = useState(editing?.auto_remind ?? false);
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
    // Create has no auto_remind field, so a new invoice gets it in a second call.
    const saved = await run(
      async () => {
        if (editing) return updateInvoice(editing.id, { ...input, auto_remind: autoRemind });
        const created = await createInvoice(input);
        return autoRemind ? updateInvoice(created.id, { auto_remind: true }) : created;
      },
      { quiet: true },
    );
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

          {(hasNonLatin1(clientName) || lines.some((l) => hasNonLatin1(l.description))) && (
            <p className="text-xs font-medium text-copper-700 bg-copper-100/60 border border-copper-200 rounded-input px-3 py-2">
              The invoice PDF can only print basic Latin letters. Other characters, such as dotted Yoruba letters, will show as ? in the PDF. The email and this screen are unaffected.
            </p>
          )}

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

        <label className="flex items-start gap-2 text-sm text-sage-700">
          <input type="checkbox" checked={autoRemind} onChange={(e) => setAutoRemind(e.target.checked)} className="accent-green-900 mt-0.5" />
          <span>
            Auto-remind the client when overdue
            <span className="block text-xs text-sage-500">After the due date they get an email with the invoice attached, then one every 7 days, up to 8.</span>
          </span>
        </label>

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
                <tr className="text-left text-xs text-sage-600 border-b border-sage-50">
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
        <p className="text-center text-[10px] text-sage-600 font-bold uppercase tracking-widest mt-6">Preview. The server confirms the totals when you save.</p>
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

function payTag(inv: Invoice): string | null {
  if (inv.status !== "paid" || !inv.paid_via) return null;
  return `Paid via ${inv.paid_via === "paystack" ? "Paystack" : "Flutterwave"}`;
}

function InvoiceDetail({
  invoice,
  nowMs,
  busy,
  onClose,
  onAction,
}: {
  invoice: Invoice;
  nowMs: number;
  busy: boolean;
  onClose: () => void;
  onAction: (a: RowAction) => void;
}) {
  const rem = reminderView(invoice, nowMs);
  const tag = payTag(invoice);
  const [copied, setCopied] = useState(false);
  return (
    <Modal title={`Invoice ${invoice.number}`} onClose={onClose} wide>
      <div className="relative space-y-4 text-sm">
        {invoice.status === "paid" && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-0 -rotate-12 border-4 border-green-800/70 text-green-800/70 font-bold text-2xl px-3 py-1 rounded-card tracking-widest"
          >
            PAID
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} />
          {tag && <span className="bg-green-50 text-green-800 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider">{tag}</span>}
        </div>
        <div>
          <p className="font-bold text-sage-900">{invoice.client_name}</p>
          <p className="text-xs text-sage-500">{invoice.client_email}</p>
          <p className="text-xs text-sage-500 mt-1">
            Issued {formatDate(invoice.issued_on)} · Due {formatDate(invoice.due_on)}
            {invoice.paid_at ? ` · Paid ${formatDate(invoice.paid_at)}` : ""}
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-sage-600 border-b border-sage-100">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((l, i) => (
              <tr key={i}>
                <td className="py-1.5 text-sage-800">
                  {l.description} (x{l.quantity})
                </td>
                <td className="py-1.5 text-right font-semibold text-sage-900">{formatMoney(l.amount_minor, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-0.5 text-sage-600">
          <p>Subtotal {formatMoney(invoice.subtotal_minor, invoice.currency)}</p>
          <p>
            Tax ({invoice.tax_percent}%) {formatMoney(invoice.tax_minor, invoice.currency)}
          </p>
          <p className="font-bold text-lg text-sage-900">Total {formatMoney(invoice.total_minor, invoice.currency)}</p>
        </div>

        {(invoice.status === "sent" || invoice.status === "overdue") && (
          <div className="border-t border-sage-100 pt-3 space-y-2">
            <p className="text-xs font-bold text-sage-600 uppercase">Pay link</p>
            {invoice.pay_url ? (
              <div className="space-y-1">
                <p className="text-xs text-sage-700 break-all">{invoice.pay_url}</p>
                <button
                  type="button"
                  className={linkBtn}
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(invoice.pay_url as string)
                      .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      })
                      .catch(() => undefined);
                  }}
                >
                  {copied ? "Copied" : "Copy pay link"}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-sage-500">No pay link yet. Connect Paystack or Flutterwave, then create one so your client can pay online.</p>
                <div className="flex items-center gap-3">
                  <button type="button" className={linkBtn} disabled={busy} onClick={() => onAction({ kind: "paylink", invoice })}>
                    Create pay link
                  </button>
                  <Link href="/finance/integrations" className="text-xs font-bold text-sage-600 hover:underline">
                    Go to Integrations
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {invoice.status !== "draft" && invoice.status !== "paid" && (
          <div className="border-t border-sage-100 pt-3 space-y-1.5">
            <p className="text-xs font-bold text-sage-600 uppercase">Reminders</p>
            {rem.hint && <p className="text-xs text-sage-600">{rem.hint}</p>}
            <p className="text-xs text-sage-500">{rem.auto}</p>
            <label className="flex items-center gap-2 text-xs text-sage-700">
              <input type="checkbox" checked={invoice.auto_remind} disabled={busy} onChange={() => onAction({ kind: "autoremind", invoice })} className="accent-green-900" />
              Auto-remind when overdue
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sage-100">
          <button type="button" className={secondaryBtn} disabled={busy} onClick={() => onAction({ kind: "pdf", invoice })}>
            <Download className="w-4 h-4" aria-hidden="true" /> Download PDF
          </button>
          {invoice.status === "overdue" && (
            <button type="button" className={secondaryBtn} disabled={busy || !rem.canRemind} onClick={() => onAction({ kind: "remind", invoice })}>
              <Send className="w-4 h-4" aria-hidden="true" /> Send reminder
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

type RowAction =
  | Pending
  | { kind: "pdf"; invoice: Invoice }
  | { kind: "paylink"; invoice: Invoice }
  | { kind: "autoremind"; invoice: Invoice }
  | { kind: "edit"; invoice: Invoice }
  | { kind: "detail"; invoice: Invoice };

function RowActions({ inv, nowMs, busy, onAction }: { inv: Invoice; nowMs: number; busy: boolean; onAction: (a: RowAction) => void }) {
  const rem = reminderView(inv, nowMs);
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <button type="button" className={linkBtn} onClick={() => onAction({ kind: "detail", invoice: inv })} aria-label={`View ${inv.number}`}>
        View
      </button>
      {inv.status === "draft" && (
        <>
          <button type="button" className={linkBtn} onClick={() => onAction({ kind: "edit", invoice: inv })} aria-label={`Edit ${inv.number}`}>
            Edit
          </button>
          <button type="button" className={linkBtn} onClick={() => onAction({ kind: "send", invoice: inv })} aria-label={`Send ${inv.number}`}>
            Send
          </button>
          <button type="button" className={dangerLinkBtn} onClick={() => onAction({ kind: "delete", invoice: inv })} aria-label={`Delete ${inv.number}`}>
            Delete
          </button>
        </>
      )}
      {inv.status === "overdue" && (
        <button
          type="button"
          className={linkBtn}
          disabled={busy || !rem.canRemind}
          title={rem.canRemind ? undefined : (rem.hint ?? undefined)}
          onClick={() => onAction({ kind: "remind", invoice: inv })}
          aria-label={`Send a reminder for ${inv.number}`}
        >
          Send reminder
        </button>
      )}
      {(inv.status === "sent" || inv.status === "overdue") && (
        <button type="button" className={linkBtn} onClick={() => onAction({ kind: "paid", invoice: inv })} aria-label={`Mark ${inv.number} paid`}>
          Mark paid
        </button>
      )}
      {inv.status === "paid" && !inv.paid_via && (
        <button type="button" className={linkBtn} onClick={() => onAction({ kind: "unpaid", invoice: inv })} aria-label={`Mark ${inv.number} unpaid`}>
          Mark unpaid
        </button>
      )}
      <button type="button" className={linkBtn} disabled={busy} onClick={() => onAction({ kind: "pdf", invoice: inv })} aria-label={`Download PDF for ${inv.number}`}>
        PDF
      </button>
    </span>
  );
}

export default function InvoicesPage() {
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const invoices = useInvoices(filter === "all" ? undefined : filter);
  const { run, busy } = useFinanceAction();
  const [builder, setBuilder] = useState<{ editing: Invoice | null } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { triggerToast } = useToast();
  // Captured once per visit; the 24 hour reminder gap is only a hint, the server enforces it.
  const [nowMs] = useState(() => Date.now());

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

  const detail = detailId ? (invoices.items.find((i) => i.id === detailId) ?? null) : null;

  const updateOne = async (fn: () => Promise<Invoice>, success: string) => {
    const res = await run(fn, { success });
    if (res.ok) await invoices.reload();
    return res;
  };

  const handle = async (a: RowAction) => {
    const inv = a.invoice;
    switch (a.kind) {
      case "detail":
        return setDetailId(inv.id);
      case "edit":
        return setBuilder({ editing: inv });
      case "autoremind":
        return void updateOne(() => updateInvoice(inv.id, { auto_remind: !inv.auto_remind }), inv.auto_remind ? "Auto-remind turned off." : "Auto-remind turned on.");
      case "pdf": {
        const res = await run(() => downloadInvoicePdf(inv), { success: `Downloaded invoice-${inv.number}.pdf.` });
        return void res;
      }
      case "paylink": {
        const res = await run(() => createPayLink(inv.id), { quiet: true });
        if (res.ok) {
          triggerToast(res.data.pay_url ? "Pay link created." : "No pay link could be created.");
          await invoices.reload();
        } else {
          triggerToast(res.error.code === "NO_PAYMENT_CONNECTION" ? "Connect Paystack or Flutterwave in Integrations first." : res.error.message, "error");
        }
        return;
      }
      default:
        return setPending(a);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    const inv = pending.invoice;
    const res =
      pending.kind === "remind"
        ? await run(() => remindInvoice(inv.id), { success: `Reminder queued for ${inv.client_email}.` })
        : pending.kind === "send"
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
      case "remind":
        return { title: "Email a reminder?", body: `A reminder with the invoice attached will be emailed to ${inv.client_email}. You can send another after 24 hours.`, label: "Send reminder", danger: false };
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {header}
      {builder ? (
        <Builder editing={builder.editing} onClose={() => setBuilder(null)} onSaved={invoices.reload} />
      ) : (
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

          {invoices.status === "loading" ? (
            <LoadingBlock label="Loading invoices" />
          ) : invoices.status === "error" ? (
            <ErrorBlock message={invoices.error ?? "Couldn't load invoices."} onRetry={() => void invoices.reload()} />
          ) : invoices.items.length === 0 && filter === "all" ? (
            <EmptyBlock icon={<FileText className="w-6 h-6" aria-hidden="true" />} title="No invoices yet" body="Create your first invoice, send it to a client, and record the payment to move your cash flow and runway.">
              <button type="button" onClick={() => setBuilder({ editing: null })} className={darkBtn}>
                <Plus className="w-4 h-4" aria-hidden="true" /> Create your first invoice
              </button>
            </EmptyBlock>
          ) : (
            <>
              <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
                {invoices.items.length === 0 ? (
                  <div className="p-8 text-center text-sage-500 font-medium text-sm">No invoices with this status.</div>
                ) : (
                  <>
                    <ul className="md:hidden divide-y divide-sage-100" aria-label="Invoices">
                      {invoices.items.map((inv) => (
                        <li key={inv.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sage-900">{inv.number}</p>
                              <p className="text-sm text-sage-600 break-words">{inv.client_name}</p>
                              <p className="text-xs text-sage-500">Due {inv.due_on ? formatDate(inv.due_on) : "when sent"}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-bold text-sage-900 whitespace-nowrap">{formatMoney(inv.total_minor, inv.currency)}</p>
                              <StatusBadge status={inv.status} />
                            </div>
                          </div>
                          {payTag(inv) && <p className="text-xs font-semibold text-green-800">{payTag(inv)}</p>}
                          <RowActions inv={inv} nowMs={nowMs} busy={busy} onAction={(a) => void handle(a)} />
                        </li>
                      ))}
                    </ul>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-sage-50/50 border-b border-sage-100 text-xs text-sage-600 font-bold uppercase tracking-wider">
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
                          {invoices.items.map((inv) => (
                            <tr key={inv.id} className="hover:bg-sage-50/50 transition-colors">
                              <td className="py-4 px-6 font-semibold text-sage-900">{inv.number}</td>
                              <td className="py-4 px-4 text-sage-600 font-medium">
                                {inv.client_name}
                                <span className="block text-xs text-sage-600">{inv.client_email}</span>
                              </td>
                              <td className="py-4 px-4 text-sage-500 font-medium">{inv.due_on ? formatDate(inv.due_on) : "Set when sent"}</td>
                              <td className="py-4 px-4 font-bold text-sage-900 text-right whitespace-nowrap">{formatMoney(inv.total_minor, inv.currency)}</td>
                              <td className="py-4 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={inv.auto_remind}
                                  disabled={busy || inv.status === "paid"}
                                  onChange={() => void handle({ kind: "autoremind", invoice: inv })}
                                  aria-label={`Auto-remind for ${inv.number}`}
                                  className="accent-green-900 cursor-pointer"
                                />
                              </td>
                              <td className="py-4 px-4">
                                <StatusBadge status={inv.status} />
                                {payTag(inv) && <span className="block text-[11px] font-semibold text-green-800 mt-1">{payTag(inv)}</span>}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <RowActions inv={inv} nowMs={nowMs} busy={busy} onAction={(a) => void handle(a)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <LoadMore list={invoices} noun="invoices" />
              </div>
              <p className="text-xs text-sage-500">
                Overdue is worked out from the due date. With Auto-remind on, an overdue invoice emails the client a reminder with the PDF attached, then again every 7 days, up to 8 times. You and your team are notified once when an invoice goes overdue.
              </p>
            </>
          )}
        </>
      )}

      {detail && <InvoiceDetail invoice={detail} nowMs={nowMs} busy={busy} onClose={() => setDetailId(null)} onAction={(a) => void handle(a)} />}

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
