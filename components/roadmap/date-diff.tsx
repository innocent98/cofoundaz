'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

// Whole-day delta between two YYYY-MM-DD dates. Positive = the new date is later
// (a slip), negative = earlier (pulled in). Returns null if either is unparseable.
export function dayDelta(oldIso: string, newIso: string): number | null {
  const a = new Date(`${oldIso}T00:00:00`);
  const b = new Date(`${newIso}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function fmtDay(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function deltaLabel(days: number): string {
  if (days === 0) return 'same day';
  const n = Math.abs(days);
  return `${days > 0 ? '+' : '−'}${n} day${n === 1 ? '' : 's'}`;
}

/**
 * The shared before→after date diff used by both the re-plan preview and the
 * history entries: old date (struck through) → arrow → new date, plus a signed
 * day-delta chip so the magnitude of the shift is visible, not just the endpoints.
 */
export function DateDiff({ oldDue, newDue }: { oldDue: string; newDue: string }) {
  const delta = dayDelta(oldDue, newDue);
  const later = (delta ?? 0) > 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-[#F5F5F0] border border-[#EBEBE6] px-2.5 py-1 rounded text-xs font-bold text-[#768478] line-through">
        {fmtDay(oldDue)}
      </span>
      <ArrowRight className="w-4 h-4 text-[#C5CFC7] shrink-0" />
      <span className="bg-[#EAF2ED] border border-[#CDE1D3] px-2.5 py-1 rounded text-xs font-bold text-[#2D5A3F]">
        {fmtDay(newDue)}
      </span>
      {delta !== null && delta !== 0 && (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            later ? 'bg-[#FBEBEB] text-[#B0483B]' : 'bg-[#EAF2ED] text-[#2D5A3F]'
          }`}
        >
          {deltaLabel(delta)}
        </span>
      )}
    </div>
  );
}
