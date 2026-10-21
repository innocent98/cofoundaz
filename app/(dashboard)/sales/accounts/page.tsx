"use client";

import React, { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAGE_SIZE, useAccountList, useMembers } from "@/hooks/useSalesCrm";
import { createAccount, salesErrorMessage, salesFieldErrors } from "@/lib/api/sales";
import { useToast } from "../ToastContext";
import { AccountFields, type AccountFormState } from "@/components/sales/account-fields";
import {
  BTN_ACCENT,
  BTN_SECONDARY,
  CARD,
  Drawer,
  EmptyState,
  INPUT,
  SalesGate,
} from "@/components/sales/shared";

export default function AccountsPage() {
  const router = useRouter();
  const { triggerToast } = useToast();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accounts = useAccountList({ q, offset });
  const { owners, nameOf } = useMembers();
  const [creating, setCreating] = useState(false);
  const searchId = useId();

  const items = accounts.data?.items ?? [];
  const total = accounts.data?.total ?? 0;

  const onSearch = (value: string) => {
    setQInput(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setQ(value.trim());
      setOffset(0);
    }, 300);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Accounts</h1>
        <button type="button" onClick={() => setCreating(true)} className={BTN_ACCENT}>
          + New account
        </button>
      </div>

      <div>
        <label htmlFor={searchId} className="sr-only">
          Search accounts
        </label>
        <input id={searchId} type="search" className={INPUT} placeholder="Search accounts by name" value={qInput} onChange={(e) => onSearch(e.target.value)} />
      </div>

      <SalesGate status={accounts.status} error={accounts.error} onRetry={() => void accounts.reload()} loadingLabel="Loading accounts">
        {items.length === 0 ? (
          <EmptyState
            title={q ? "No accounts match" : "No accounts yet"}
            body={q ? "Try a different search." : "Accounts are the companies you sell to. Add one here, or make a lead a deal and its account is created for you."}
            cta={
              !q && (
                <button type="button" onClick={() => setCreating(true)} className={BTN_ACCENT}>
                  + New account
                </button>
              )
            }
          />
        ) : (
          <div className={`${CARD} overflow-hidden`}>
            <ul className="divide-y divide-sage-100">
              {items.map((acc) => (
                <li key={acc.id}>
                  <Link
                    href={`/sales/accounts/${acc.id}`}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4 px-5 py-4 hover:bg-sage-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h2 className="font-display font-bold text-sage-900 text-base truncate">{acc.name}</h2>
                      <p className="text-xs text-sage-500 truncate">
                        {[acc.industry, acc.website?.replace(/^https?:\/\//, "")].filter(Boolean).join(" · ") || "No details yet"}
                      </p>
                    </div>
                    <span className="text-xs text-sage-500 shrink-0">Owner: {nameOf(acc.owner_id)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-sage-100 text-xs text-sage-500">
              <span>
                {offset + 1} to {offset + items.length} of {total}
              </span>
              <div className="flex gap-2">
                <button type="button" className={BTN_SECONDARY} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                  Previous
                </button>
                <button type="button" className={BTN_SECONDARY} disabled={offset + items.length >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </SalesGate>

      {creating && (
        <NewAccountDrawer
          owners={owners}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            triggerToast("Account added");
            setCreating(false);
            router.push(`/sales/accounts/${id}`);
          }}
        />
      )}
    </div>
  );
}

function NewAccountDrawer({
  owners,
  onClose,
  onCreated,
}: {
  owners: ReturnType<typeof useMembers>["owners"];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { triggerToast } = useToast();
  const [form, setFormState] = useState<AccountFormState>({ name: "", website: "", industry: "", description: "", owner_id: null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const ids = { name: useId(), website: useId(), industry: useId(), description: useId(), owner: useId() };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Give the account a name." });
      return;
    }
    setBusy(true);
    try {
      const created = await createAccount({
        name: form.name.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        description: form.description.trim() || null,
        owner_id: form.owner_id,
      });
      onCreated(created.id);
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="New account"
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="new-account-form" className={BTN_ACCENT} disabled={busy}>
            {busy ? "Adding..." : "Add account"}
          </button>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
        </>
      }
    >
      <form id="new-account-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AccountFields ids={ids} form={form} setForm={(p) => setFormState((f) => ({ ...f, ...p }))} errors={errors} owners={owners} />
      </form>
    </Drawer>
  );
}
