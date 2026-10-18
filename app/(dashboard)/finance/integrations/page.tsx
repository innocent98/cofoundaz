"use client";

import React from "react";
import { PageHeader } from "../_components/ui";

// Bank, accounting and payment connectors are not built yet: they need OAuth with
// real third-party accounts. Nothing here pretends otherwise. Every provider is
// shown as not connected with a disabled "Coming soon" button.
const PROVIDERS = [
  { id: "bank", name: "Bank connection", initials: "BK", description: "Import transactions straight from your business bank account." },
  { id: "quickbooks", name: "QuickBooks", initials: "QB", description: "Sync your books from QuickBooks Online." },
  { id: "xero", name: "Xero", initials: "X", description: "Sync your books from Xero." },
  { id: "stripe", name: "Stripe", initials: "S", description: "Pull in payouts and customer payments from Stripe." },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader title="Integrations" subtitle="Connect your accounting software and banks for automatic syncing." />

      <p className="text-sm text-sage-600 bg-white border border-sage-200 rounded-card p-4 shadow-card">
        Automatic syncing is not available yet, so nothing is connected. Until it ships, add transactions, expenses and invoices by hand and they work exactly as they will once connected.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROVIDERS.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card flex flex-col justify-between space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-card bg-sage-100 flex items-center justify-center font-bold text-sage-800 text-sm border border-sage-200/60 flex-shrink-0" aria-hidden="true">
                {item.initials}
              </div>
              <div>
                <h2 className="font-semibold text-sage-900 text-base">{item.name}</h2>
                <p className="text-xs text-sage-500 mt-0.5 font-medium">{item.description}</p>
                <p className="text-xs text-sage-600 mt-1 font-semibold">Not connected</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              aria-label={`Connect ${item.name} (coming soon)`}
              className="w-full py-2.5 px-4 rounded-card text-sm font-medium bg-sage-100 text-sage-500 border border-sage-200 cursor-not-allowed"
            >
              Coming soon
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
