"use client";

import React, { Suspense, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAccountDetail, useLoader, useMembers } from "@/hooks/useSalesCrm";
import {
  contactName,
  deleteAccount,
  dueLabel,
  formatMoney,
  getStages,
  isUuid,
  salesErrorMessage,
  salesFieldErrors,
  updateAccount,
  type AccountDetail,
  type Stage,
} from "@/lib/api/sales";
import { useToast } from "../../ToastContext";
import { AccountFields, type AccountFormState } from "@/components/sales/account-fields";
import { AddContactDrawer, ContactDrawer } from "@/components/sales/contact-drawer";
import {
  ActivityLog,
  BTN_ACCENT,
  BTN_DANGER,
  BTN_SECONDARY,
  CARD,
  ConfirmDialog,
  SalesGate,
  StallBadge,
} from "@/components/sales/shared";

function InfoPanel({
  detail,
  owners,
  onSaved,
  onDeleted,
}: {
  detail: AccountDetail;
  owners: ReturnType<typeof useMembers>["owners"];
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { triggerToast, runAction } = useToast();
  const { account } = detail;
  const [form, setFormState] = useState<AccountFormState>({
    name: account.name,
    website: account.website ?? "",
    industry: account.industry ?? "",
    description: account.description ?? "",
    owner_id: account.owner_id,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ids = { name: useId(), website: useId(), industry: useId(), description: useId(), owner: useId() };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Give the account a name." });
      return;
    }
    setBusy(true);
    try {
      await updateAccount(account.id, {
        name: form.name.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        description: form.description.trim() || null,
        owner_id: form.owner_id,
      });
      setErrors({});
      triggerToast("Account saved");
      onSaved();
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await runAction(() => deleteAccount(account.id), "Account deleted");
    setBusy(false);
    setConfirmDelete(false);
    if (res.ok) onDeleted();
  };

  return (
    <section aria-label="Account info" className={`${CARD} p-6 space-y-5`}>
      <h2 className="text-xs font-bold text-sage-500 uppercase tracking-wider">Account info</h2>
      <form onSubmit={save} noValidate className="flex flex-col gap-5">
        <AccountFields ids={ids} form={form} setForm={(p) => setFormState((f) => ({ ...f, ...p }))} errors={errors} owners={owners} />
        <div className="flex gap-3">
          <button type="submit" className={BTN_ACCENT} disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className={BTN_DANGER} disabled={busy} onClick={() => setConfirmDelete(true)}>
            Delete account
          </button>
        </div>
      </form>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this account?"
          body="Its contacts stay in your CRM without an account. An account that still has deals cannot be deleted: move or delete its deals first."
          confirmLabel="Delete account"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </section>
  );
}

function AccountView({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const detail = useAccountDetail(id);
  const stages = useLoader<Stage[]>(getStages);
  const { owners, nameOf } = useMembers();
  const [addingContact, setAddingContact] = useState(false);
  // Bumped when a contact drawer logs or deletes activity, so the account's own log refetches.
  const [logVersion, setLogVersion] = useState(0);
  const contactParam = params.get("contact");
  const [openContact, setOpenContact] = useState<string | null>(isUuid(contactParam) ? contactParam : null);

  const stageName = useMemo(() => new Map((stages.data ?? []).map((s) => [s.id, s.name])), [stages.data]);
  const notFound = detail.status === "error" && /not found/i.test(detail.error ?? "");
  const data = detail.data;

  const openDealValue = (data?.open_deals ?? []).reduce((sum, d) => sum + d.value_minor, 0);

  const closeContact = () => {
    setOpenContact(null);
    if (contactParam) window.history.replaceState(null, "", `/sales/accounts/${id}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link href="/sales/accounts" className="text-sm font-semibold text-green-800 hover:underline">
        ← Accounts
      </Link>

      {notFound ? (
        <div role="alert" className={`${CARD} p-8 space-y-2`}>
          <h1 className="font-display font-semibold text-lg text-sage-900">Account not found</h1>
          <p className="text-sm text-sage-600">It may have been deleted, or it belongs to another workspace.</p>
        </div>
      ) : (
        <SalesGate status={detail.status} error={detail.error} onRetry={() => void detail.reload()} loadingLabel="Loading account">
          {data && (
            <>
              <header className="space-y-1">
                <h1 className="text-3xl font-display font-bold text-sage-900 break-words">{data.account.name}</h1>
                <p className="text-sm text-sage-500">
                  {[data.account.industry, nameOf(data.account.owner_id) !== "Unassigned" ? `Owner: ${nameOf(data.account.owner_id)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  {data.account.website && (
                    <>
                      {data.account.industry ? " · " : ""}
                      <a href={data.account.website} target="_blank" rel="noopener noreferrer" className="text-green-800 hover:underline">
                        {data.account.website.replace(/^https?:\/\//, "")}
                      </a>
                    </>
                  )}
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Tile label="Open deals" value={String(data.open_deals.length)} />
                <Tile label="Open deal value" value={formatMoney(openDealValue)} />
                <Tile label="Lifetime won" value={formatMoney(data.lifetime_won_minor)} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <InfoPanel
                    key={data.account.id}
                    detail={data}
                    owners={owners}
                    onSaved={() => void detail.reload()}
                    onDeleted={() => router.push("/sales/accounts")}
                  />

                  <section aria-label="Contacts" className={`${CARD} p-6 space-y-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xs font-bold text-sage-500 uppercase tracking-wider">Contacts</h2>
                      <button type="button" className={BTN_SECONDARY} onClick={() => setAddingContact(true)}>
                        + Add contact
                      </button>
                    </div>
                    {data.contacts.length === 0 ? (
                      <p className="text-sm text-sage-500">No contacts yet. Add the people you talk to at this account.</p>
                    ) : (
                      <ul className="divide-y divide-sage-100">
                        {data.contacts.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => setOpenContact(c.id)}
                              className="w-full text-left py-3 flex flex-col md:flex-row md:items-center justify-between gap-1 hover:bg-sage-50/70 px-2 rounded-card cursor-pointer"
                            >
                              <span className="font-semibold text-sage-900 text-sm">
                                {contactName(c)}
                                {c.title && <span className="font-normal text-sage-500"> · {c.title}</span>}
                              </span>
                              <span className="text-xs text-sage-500">{c.email ?? "No email"}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section aria-label="Open deals" className={`${CARD} p-6 space-y-4`}>
                    <h2 className="text-xs font-bold text-sage-500 uppercase tracking-wider">Open deals</h2>
                    {data.open_deals.length === 0 ? (
                      <p className="text-sm text-sage-500">No open deals. Add one from the Pipeline.</p>
                    ) : (
                      <ul className="divide-y divide-sage-100">
                        {data.open_deals.map((d) => (
                          <li key={d.id}>
                            <Link href={`/sales?deal=${d.id}`} className="py-3 px-2 flex flex-col md:flex-row md:items-center justify-between gap-1 hover:bg-sage-50/70 rounded-card">
                              <span className="font-semibold text-sage-900 text-sm flex items-center gap-2">
                                {d.name}
                                <StallBadge deal={d} />
                              </span>
                              <span className="text-xs text-sage-500">
                                {stageName.get(d.stage_id) ?? "Stage"} · {formatMoney(d.value_minor)}
                                {d.next_step_due ? ` · ${d.next_step ?? "Next step"} ${dueLabel(d.next_step_due).toLowerCase()}` : ""}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                <div className={`${CARD} p-6 lg:col-span-5`}>
                  <ActivityLog
                    key={logVersion}
                    heading="Activity log"
                    filter={{ account_id: data.account.id }}
                    link={{ account_id: data.account.id }}
                    nameOf={nameOf}
                  />
                </div>
              </div>
            </>
          )}
        </SalesGate>
      )}

      {addingContact && data && (
        <AddContactDrawer
          accountId={data.account.id}
          onClose={() => setAddingContact(false)}
          onCreated={(c) => {
            setAddingContact(false);
            void detail.reload();
            setOpenContact(c.id);
          }}
        />
      )}

      {openContact && (
        <ContactDrawer
          contactId={openContact}
          accountName={data?.account.name ?? null}
          onClose={closeContact}
          onChanged={() => {
            setLogVersion((v) => v + 1);
            void detail.reload();
          }}
        />
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f7f9f8] rounded-card p-4 border border-sage-200/60 space-y-1">
      <span className="text-[11px] font-bold text-sage-500 uppercase tracking-wider block">{label}</span>
      <span className="text-2xl font-display font-bold text-sage-900">{value}</span>
    </div>
  );
}

export default function AccountPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={null}>
      {isUuid(id) ? (
        <AccountView id={id} />
      ) : (
        <div role="alert" className={`${CARD} p-8 space-y-2`}>
          <h1 className="font-display font-semibold text-lg text-sage-900">Account not found</h1>
          <Link href="/sales/accounts" className="text-sm font-semibold text-green-800 hover:underline">
            Back to accounts
          </Link>
        </div>
      )}
    </Suspense>
  );
}
