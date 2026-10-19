'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, redirect } from 'next/navigation';
import type { DimensionKey } from '@/hooks/useHealthScore';
import { useHealthOverview } from '@/components/health/health-score-provider';
import { HealthError } from '@/components/health/health-states';
import { formatContribution, formatSignalTarget, formatSignalValue, sourceLabel } from '@/lib/health-format';
import { useHealthDimension } from '@/hooks/useHealthDetails';
import { DimensionTrendChart } from '@/components/health/health-charts';

const DIM_KEYS: DimensionKey[] = ['product', 'market', 'financial', 'legal', 'team'];

export default function DimensionBreakdownPage() {
  const params = useParams();
  const dim = params.dim as string;
  const { data } = useHealthOverview();

  const valid = DIM_KEYS.includes(dim as DimensionKey);
  const dimensionKey = (valid ? dim : 'product') as DimensionKey;
  const { detail, loading, notFound, error, refetch } = useHealthDimension(dimensionKey);
  if (!valid) redirect('/health/dimensions/product');

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
              {dimLabel}{data.status === 'ok' ? ` · ${data.dimensions[k]?.score}` : ''}
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

      {!loading && error && (
        <HealthError title={`Couldn't load ${label}`} message={error} onRetry={refetch} />
      )}

      {!loading && detail && (
        <>
          {detail.trend.length > 0 && (
            <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6">
              <h3 className="text-sm font-bold text-[#1E2923] uppercase tracking-wide mb-3">{label} over time</h3>
              <DimensionTrendChart points={detail.trend} />
            </div>
          )}

          <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-[#EBEBE6] text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    <th className="py-3.5 px-6 font-bold">Signal</th>
                    <th className="py-3.5 px-6 font-bold">Current</th>
                    <th className="py-3.5 px-6 font-bold">Target for stage</th>
                    <th className="py-3.5 px-6 font-bold">Contribution</th>
                    <th className="py-3.5 px-6 font-bold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EC] text-xs font-medium text-[#1E2923]">
                  {detail.signals.length === 0 && (
                    <tr><td colSpan={5} className="py-6 px-6 text-[#8E9B90] italic">No signals recorded yet.</td></tr>
                  )}
                  {detail.signals.map((row) => (
                    <tr key={row.key} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-4 px-6 font-bold text-[#1E2923]">{row.label}</td>
                      <td className="py-4 px-6 text-[#556358]">{formatSignalValue(row)}</td>
                      <td className="py-4 px-6 text-[#556358]">{formatSignalTarget(row)}</td>
                      <td className="py-4 px-6">
                        <span className={`font-bold ${row.contribution < 0 ? 'text-[#B04C4C]' : 'text-[#2D5A3F]'}`}>
                          {formatContribution(row.contribution)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Link href={row.href} className="font-semibold text-[#183B28] hover:text-[#11291C] underline-offset-2 hover:underline">
                          {sourceLabel(row.href)}
                        </Link>
                      </td>
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
                    est. +{rec.estimated_lift} pts
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#1E2923]">{rec.title}</span>
                    <span className="text-xs text-[#617065] leading-relaxed">{rec.body}</span>
                    <span className="text-[11px] text-[#768478] mt-0.5 capitalize">Effort: {rec.effort}</span>
                  </div>
                  <Link
                    href={rec.href}
                    className="ml-auto shrink-0 bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold px-4 py-2 rounded-card transition-colors"
                  >
                    Do it
                  </Link>
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
