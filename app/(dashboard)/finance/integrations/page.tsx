"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, Copy, Landmark, Link2, RefreshCw } from "lucide-react";
import { useIntegrations } from "@/hooks/useFinanceApi";
import { useWorkspace } from "@/components/workspace-context";
import {
  connectMono,
  disconnectIntegration,
  syncIntegration,
  toFinanceError,
  type Connection,
  type Integrations,
  type IntegrationProviderId,
  type ProviderEntry,
} from "@/lib/api/finance";
import { describeSync } from "@/lib/finance/syncSummary";
import { ConfirmDialog, FormError, PageHeader, ResourceGate, darkBtn, secondaryBtn } from "../_components/ui";
import { useToast } from "../ToastContext";
import { SecretKeyDialog } from "./SecretKeyDialog";

const META: Record<IntegrationProviderId, { initials: string; description: string; webhookIn?: string }> = {
  paystack: {
    initials: "PS",
    description: "Import your Paystack payments as income and create a pay link on every invoice you send.",
    webhookIn: "Paystack",
  },
  flutterwave: {
    initials: "FW",
    description: "Import your Flutterwave payments as income and create a pay link on every invoice you send.",
    webhookIn: "Flutterwave",
  },
  mono: {
    initials: "MO",
    description: "Link your business bank account. Credits and debits flow into the ledger so you can categorise them.",
  },
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs font-bold text-brand-800 hover:underline"
      aria-label={label}
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => undefined);
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type Busy = null | "sync" | "disconnect" | "connect";

function ConnectionDetails({ entry, c }: { entry: ProviderEntry; c: Connection }) {
  const meta = META[entry.provider];
  const bank = entry.kind === "bank";
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-800">
          <Check className="w-4 h-4" aria-hidden="true" />
          {c.account_name ? `Connected as ${c.account_name}` : "Connected"}
        </span>
        {c.mode === "test" && (
          <span className="bg-warning-100 text-warning-800 border border-warning-500/40 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider">
            {bank ? "Sandbox" : "Test mode"}
          </span>
        )}
        <span className="text-xs text-neutral-500">
          {bank ? "Account ending" : "Key"} <span className="font-semibold text-neutral-700">{bank ? c.key_last4 : `••••${c.key_last4}`}</span>
        </span>
      </div>
      <p className="text-xs text-neutral-500">
        Last synced: <span className="font-semibold text-neutral-700">{formatWhen(c.last_sync_at)}</span>
      </p>
      {c.last_sync_summary && Object.keys(c.last_sync_summary).length > 0 && (
        <p className="text-xs text-neutral-500">Last sync: {describeSync(c.last_sync_summary)}</p>
      )}
      {c.status === "active" && c.last_error && (
        <p className="text-xs font-medium text-danger-700 bg-danger-50 border border-danger-200 rounded-input px-3 py-2">{c.last_error}</p>
      )}
      {!bank && meta.webhookIn && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-input p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-neutral-600 uppercase">Webhook URL</p>
            <CopyButton text={c.webhook_url} label={`Copy the ${meta.webhookIn} webhook URL`} />
          </div>
          <p className="text-xs text-neutral-700 break-all">{c.webhook_url}</p>
          <p className="text-xs text-neutral-500">
            Paste this URL into your {meta.webhookIn} dashboard under Webhooks so paid invoices update automatically. Without it, payments still import on sync, but invoices will not be marked paid by themselves.
          </p>
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  entry,
  isFounder,
  encryptionOk,
  otherPaymentConnected,
  onChanged,
}: {
  entry: ProviderEntry;
  isFounder: boolean;
  encryptionOk: boolean;
  otherPaymentConnected: ProviderEntry | null;
  onChanged: (message?: string) => Promise<void>;
}) {
  const { triggerToast } = useToast();
  const meta = META[entry.provider];
  const bank = entry.kind === "bank";
  const c = entry.connection;
  const [busy, setBusy] = useState<Busy>(null);
  const [dialog, setDialog] = useState<null | "key" | "disconnect">(null);
  const [error, setError] = useState<string | null>(null);

  const needsAttention = c?.status === "needs_attention";
  const monoReady = !bank || entry.connect_config?.configured === true;
  const monoKey = entry.connect_config?.public_key ?? null;

  const sync = async () => {
    setBusy("sync");
    setError(null);
    try {
      const res = await syncIntegration(entry.provider);
      triggerToast(`Synced. ${describeSync(res.summary)}`);
      await onChanged();
    } catch (err) {
      const fe = toFinanceError(err, "Couldn't sync. Try again.");
      // Too-soon and already-running are not failures: say so neutrally.
      if (fe.code === "SYNC_TOO_SOON" || fe.code === "SYNC_IN_PROGRESS") triggerToast(fe.message);
      else if (fe.status === 404) setError(`${entry.label} is not connected, or needs you to reconnect before it can sync.`);
      else setError(fe.message);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    setError(null);
    try {
      await disconnectIntegration(entry.provider);
      setDialog(null);
      triggerToast(`${entry.label} disconnected. Imported history stays.`);
      await onChanged();
    } catch (err) {
      setDialog(null);
      setError(toFinanceError(err, "Couldn't disconnect. Try again.").message);
    } finally {
      setBusy(null);
    }
  };

  // Mono Connect hands the widget a one-time code; the API exchanges it for the account.
  const openMono = async () => {
    if (!monoKey) return;
    setBusy("connect");
    setError(null);
    try {
      const MonoConnect = (await import("@mono.co/connect.js")).default;
      const widget = new MonoConnect({
        key: monoKey,
        onClose: () => setBusy((b) => (b === "connect" ? null : b)),
        onSuccess: ({ code }) => {
          void (async () => {
            try {
              await connectMono(code);
              triggerToast("Bank linked. Importing your transactions.");
              try {
                const res = await syncIntegration("mono");
                triggerToast(`Synced. ${describeSync(res.summary)} If you see nothing yet, Mono may still be preparing your data: use Sync now again in a minute.`);
              } catch {
                triggerToast("Bank linked. Use Sync now in a minute to import your transactions.");
              }
              await onChanged();
            } catch (err) {
              setError(toFinanceError(err, "Couldn't link that bank. Start again.").message);
            } finally {
              setBusy(null);
            }
          })();
        },
      });
      widget.setup();
      widget.open();
    } catch {
      setBusy(null);
      setError("The bank link window could not open. Check your connection and try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-modal border border-neutral-200/80 shadow-card flex flex-col gap-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-card bg-neutral-100 flex items-center justify-center font-bold text-neutral-800 text-sm border border-neutral-200/60 flex-shrink-0" aria-hidden="true">
          {bank ? <Landmark className="w-5 h-5" /> : meta.initials}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-neutral-900 text-base">{entry.label}</h2>
          <p className="text-xs text-neutral-500 mt-0.5 font-medium">{meta.description}</p>
        </div>
      </div>

      {needsAttention && (
        <div role="alert" className="flex items-start gap-2 bg-danger-50 border border-danger-200 rounded-input p-3 text-sm text-danger-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{entry.label} connection needs attention. Reconnect to resume syncing.</p>
            {c?.last_error && <p className="text-xs mt-0.5">{c.last_error}</p>}
            {!bank && <p className="text-xs mt-0.5">Until it is reconnected, invoices will not be marked paid automatically.</p>}
          </div>
        </div>
      )}

      {c ? (
        <ConnectionDetails entry={entry} c={c} />
      ) : (
        <p className="text-xs text-neutral-600 font-semibold">Not connected</p>
      )}

      <FormError message={error} />

      <div className="flex flex-wrap items-center gap-2 mt-auto">
        {c && !needsAttention && (
          <button type="button" className={secondaryBtn} disabled={busy !== null} onClick={() => void sync()}>
            <RefreshCw className={`w-4 h-4 ${busy === "sync" ? "animate-spin" : ""}`} aria-hidden="true" />
            {busy === "sync" ? "Syncing" : "Sync now"}
          </button>
        )}

        {isFounder && !bank && (
          <>
            {(!c || needsAttention) && (
              <button
                type="button"
                className={darkBtn}
                disabled={busy !== null || !encryptionOk || (!c && otherPaymentConnected !== null)}
                onClick={() => setDialog("key")}
              >
                <Link2 className="w-4 h-4" aria-hidden="true" /> {needsAttention ? "Replace key" : `Connect ${entry.label}`}
              </button>
            )}
            {c && !needsAttention && (
              <button type="button" className={secondaryBtn} disabled={busy !== null || !encryptionOk} onClick={() => setDialog("key")}>
                Replace key
              </button>
            )}
          </>
        )}

        {isFounder && bank && monoReady && (!c || needsAttention) && (
          <button type="button" className={darkBtn} disabled={busy !== null || !encryptionOk} onClick={() => void openMono()}>
            <Landmark className="w-4 h-4" aria-hidden="true" /> {busy === "connect" ? "Linking" : needsAttention ? "Reconnect bank" : "Connect bank"}
          </button>
        )}

        {isFounder && c && (
          <button type="button" className="text-xs font-bold text-danger-600 hover:underline ml-auto disabled:opacity-50" disabled={busy !== null} onClick={() => setDialog("disconnect")}>
            Disconnect
          </button>
        )}
      </div>

      {!isFounder && !c && <p className="text-xs text-neutral-500">Only a founder can connect {entry.label}. Ask a founder in this workspace.</p>}
      {!isFounder && c && <p className="text-xs text-neutral-500">Only a founder can replace or disconnect this connection. You can sync it.</p>}
      {isFounder && !c && !bank && otherPaymentConnected && (
        <p className="text-xs text-neutral-500">Disconnect {otherPaymentConnected.label} first. One payment account can be connected at a time.</p>
      )}
      {bank && !monoReady && (
        <p className="text-xs font-semibold text-neutral-600">Coming soon. Bank linking is not switched on for this environment yet.</p>
      )}
      {bank && monoReady && entry.connect_config?.sandbox && (
        <p className="text-xs text-neutral-500">Sandbox only: you can link test banks. No real bank accounts.</p>
      )}
      {!encryptionOk && <p className="text-xs font-semibold text-danger-600">Payments are not available right now.</p>}

      {dialog === "key" && (
        <SecretKeyDialog
          entry={entry}
          replacing={c !== null}
          onClose={() => setDialog(null)}
          onConnected={(conn) => {
            setDialog(null);
            triggerToast(`Connected to ${entry.label}${conn.mode === "test" ? " in test mode" : ""}. Use Sync now to import your payments.`);
            void onChanged();
          }}
        />
      )}
      {dialog === "disconnect" && (
        <ConfirmDialog
          title={`Disconnect ${entry.label}?`}
          body="Historical data stays; new data stops syncing."
          confirmLabel="Disconnect"
          danger
          busy={busy === "disconnect"}
          onConfirm={() => void disconnect()}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function Cards({ data, reload }: { data: Integrations; reload: () => Promise<void> }) {
  const { role } = useWorkspace();
  const isFounder = role === "founder";
  const payments = data.providers.filter((p) => p.kind === "payments");
  const banks = data.providers.filter((p) => p.kind === "bank");
  const livePayment = payments.find((p) => p.connection !== null) ?? null;
  return (
    <>
      {!data.encryption_configured && (
        <p role="alert" className="text-sm font-semibold text-danger-700 bg-danger-50 border border-danger-200 rounded-card p-4">
          Payments are not available right now. Connecting and syncing are switched off until the server is configured.
        </p>
      )}
      <section aria-labelledby="pay-h" className="space-y-3">
        <h2 id="pay-h" className="text-sm font-bold text-neutral-700 uppercase tracking-wider">
          Payments
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {payments.map((entry) => (
            <ProviderCard
              key={entry.provider}
              entry={entry}
              isFounder={isFounder}
              encryptionOk={data.encryption_configured}
              otherPaymentConnected={livePayment && livePayment.provider !== entry.provider ? livePayment : null}
              onChanged={reload}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="bank-h" className="space-y-3">
        <h2 id="bank-h" className="text-sm font-bold text-neutral-700 uppercase tracking-wider">
          Bank
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banks.map((entry) => (
            <ProviderCard
              key={entry.provider}
              entry={entry}
              isFounder={isFounder}
              encryptionOk={data.encryption_configured}
              otherPaymentConnected={null}
              onChanged={reload}
            />
          ))}
        </div>
      </section>
      <p className="text-xs text-neutral-500">QuickBooks and Xero are not planned yet.</p>
    </>
  );
}

export default function IntegrationsPage() {
  const integrations = useIntegrations();
  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader title="Integrations" subtitle="Connect a payment account and your bank so money in and out lands in your books." />
      <ResourceGate resource={integrations} loadingLabel="Loading integrations">
        {(data) => <Cards data={data} reload={integrations.reload} />}
      </ResourceGate>
    </div>
  );
}
