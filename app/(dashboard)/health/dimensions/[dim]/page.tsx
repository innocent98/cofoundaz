'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, redirect } from 'next/navigation';
import { useHealthScore, DimensionKey } from '@/hooks/useHealthScore';
import { useHealthDimension } from '@/hooks/useHealthDetails';

const DIM_KEYS: DimensionKey[] = ['product', 'market', 'financial', 'legal', 'team'];

function humanizeSignal(key: string): string {
  const tail = key.split('.').pop() || key;
  return tail.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
function sourceLabel(ref: string): string {
  return (ref.split(':')[0] || ref).replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function DimensionBreakdownPage() {
  const params = useParams();
  const dim = params.dim as string;
  const { data } = useHealthScore();

  if (!DIM_KEYS.includes(dim as DimensionKey)) {
    redirect('/health/dimensions/product');
  }
  const dimensionKey = dim as DimensionKey;
  const { detail, loading, notFound } = useHealthDimension(dimensionKey);

  const label = detail?.label ?? data.dimensions[dimensionKey]?.label ?? dimensionKey;

  return (
    <div className="flex flex-col gap-8 pt-2 pb-12">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {DIM_KEYS.map((k) => {
          const dimLabel = data.dimensions[k]?.label ?? (k.charAt(0).toUpperCase() + k.slice(1));
          const isSelected = dimensionKey === k;
          return (
            <Link
              key={k}
              href={`/health/dimensions/${k}`}
              className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                isSelected ? 'bg-[#183B28] border-[#183B28] text-white font-semibold' : 'bg-white border-[#EBEBE6] text-[#1E2923] hover:border-[#C5CFC7]'
              }`}
            >
              {dimLabel} · {data.dimensions[k]?.score ?? '—'}
            </Link>
          );
        })}
      </div>

      <div className="flex items-baseline gap-3">
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">What&apos;s driving {label}</h2>
        {detail && <span className="text-lg font-bold text-[#2D5A3F]">{detail.score}</span>}
      </div>

      {loading && <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-48 animate-pulse" />}

      {!loading && notFound && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-8 text-center text-sm text-[#617065]">
          That dimension isn&apos;t available.
        </div>
      )}

      {!loading && detail && (
        <>
          <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-[#EBEBE6] text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    <th className="py-3.5 px-6 font-bold">Signal</th>
                    <th className="py-3.5 px-6 font-bold">Value</th>
                    <th className="py-3.5 px-6 font-bold">Contribution</th>
                    <th className="py-3.5 px-6 font-bold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EC] text-xs font-medium text-[#1E2923]">
                  {detail.signals.length === 0 && (
                    <tr><td colSpan={4} className="py-6 px-6 text-[#8E9B90] italic">No signals recorded yet.</td></tr>
                  )}
                  {detail.signals.map((row) => (
                    <tr key={row.key} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-4 px-6 font-bold text-[#1E2923]">{humanizeSignal(row.key)}</td>
                      <td className="py-4 px-6 text-[#556358]">{row.value}</td>
                      <td className="py-4 px-6">
                        <span className={`font-bold ${row.contribution < 0 ? 'text-[#B04C4C]' : 'text-[#2D5A3F]'}`}>
                          {row.contribution > 0 ? `+${row.contribution}` : row.contribution} pts
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#556358]">{sourceLabel(row.source_ref)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {detail.recommendations.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-[#1E2923]">How to improve {label}</h3>
              {detail.recommendations.map((rec) => (
                <div key={rec.id} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-5 flex items-start gap-4">
                  <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
                    est. +{rec.estimated_lift}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#1E2923]">{rec.title}</span>
                    <span className="text-xs text-[#617065] leading-relaxed">{rec.body}</span>
                    <span className="text-[11px] text-[#768478] mt-0.5 capitalize">Effort: {rec.effort}</span>
                  </div>
                </div>
              ))}
              <Link href="/health/recommendations" className="text-xs font-semibold text-[#183B28] hover:text-[#11291C]">
                See all recommendations →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
