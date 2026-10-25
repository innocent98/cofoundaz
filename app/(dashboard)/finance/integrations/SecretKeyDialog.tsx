"use client";

import React, { useState } from "react";
import { connectPaymentProvider, toFinanceError, type Connection, type PaymentProviderId, type ProviderEntry } from "@/lib/api/finance";
import { Field, FormError, Modal, inputCls, primaryBtn, secondaryBtn } from "../_components/ui";

const COPY: Record<PaymentProviderId, { name: string; keyLabel: string; keyHelp: string }> = {
  paystack: {
    name: "Paystack",
    keyLabel: "Secret key",
    keyHelp: "Starts with sk_test_ or sk_live_. Find it in Paystack under Settings, API Keys and Webhooks.",
  },
  flutterwave: {
    name: "Flutterwave",
    keyLabel: "Secret key",
    keyHelp: "Starts with FLWSECK_TEST- or FLWSECK-. Find it in Flutterwave under Settings, API keys.",
  },
};

/**
 * Collects a payment provider secret key. The key is held only in this dialog's
 * inputs: both fields are emptied the moment a request starts and the dialog is
 * unmounted on success, so a key never lingers in state, storage, logs or the
 * page after it has been sent. A failed attempt therefore asks for the key again.
 */
export function SecretKeyDialog({
  entry,
  replacing,
  onClose,
  onConnected,
}: {
  entry: ProviderEntry;
  replacing: boolean;
  onClose: () => void;
  onConnected: (c: Connection) => void;
}) {
  const provider = entry.provider as PaymentProviderId;
  const copy = COPY[provider];
  const [secretKey, setSecretKey] = useState("");
  const [secretHash, setSecretHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = secretKey.trim();
    const hash = secretHash.trim();
    if (!key) return setFieldErrors({ secret_key: `Paste your ${copy.name} secret key.` });
    if (provider === "flutterwave" && !hash) return setFieldErrors({ secret_hash: "Enter your Flutterwave secret hash." });
    // Clear the inputs before the request leaves, whatever its outcome.
    setSecretKey("");
    setSecretHash("");
    setFieldErrors({});
    setFormError(null);
    setBusy(true);
    try {
      const connection = await connectPaymentProvider(provider, provider === "flutterwave" ? { secret_key: key, secret_hash: hash } : { secret_key: key });
      onConnected(connection);
    } catch (err) {
      const fe = toFinanceError(err, "Couldn't connect. Try again.");
      setFieldErrors(fe.fieldErrors);
      setFormError(Object.keys(fe.fieldErrors).length ? "Your key was not saved. Paste it again to retry." : fe.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${replacing ? "Replace" : "Connect"} ${copy.name}`} onClose={busy ? () => undefined : onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-4" autoComplete="off">
        <p className="text-xs text-neutral-500">
          For your security we never show your key again. It is stored encrypted and only used to read your {copy.name} transactions and create pay links on your account.
          {replacing ? " Paste the new key; the old one is discarded." : ""}
        </p>
        <Field label={copy.keyLabel} htmlFor="pk-secret" error={fieldErrors.secret_key} hint={copy.keyHelp}>
          <input
            id="pk-secret"
            type="password"
            className={inputCls}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
          />
        </Field>
        {provider === "flutterwave" && (
          <Field
            label="Secret hash"
            htmlFor="pk-hash"
            error={fieldErrors.secret_hash}
            hint="The value you set under Settings, Webhooks in your Flutterwave dashboard."
          >
            <input
              id="pk-hash"
              type="password"
              className={inputCls}
              value={secretHash}
              onChange={(e) => setSecretHash(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
            />
          </Field>
        )}
        <FormError message={formError} />
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} className={secondaryBtn} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={busy}>
            {busy ? "Checking your key" : replacing ? "Replace key" : "Connect"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
