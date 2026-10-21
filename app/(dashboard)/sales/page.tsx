"use client";

import React, { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSalesBoard } from "@/hooks/useSalesCrm";
import {
  dueLabel,
  formatMoney,
  isOverdue,
  isUuid,
  salesErrorMessage,
  type ClosedReason,
  type Deal,
} from "@/lib/api/sales";
import { celebrate } from "@/lib/confetti";
import { useToast } from "./ToastContext";
import { AddDealDrawer, DealDrawer, LostReasonModal } from "@/components/sales/deal-drawer";
import { StageEditor } from "@/components/sales/stage-editor";
import { BTN_ACCENT, BTN_SECONDARY, SalesGate, StallBadge } from "@/components/sales/shared";

function PipelineInner() {
  const board = useSalesBoard();
  const { triggerToast } = useToast();
  const params = useSearchParams();
  const dealParam = params.get("deal");
  const openDealId = isUuid(dealParam) ? dealParam : null;

  const [lostFor, setLostFor] = useState<{ dealId: string; stageId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editingStages, setEditingStages] = useState(false);
  const [adding, setAdding] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [drawerKey, setDrawerKey] = useState(0);

  const stages = board.data?.stages ?? [];
  const deals = board.data?.deals ?? [];
  const overview = board.data?.overview;

  // Native history calls keep useSearchParams in step (Next docs: single-page-applications). router.replace
  // back to the same path left ?deal= in place in a production build, so the drawer never closed.
  const openDeal = useCallback((id: string) => window.history.pushState(null, "", `/sales?deal=${encodeURIComponent(id)}`), []);
  const closeDeal = useCallback(() => window.history.replaceState(null, "", "/sales"), []);

  const performMove = async (
    dealId: string,
    stageId: string,
    lost?: { closed_reason: ClosedReason; closed_note?: string | null }
  ) => {
    const stage = stages.find((s) => s.id === stageId);
    const deal = deals.find((d) => d.id === dealId);
    try {
      await board.moveDeal(dealId, stageId, lost);
      setDrawerKey((k) => k + 1);
      if (stage?.kind === "won") {
        celebrate();
        setAnnounce(`Closed won: ${deal?.name ?? "deal"}${deal ? `, ${formatMoney(deal.value_minor)}` : ""}`);
      } else if (stage?.kind === "lost") {
        triggerToast("Deal marked as closed lost.");
      } else {
        setAnnounce(`Moved ${deal?.name ?? "deal"} to ${stage?.name ?? "stage"}`);
      }
    } catch (err) {
      triggerToast(salesErrorMessage(err), "error");
    }
  };

  const requestMove = (dealId: string, stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    const deal = deals.find((d) => d.id === dealId);
    if (!stage || (deal && deal.stage_id === stageId)) return;
    if (stage.kind === "lost") {
      setLostFor({ dealId, stageId });
      return;
    }
    void performMove(dealId, stageId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOver(null);
    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId) requestMove(dealId, stageId);
  };

  const lostDeal = lostFor ? deals.find((d) => d.id === lostFor.dealId) : undefined;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Pipeline</h1>
        {board.status === "ready" && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setEditingStages(true)} className={BTN_SECONDARY}>
              Edit stages
            </button>
            <button type="button" onClick={() => setAdding(true)} className={BTN_ACCENT}>
              + Add deal
            </button>
          </div>
        )}
      </div>

      <SalesGate status={board.status} error={board.error} onRetry={() => void board.reload()} loadingLabel="Loading pipeline">
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white px-6 py-5 rounded-modal border border-sage-200/80 shadow-card">
            <Stat label="Pipeline value" value={formatMoney(overview.total_pipeline_minor)} />
            <Stat label="Weighted forecast" value={formatMoney(overview.weighted_forecast_minor)} />
            <Stat
              label="Win rate"
              value={overview.win_rate === null ? "No closed deals yet" : `${overview.win_rate}%`}
              muted={overview.win_rate === null}
              accent
            />
          </div>
        )}

        {deals.length === 0 && (
          <p className="text-sm text-sage-600 bg-white border border-sage-200/80 rounded-card px-4 py-3">
            No deals yet. Add your first deal, or open Leads and choose &ldquo;Make it a deal&rdquo;.
          </p>
        )}

        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex items-start gap-4" style={{ minWidth: `${stages.length * 272}px` }}>
            {stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage_id === stage.id);
              const stageTotal = stageDeals.reduce((acc, d) => acc + d.value_minor, 0);
              return (
                <section
                  key={stage.id}
                  aria-label={`${stage.name} stage`}
                  className={`w-64 rounded-modal p-3 border space-y-3 flex-shrink-0 min-h-[300px] transition-colors ${
                    dragOver === stage.id ? "bg-green-100 border-green-400" : "bg-[#f2f6f4]/60 border-sage-200/80"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(stage.id);
                  }}
                  onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="px-2 pt-1 flex items-center justify-between gap-2 text-xs font-semibold text-sage-600">
                    <h2 className="truncate">{stage.name}</h2>
                    <span className="text-sage-500 font-medium whitespace-nowrap">
                      {stageDeals.length} · {formatMoney(stageTotal)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        open={stage.kind === "open"}
                        stages={stages}
                        onOpen={() => openDeal(deal.id)}
                        onMove={(stageId) => requestMove(deal.id, stageId)}
                      />
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-xs text-sage-500 italic border-2 border-dashed border-sage-200 rounded-card">
                        Drop here
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </SalesGate>

      {lostFor && (
        <LostReasonModal
          dealName={lostDeal?.name ?? "this deal"}
          onCancel={() => setLostFor(null)}
          onConfirm={async (reason, note) => {
            const target = lostFor;
            setLostFor(null);
            await performMove(target.dealId, target.stageId, { closed_reason: reason, closed_note: note });
          }}
        />
      )}

      {editingStages && board.data && (
        <StageEditor
          stages={board.data.stages}
          counts={board.data.overview.stages}
          onClose={() => setEditingStages(false)}
          onSaved={() => void board.reload()}
        />
      )}

      {adding && board.data && (
        <AddDealDrawer
          stages={board.data.stages}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            void board.reload();
          }}
        />
      )}

      {openDealId && board.data && (
        <DealDrawer
          dealId={openDealId}
          stages={board.data.stages}
          refreshKey={drawerKey}
          onClose={closeDeal}
          onChanged={() => void board.reload()}
          onMoveRequest={requestMove}
        />
      )}
    </div>
  );
}

function Stat({ label, value, muted = false, accent = false }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div>
      <span className="text-[11px] font-bold text-sage-500 uppercase tracking-wider block mb-1">{label}</span>
      <span
        className={`font-display font-bold ${muted ? "text-base text-sage-500" : "text-3xl"} ${
          accent && !muted ? "text-[#1e4836]" : muted ? "" : "text-sage-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DealCard({
  deal,
  open,
  stages,
  onOpen,
  onMove,
}: {
  deal: Deal;
  open: boolean;
  stages: { id: string; name: string }[];
  onOpen: () => void;
  onMove: (stageId: string) => void;
}) {
  const overdue = open && isOverdue(deal.next_step_due);
  const person = deal.contact_name ?? deal.account_name ?? deal.name;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", deal.id)}
      className="bg-white rounded-card p-4 border border-sage-200/90 shadow-card space-y-2 hover:border-sage-300 transition-all cursor-grab active:cursor-grabbing"
    >
      <button type="button" onClick={onOpen} className="block w-full text-left space-y-2 cursor-pointer" aria-label={`Open deal ${deal.name}`}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center text-xs font-bold shrink-0"
            aria-hidden="true"
          >
            {person.charAt(0).toUpperCase()}
          </div>
          <div className="font-display font-bold text-sage-900 text-base truncate">{deal.name}</div>
        </div>
        {(deal.account_name || deal.contact_name) && (
          <div className="text-xs text-sage-500 truncate">
            {[deal.account_name, deal.contact_name].filter(Boolean).join(" · ")}
          </div>
        )}
        <div className="font-bold text-green-900 text-sm">{formatMoney(deal.value_minor)}</div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className={`text-xs font-medium truncate ${overdue ? "text-red-600" : "text-sage-500"}`}>
            {deal.next_step || deal.next_step_due
              ? `${deal.next_step ?? "Next step"}${deal.next_step_due ? ` · ${dueLabel(deal.next_step_due)}` : ""}`
              : "No next step"}
          </span>
          <StallBadge deal={deal} />
        </div>
      </button>
      <select
        aria-label={`Move ${deal.name} to stage`}
        value={deal.stage_id}
        onChange={(e) => onMove(e.target.value)}
        className="md:hidden w-full bg-sage-50 border border-sage-200 rounded-input px-2 py-1.5 text-xs text-sage-700"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={null}>
      <PipelineInner />
    </Suspense>
  );
}
