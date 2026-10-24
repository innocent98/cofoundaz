"use client";

import React, { useState } from "react";
import { getReceiptLink, toFinanceError } from "@/lib/api/finance";
import { linkBtn } from "./ui";
import { useToast } from "../ToastContext";

/**
 * Opens a receipt. The expense only carries an API route, so every click asks for
 * a fresh signed link (valid about 5 minutes) and opens it in a new tab. The link
 * is never stored or rendered. The tab is opened synchronously and pointed at the
 * link afterwards so the pop-up blocker allows it.
 */
export function ReceiptButton({ expenseId, vendor }: { expenseId: string; vendor: string }) {
  const { triggerToast } = useToast();
  const [busy, setBusy] = useState(false);

  const open = async () => {
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      const link = await getReceiptLink(expenseId);
      if (tab) tab.location.href = link.url;
      else window.location.assign(link.url);
    } catch (err) {
      tab?.close();
      const fe = toFinanceError(err, "Couldn't open the receipt. Try again.");
      triggerToast(fe.status === 404 ? "This receipt is no longer available." : fe.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={linkBtn} disabled={busy} onClick={() => void open()} aria-label={`View receipt for ${vendor}`}>
      {busy ? "Opening" : "View receipt"}
    </button>
  );
}
