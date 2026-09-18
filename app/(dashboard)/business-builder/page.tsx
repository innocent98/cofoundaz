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
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
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
  { id: 'bmc', type: 'business_model', title: 'Business Model Canvas', description: 'The nine building blocks of how you create value.', path: '/business-builder/business-model-canvas', icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />, isRecord: false },
  { id: 'lean', type: 'lean', title: 'Lean Canvas', description: 'A one-page problem-to-solution snapshot.', path: '/business-builder/lean-canvas', icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />, isRecord: false },
  { id: 'mission', type: 'mission_vision', title: 'Mission & Vision', description: 'Why you exist and the world if you win.', path: '/business-builder/mission-vision', icon: <Sun className="w-4 h-4 text-[#183B28]" />, isRecord: false },
  { id: 'value-prop', type: 'value_prop', title: 'Value Proposition', description: 'The fit between customer needs and what you offer.', path: '/business-builder/value-proposition', icon: <Diamond className="w-4 h-4 text-[#183B28]" />, isRecord: false },
  { id: 'personas', type: 'persona', title: 'Customer Personas', description: 'Who you are building for, in detail.', path: '/business-builder/personas', icon: <Smile className="w-4 h-4 text-[#183B28]" />, isRecord: true },
  { id: 'pricing', type: 'pricing', title: 'Pricing Strategy', description: 'Your model and tiers, grounded in willingness to pay.', path: '/business-builder/pricing', icon: <span className="text-xs font-bold text-[#183B28]">₦</span>, isRecord: true },
  { id: 'revenue', type: 'revenue_stream', title: 'Revenue Model', description: 'Where the money comes from and how much.', path: '/business-builder/revenue-model', icon: <TrendingUp className="w-4 h-4 text-[#183B28]" />, isRecord: true },
  { id: 'competitive', type: 'competitor', title: 'Competitive Analysis', description: 'Who else is out there and where you win.', path: '/business-builder/competitive-analysis', icon: <Target className="w-4 h-4 text-[#183B28]" />, isRecord: true },
  { id: 'swot', type: 'swot', title: 'SWOT', description: 'Strengths, weaknesses, opportunities, threats.', path: '/business-builder/swot', icon: <ShieldAlert className="w-4 h-4 text-[#183B28]" />, isRecord: false },
];

interface OverviewRow {
  type: string;
  label: string;
  status: string;
  completion_pct?: number;
  filled_blocks?: number;
  total_blocks?: number;
  count?: number;
}

export default function BusinessBuilderOverviewPage() {
  const [rows, setRows] = useState<Record<string, OverviewRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient<{ data?: OverviewRow[] }>('/business-builder/overview');
        const list = res?.data ?? [];
        if (active) {
          const byType: Record<string, OverviewRow> = {};
          for (const r of list) byType[r.type] = r;
          setRows(byType);
        }
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
    if (pct === 100) return '#183B28';
    if (pct >= 60) return '#2D5A3F';
    if (pct >= 40) return '#8A5330';
    return '#B26B6B';
  };

  return (
    <>
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Business Builder
        </h2>
        <p className="text-xs text-[#768478] mt-1.5 max-w-xl">
          Define the business. Every artifact you finish here feeds your plan, your score, and your pitch.
        </p>
      </div>

      {/* Pending teammate suggestions to approve/reject (renders nothing when empty). */}
      <SuggestionsPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map((card) => {
          const row = rows[card.type];
          const count = row?.count ?? 0;
          // Canvases show real completion %; record kinds show item count and a
          // binary "started" ring (no server completion % exists for them).
          const progress = card.isRecord ? (count > 0 ? 100 : 0) : (row?.completion_pct ?? 0);
          const centerLabel = card.isRecord ? `${count}` : `${progress}%`;
          const strokeColor = getProgressColor(progress);
          return (
            <Link
              key={card.id}
              href={card.path}
              className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6 hover:shadow-card transition-shadow group cursor-pointer block"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-modal bg-[#E6EFEA] flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>

                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#EBEBE6"
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
                    <span className="absolute text-[10px] font-bold text-[#1E2923]">
                      {loading ? '·' : centerLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-[#1E2923] group-hover:text-[#183B28] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#768478] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-[#183B28] pt-2">
                <span>{card.isRecord ? (count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'Start') : row?.status === 'done' ? 'Review' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
