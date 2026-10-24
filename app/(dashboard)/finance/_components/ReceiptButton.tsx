"use client";

import React, { useState } from "react";
import { API_BASE } from "@/lib/api/client";
import { getReceiptLink, toFinanceError } from "@/lib/api/finance";
import { linkBtn } from "./ui";
import { useToast } from "../ToastContext";

/**
 * The signed link names the API origin. Probe it through the same base the app uses for
 * every other call (the same-origin proxy in local dev), so the check is not blocked by CORS.
 */
function probeUrl(url: string): string {
  try {
    const u = new URL(url);
    const i = u.pathname.indexOf("/api/v1/");
    return i === -1 ? url : `${API_BASE}/${u.pathname.slice(i + "/api/v1/".length)}${u.search}`;
  } catch {
    return url;
  }
}

/**
 * Asks the signed link whether the file is still there before showing it. `false`
 * only on a definite "gone" answer (4xx/5xx); a network or CORS failure means we
 * cannot tell, so the caller opens the link anyway rather than blocking a good receipt.
 */
async function receiptIsAvailable(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  try {
    const res = await fetch(probeUrl(url), { signal: ctrl.signal });
    return res.ok;
  } catch {
    return true;
  } finally {
    ctrl.abort(); // headers are enough; do not download the whole file twice
  }
}

/**
 * Opens a receipt. The expense only carries an API route, so every click asks for
 * a fresh signed link (valid about 5 minutes) and opens it in a new tab. The link
 * is never stored or rendered. The tab is opened synchronously and pointed at the
 * link afterwards so the pop-up blocker allows it. The link is checked first, so a
 * receipt whose file is gone shows a message instead of a tab of raw JSON.
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
      if (!(await receiptIsAvailable(link.url))) {
        tab?.close();
        triggerToast("This receipt is no longer available. Use Replace to upload it again.", "error");
        return;
      }
      if (tab) tab.location.href = link.url;
      else {
        // No pre-opened tab (pop-ups blocked or an embedded browser): follow the link in a new tab
        // the way a user click would, and say so, rather than navigating away from the page.
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        triggerToast("If the receipt did not open, allow pop-ups for this site and try again.");
      }
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
