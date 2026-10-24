"use client";

import React, { useState } from "react";
import { useSendingStatus, useSequences } from "@/hooks/useSalesSequences";
import { BTN_ACCENT, EmptyState, SalesGate } from "@/components/sales/shared";
import { SendingBanner } from "@/components/sales/sequences/sending-banner";
import { SequenceCard } from "@/components/sales/sequences/sequence-card";

export default function SequencesPage() {
  const sequences = useSequences();
  const sending = useSendingStatus();
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    void sequences.reload();
    void sending.reload();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Email sequences</h1>
        {sequences.status === "ready" && (
          <button type="button" disabled={creating} onClick={() => setCreating(true)} className={BTN_ACCENT}>
            + New sequence
          </button>
        )}
      </div>

      <SalesGate status={sequences.status} error={sequences.error} onRetry={() => void sequences.reload()} loadingLabel="Loading sequences">
        {sending.data && <SendingBanner status={sending.data} onChanged={() => void sending.reload()} />}

        {creating && (
          <SequenceCard
            sequence={null}
            onDiscardNew={() => setCreating(false)}
            onChanged={refresh}
            onSaved={() => {
              setCreating(false);
              refresh();
            }}
          />
        )}

        {(sequences.data ?? []).map((seq) => (
          <SequenceCard
            key={`${seq.id}:${seq.updated_at}`}
            sequence={seq}
            onChanged={refresh}
            onSaved={refresh}
          />
        ))}

        {(sequences.data ?? []).length === 0 && !creating && (
          <EmptyState
            title="No sequences yet"
            body="A sequence is a short run of emails sent for you, with waits in between. Build one, then enrol leads and contacts."
            cta={
              <button type="button" className={BTN_ACCENT} onClick={() => setCreating(true)}>
                + New sequence
              </button>
            }
          />
        )}
      </SalesGate>
    </div>
  );
}
