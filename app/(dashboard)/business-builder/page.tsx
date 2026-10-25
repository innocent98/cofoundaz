'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  Sun,
  Diamond,
  Smile,
  TrendingUp,
  Target,
  ShieldAlert,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { businessBuilderApi, type OverviewRow } from '@/lib/api/business-builder';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { ctaFor, indexByType, planCta, planProgress } from '@/lib/bb-overview';
import { relativeTime } from '@/lib/relative-time';
import { SuggestionsPanel } from '@/components/business-builder/suggestions-panel';

// The 9 Business Builder modules, keyed to the API's `type` on
// GET /business-builder/overview. Titles/descriptions/icons/paths are FE copy;
// completion + counts come from the API row for that type.
interface ModuleDef {
  id: string;
  type: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  isRecord: boolean; // record kinds report a `count`; canvases report `completion_pct`
}

const MODULES: ModuleDef[] = [
  { id: 'bmc', type: 'business_model', title: 'Business Model Canvas', description: 'The nine building blocks of how you create value.', path: '/business-builder/business-model-canvas', icon: <LayoutGrid className="w-4 h-4 text-brand-strong" />, isRecord: false },
  { id: 'lean', type: 'lean', title: 'Lean Canvas', description: 'A one-page problem-to-solution snapshot.', path: '/business-builder/lean-canvas', icon: <LayoutGrid className="w-4 h-4 text-brand-strong" />, isRecord: false },
  { id: 'mission', type: 'mission_vision', title: 'Mission & Vision', description: 'Why you exist and the world if you win.', path: '/business-builder/mission-vision', icon: <Sun className="w-4 h-4 text-brand-strong" />, isRecord: false },
  { id: 'value-prop', type: 'value_prop', title: 'Value Proposition', description: 'The fit between customer needs and what you offer.', path: '/business-builder/value-proposition', icon: <Diamond className="w-4 h-4 text-brand-strong" />, isRecord: false },
  { id: 'personas', type: 'persona', title: 'Customer Personas', description: 'Who you are building for, in detail.', path: '/business-builder/personas', icon: <Smile className="w-4 h-4 text-brand-strong" />, isRecord: true },
  { id: 'pricing', type: 'pricing', title: 'Pricing Strategy', description: 'Your model and tiers, grounded in willingness to pay.', path: '/business-builder/pricing', icon: <span className="text-xs font-bold text-brand-strong">₦</span>, isRecord: true },
  { id: 'revenue', type: 'revenue_stream', title: 'Revenue Model', description: 'Where the money comes from and how much.', path: '/business-builder/revenue-model', icon: <TrendingUp className="w-4 h-4 text-brand-strong" />, isRecord: true },
  { id: 'competitive', type: 'competitor', title: 'Competitive Analysis', description: 'Who else is out there and where you win.', path: '/business-builder/competitive-analysis', icon: <Target className="w-4 h-4 text-brand-strong" />, isRecord: true },
  { id: 'swot', type: 'swot', title: 'SWOT', description: 'Strengths, weaknesses, opportunities, threats.', path: '/business-builder/swot', icon: <ShieldAlert className="w-4 h-4 text-brand-strong" />, isRecord: false },
  { id: 'plan', type: 'plan', title: 'Business Plan', description: 'A full narrative plan drafted from everything above.', path: '/business-builder/plan', icon: <FileText className="w-4 h-4 text-brand-strong" />, isRecord: false },
];

export default function BusinessBuilderOverviewPage() {
  const [rows, setRows] = useState<Record<string, OverviewRow>>({});
  const [loading, setLoading] = useState(true);
  const { canWrite } = useBuilderAccess();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await businessBuilderApi.getOverview();
        if (active) setRows(indexByType(list));
      } catch {
        // fresh workspace / auth issue → cards render at 0
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const getProgressColor = (pct: number) => {
    if (pct === 100) return 'var(--color-brand-strong)';
    if (pct >= 60) return 'var(--color-brand-mid)';
    if (pct >= 40) return 'var(--color-accent-700)';
    return 'var(--color-danger-xb26b6b)';
  };

  return (
    <>
      <div>
        <h2 className="text-3xl font-display font-bold text-ink tracking-tight">
          Business Builder
        </h2>
        <p className="text-xs text-ink-soft mt-1.5 max-w-xl">
          Define the business. Every artifact you finish here feeds your plan, your score, and your pitch.
        </p>
      </div>

      {/* Pending teammate suggestions to approve/reject (renders nothing when empty). */}
      <SuggestionsPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map((card) => {
          const row = rows[card.type];
          const isPlan = card.type === 'plan';
          const count = row?.count ?? 0;
          // Rings follow the API: canvases and records report `completion_pct`; the plan is
          // complete or not. Record tiles show the item count in the ring, canvases the percent.
          const progress = isPlan ? planProgress(row) : (row?.completion_pct ?? 0);
          const centerLabel = isPlan ? (progress === 100 ? '100%' : '0%') : card.isRecord ? `${count}` : `${progress}%`;
          const strokeColor = getProgressColor(progress);
          const cta = isPlan ? planCta(row, canWrite) : ctaFor(row, canWrite);
          const edited = relativeTime(row?.updated_at);
          const detail = card.isRecord && count > 0 ? `${count} item${count === 1 ? '' : 's'}` : null;
          return (
            <Link
              key={card.id}
              href={cta.href ?? card.path}
              className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col justify-between gap-6 hover:shadow-card transition-shadow group cursor-pointer block"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-modal bg-neutral-xe6efea flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>

                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="var(--color-line-soft)"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke={strokeColor}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className={loading ? 'opacity-40' : ''}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-ink">
                      {loading ? '·' : centerLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-ink group-hover:text-brand-strong transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 pt-2">
                <div className="flex items-center gap-1 text-xs font-bold text-brand-strong">
                  <span>{loading ? '' : cta.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                {!loading && (
                  <span className="text-[11px] text-ink-subtle text-right">
                    {[detail, edited ? `Edited ${edited}` : row?.status === 'generating' ? 'In progress' : 'Not started'].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
