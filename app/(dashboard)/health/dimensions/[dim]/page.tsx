'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, redirect } from 'next/navigation';
import { useHealthScore, mockDimensionSignals, DimensionKey } from '@/hooks/useHealthScore';

export default function DimensionBreakdownPage() {
  const params = useParams();
  const dim = params.dim as string;
  const { data } = useHealthScore();

  // Validate dimension parameter
  const dimensionKeys: DimensionKey[] = ['product', 'market', 'financial', 'legal', 'team'];
  if (!dimensionKeys.includes(dim as DimensionKey)) {
    redirect('/health/dimensions/product');
  }

  const dimensionKey = dim as DimensionKey;
  const dimensionData = data.dimensions[dimensionKey];
  const signals = mockDimensionSignals[dimensionKey] || [];

  return (
    <div className="flex flex-col gap-8 pt-2 pb-12">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {dimensionKeys.map((k) => {
          const dimLabel = k.charAt(0).toUpperCase() + k.slice(1);
          const isSelected = dimensionKey === k;
          return (
            <Link
              key={k}
              href={`/health/dimensions/${k}`}
              className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-[#183B28] border-[#183B28] text-white font-semibold'
                  : 'bg-white border-[#EBEBE6] text-[#1E2923] hover:border-[#C5CFC7]'
              }`}
            >
              {dimLabel} · {data.dimensions[k].score}
            </Link>
          );
        })}
      </div>

      <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
        What&apos;s driving {dimensionData.label}
      </h2>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#EBEBE6] text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                <th className="py-3.5 px-6 font-bold">SIGNAL</th>
                <th className="py-3.5 px-6 font-bold">CURRENT</th>
                <th className="py-3.5 px-6 font-bold">TARGET FOR STAGE</th>
                <th className="py-3.5 px-6 font-bold">CONTRIBUTION</th>
                <th className="py-3.5 px-6 font-bold">SOURCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EC] text-xs font-medium text-[#1E2923]">
              {signals.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-4 px-6 font-bold text-[#1E2923]">
                    {row.name}
                  </td>
                  <td className="py-4 px-6 text-[#556358]">{row.currentValue}</td>
                  <td className="py-4 px-6 text-[#556358]">{row.targetValue}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`font-bold ${
                        row.contribution < 0
                          ? 'text-[#B04C4C]' // Negative contribution -> Red
                          : 'text-[#2D5A3F]' // Positive contribution -> Green
                      }`}
                    >
                      {row.contribution > 0 ? `+${row.contribution}` : row.contribution} pts
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-[#183B28]">
                    <Link href={row.sourceUrl} className="hover:underline">
                      {row.sourceUrl.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
