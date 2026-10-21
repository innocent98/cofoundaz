"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContact } from "@/hooks/useSalesCrm";
import { isUuid } from "@/lib/api/sales";
import { ContactDrawer } from "@/components/sales/contact-drawer";
import { CARD, LoadingState } from "@/components/sales/shared";

// /sales/contacts?contact=<id> is where a search hit lands (there is no contacts list page).
// A contact with an account opens its drawer on the account page; one without opens the
// same drawer here.
function ContactDeepLink() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("contact");
  const contactId = isUuid(raw) ? raw : null;
  const contact = useContact(contactId);
  const accountId = contact.data?.account_id ?? null;

  useEffect(() => {
    if (contactId && accountId) router.replace(`/sales/accounts/${accountId}?contact=${contactId}`, { scroll: false });
  }, [contactId, accountId, router]);

  if (!contactId) {
    return (
      <div role="alert" className={`${CARD} p-8 space-y-2`}>
        <h1 className="font-display font-semibold text-lg text-sage-900">Contact not found</h1>
        <p className="text-sm text-sage-600">
          Contacts live on their account.{" "}
          <Link href="/sales/accounts" className="font-semibold text-green-800 hover:underline">
            Open Accounts
          </Link>
        </p>
      </div>
    );
  }
  if (contact.status === "loading" || accountId) return <LoadingState label="Opening contact" />;

  return (
    <div className="space-y-4">
      <Link href="/sales/accounts" className="text-sm font-semibold text-green-800 hover:underline">
        ← Accounts
      </Link>
      <ContactDrawer contactId={contactId} onClose={() => router.push("/sales/accounts")} onChanged={() => void contact.reload()} />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={null}>
      <ContactDeepLink />
    </Suspense>
  );
}
