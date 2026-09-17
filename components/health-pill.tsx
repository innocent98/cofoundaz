'use client';

import { useHealthScore } from '@/hooks/useHealthScore';

/**
 * The workspace Health Score pill shown in the dashboard shells' headers.
 * Reads the real score (GET /health-score) and renders nothing until an
 * assessment exists — never a hardcoded number. Replaces the per-shell `72`.
 */
export function HealthPill({ className = '' }: { className?: string }) {
  const { data: health, loading } = useHealthScore();
  if (loading || health.status !== 'ok') return null;

  return (
    <div
      className={
        className ||
        'bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 h-[34px]'
      }
    >
      <span>Health</span>
      <span className="font-bold">{health.score}</span>
      {health.weeklyDelta !== 0 && (
        <span className={`font-bold ${health.weeklyDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {health.weeklyDelta > 0 ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
}
