'use client';

import React, { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useHealthRecommendations } from '@/hooks/useHealthDetails';

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'dismissed', label: 'Dismissed' },
] as const;

export default function RecommendationsPage() {
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'dismissed'>('pending');
  const { recs, loading, error, accept, dismiss } = useHealthRecommendations(filter);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const run = async (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusyId(id);
    setRowError((p) => ({ ...p, [id]: '' }));
    const res = await fn();
    setBusyId(null);
    if (!res.ok) setRowError((p) => ({ ...p, [id]: res.error || 'Could not action this.' }));
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">Recommendations</h2>
        <p className="text-xs text-[#617065] mt-1.5">Ranked by priority. Each lift is an estimate, not a guarantee.</p>
      </div>

      <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6] w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
              filter === f.key ? 'bg-white text-[#1E2923] font-bold shadow-card' : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-28 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-modal p-4 text-sm text-[#B0483B]">{error}</div>
      )}

      {!loading && !error && recs.length === 0 && (
        <div className="text-center py-12 text-[#617065] text-sm">
          {filter === 'pending' ? 'All caught up — no pending recommendations right now.' : `No ${filter} recommendations.`}
        </div>
      )}

      {!loading && recs.length > 0 && (
        <div className="flex flex-col gap-4">
          {recs.map((item) => {
            const busy = busyId === item.id;
            return (
              <div key={item.id} className="bg-white rounded-modal p-6 md:p-7 border border-[#EBEBE6] shadow-card flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
                      est. +{item.estimated_lift}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-base font-bold text-[#1E2923] leading-snug">{item.title}</h3>
                      <p className="text-xs text-[#617065] leading-relaxed">{item.body}</p>
                      <div className="text-[11px] text-[#768478] mt-1 font-medium capitalize">
                        Effort: {item.effort} · {item.dimension}
                      </div>
                    </div>
                  </div>

                  {filter === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        onClick={() => run(item.id, () => accept(item.id))}
                        disabled={busy}
                        className="flex items-center gap-1 bg-[#183B28] hover:bg-[#11291C] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-card transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => run(item.id, () => dismiss(item.id))}
                        disabled={busy}
                        className="flex items-center gap-1 bg-white hover:bg-[#F5F5F0] text-[#617065] border border-[#EBEBE6] text-xs font-bold px-4 py-2 rounded-card transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
                {rowError[item.id] && (
                  <div className="flex items-start gap-1.5 text-[11px] font-semibold text-[#B0483B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-input px-2.5 py-1.5 w-fit">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{rowError[item.id]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
