'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, redirect } from 'next/navigation';
import type { DimensionKey } from '@/hooks/useHealthScore';
import { useHealthOverview } from '@/components/health/health-score-provider';
import { HealthError } from '@/components/health/health-states';
import { formatLift, formatContribution, formatSignalTarget, formatSignalValue, sourceLabel } from '@/lib/health-format';
import { useWorkspace } from '@/components/workspace-context';
import { canOpenPath } from '@/lib/nav-access';
import { useHealthDimension } from '@/hooks/useHealthDetails';
import { DimensionTrendChart } from '@/components/health/health-charts';

const DIM_KEYS: DimensionKey[] = ['product', 'market', 'financial', 'legal', 'team'];

export default function DimensionBreakdownPage() {
  const params = useParams();
  const dim = params.dim as string;
  const { data } = useHealthOverview();
  const { role } = useWorkspace();

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
                isSelected ? 'bg-brand-strong border-brand-strong text-white font-semibold' : 'bg-white border-line-soft text-ink hover:border-neutral-xc5cfc7'
              }`}
            >
              {dimLabel}{data.status === 'ok' ? ` · ${data.dimensions[k]?.score}` : ''}
            </Link>
          );
        })}
      </div>

      <div className="flex items-baseline gap-3">
        <h2 className="text-3xl font-display font-medium text-ink tracking-tight">What&apos;s driving {label}</h2>
        {detail && <span className="text-lg font-bold text-brand-mid">{detail.score}</span>}
      </div>

      {loading && <div className="bg-white rounded-modal border border-line-soft shadow-card h-48 animate-pulse" />}

      {!loading && notFound && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-8 text-center text-sm text-ink-muted">
          That dimension isn&apos;t available.
        </div>
      )}

      {!loading && error && (
        <HealthError title={`Couldn't load ${label}`} message={error} onRetry={refetch} />
      )}

      {!loading && detail && (
        <>
          {detail.trend.length > 0 && (
            <div className="bg-white rounded-modal border border-line-soft shadow-card p-6">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide mb-3">{label} over time</h3>
              <DimensionTrendChart points={detail.trend} />
            </div>
          )}

          <div className="bg-white rounded-modal border border-line-soft shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-surface-subtle border-b border-line-soft text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                    <th className="py-3.5 px-6 font-bold">Signal</th>
                    <th className="py-3.5 px-6 font-bold">Current</th>
                    <th className="py-3.5 px-6 font-bold">Target for stage</th>
                    <th className="py-3.5 px-6 font-bold">Contribution</th>
                    <th className="py-3.5 px-6 font-bold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-faint text-xs font-medium text-ink">
                  {detail.signals.length === 0 && (
                    <tr><td colSpan={5} className="py-6 px-6 text-ink-subtle italic">No signals recorded yet.</td></tr>
                  )}
                  {detail.signals.map((row) => (
                    <tr key={row.key} className="hover:bg-neutral-xfaf9f6 transition-colors">
                      <td className="py-4 px-6 font-bold text-ink">{row.label}</td>
                      <td className="py-4 px-6 text-ink-body">{formatSignalValue(row)}</td>
                      <td className="py-4 px-6 text-ink-body">{formatSignalTarget(row)}</td>
                      <td className="py-4 px-6">
                        <span className={`font-bold ${row.contribution < 0 ? 'text-danger-xb04c4c' : 'text-brand-mid'}`}>
                          {formatContribution(row.contribution)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Link href={row.href} className="font-semibold text-brand-strong hover:text-brand-rail underline-offset-2 hover:underline">
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
              <h3 className="text-sm font-bold text-ink">How to improve {label}</h3>
              {detail.recommendations.map((rec) => (
                <div key={rec.id} className="bg-white rounded-modal border border-line-soft shadow-card p-5 flex items-start gap-4">
                  <span className="bg-brand-tint text-brand-mid text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
                    {formatLift(rec.estimated_lift)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-ink">{rec.title}</span>
                    <span className="text-xs text-ink-muted leading-relaxed">{rec.body}</span>
                    <span className="text-[11px] text-ink-soft mt-0.5 capitalize">Effort: {rec.effort}</span>
                  </div>
                  {canOpenPath(rec.href, role) && (
                    <Link
                      href={rec.href}
                      className="ml-auto shrink-0 bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold px-4 py-2 rounded-card transition-colors"
                    >
                      Do it
                    </Link>
                  )}
                </div>
              ))}
              <Link href="/health/recommendations" className="text-xs font-semibold text-brand-strong hover:text-brand-rail">
                See all recommendations →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
