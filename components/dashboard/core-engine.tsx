'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Flame } from 'lucide-react';
import { DashboardErrorBoundary } from './error-boundary';
import type { DashboardSummaryResponse, MissionTask } from '@/types/dashboard';

export function CoreEngine({
  data,
  onRefetch,
  onMissionUpdate
}: {
  data: DashboardSummaryResponse;
  onRefetch: () => void;
  onMissionUpdate: (taskId: string) => void;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full col-span-1 md:col-span-12">
      {/* Startup Health */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-4 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col items-center justify-between min-h-[300px]">
          <div className="w-full text-center">
            <h3 className="font-bold text-base text-sage-900 mb-1">Startup Health</h3>
          </div>
          <HealthGauge score={data.health?.score ?? 0} delta={data.health?.deltaWeekly ?? 0} />
          <Link href="/health" className="text-sm font-semibold text-[#266B4E] hover:underline mt-4">
            See what&apos;s driving it &rarr;
          </Link>
        </div>
      </DashboardErrorBoundary>

      {/* Today's Mission */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <MissionCard missions={data.mission?.tasks ?? []} onToggle={onMissionUpdate} />
      </DashboardErrorBoundary>

      {/* AI Briefing */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <AIBriefingCard briefing={data.briefing} />
      </DashboardErrorBoundary>
    </section>
  );
}

function HealthGauge({ score, delta }: { score: number; delta: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Color logic
  let color = '#2E7256'; // green-500
  if (score < 40) color = '#B0483B'; // red-600
  else if (score < 70) color = '#A8894B'; // brass-600

  const deltaText = delta >= 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background track */}
        <circle cx="50" cy="50" r="40" className="stroke-sage-100" strokeWidth="8" fill="none" />
        {/* Animated value track */}
        <circle
          cx="50" cy="50" r="40"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - (251.2 * animatedScore) / 100}
          strokeLinecap="round"
          className="transition-all duration-600 ease-out"
        />
      </svg>
      <div className="flex flex-col items-center justify-center z-10 text-center">
        <span className="text-4xl font-display font-bold text-sage-900" style={{ color }}>{animatedScore}</span>
        <span className="mt-1 bg-sage-50 border border-sage-200 text-sage-600 text-[10px] font-bold px-2 py-0.5 rounded-pill">
          {deltaText} this week
        </span>
      </div>
    </div>
  );
}

function MissionCard({ missions, onToggle }: { missions: MissionTask[]; onToggle: (id: string) => void }) {
  const allCompleted = missions.length > 0 && missions.every(m => m.completed);
  const streak = 4; // Mock streak

  if (allCompleted) {
    return (
      <div className="col-span-1 md:col-span-4 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col items-center justify-center min-h-[300px]">
        <Flame className="w-12 h-12 text-[#A8894B] mb-4 animate-bounce" />
        <h3 className="font-bold text-lg text-sage-900 text-center">Mission complete. 🔥 {streak}-day streak.</h3>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-4 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col justify-between min-h-[300px]">
      <div>
        <h3 className="font-bold text-base text-sage-900 mb-4">Today&apos;s Mission</h3>
        <ul className="space-y-3">
          {missions.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <button
                type="button"
                aria-label={`Toggle task: ${task.title}`}
                onClick={() => onToggle(task.id)}
                className={`w-6 h-6 rounded-input flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                  task.completed
                    ? 'bg-[#266B4E] text-white shadow-card'
                    : 'border border-sage-300 bg-white group-hover:border-sage-400'
                }`}
              >
                {task.completed && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>
              <div>
                <p className={`text-sm font-semibold transition-colors ${task.completed ? 'text-sage-500 line-through' : 'text-sage-900'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-sage-500 mt-1">{task.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link href="/mission" className="text-sm font-semibold text-[#266B4E] hover:underline mt-4 text-center">
        Go to mission &rarr;
      </Link>
    </div>
  );
}

function AIBriefingCard({ briefing }: { briefing: any }) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleDoIt = async () => {
    setIsAccepting(true);
    await fetch(`/api/v1/dashboard/briefing/${briefing.id}/actions/1/accept`, { method: 'POST' });
    setIsAccepting(false);
  };

  if (!briefing || briefing.hasEmptyState) {
    return (
      <div className="col-span-1 md:col-span-4 bg-[#12291F] text-white p-6 rounded-card shadow-card flex flex-col justify-between min-h-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#1E4D3B] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#A8894B]" />
          </div>
          <span className="font-bold text-sm text-sage-200">Co-Founder</span>
        </div>
        <p className="text-sm text-sage-200 leading-relaxed">
          I&apos;ll have your first briefing ready tomorrow morning once I&apos;ve seen a full day of your workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-4 bg-[#12291F] text-white p-6 rounded-card shadow-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#1E4D3B] flex items-center justify-center shadow-inner">
            <Sparkles className="w-5 h-5 text-[#A8894B]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
            <p className="text-xs font-semibold text-[#4E8F73]">Co-Founder</p>
          </div>
        </div>
        <p className="text-sm text-[#B3D0C3] leading-relaxed font-normal mb-6">
          {briefing.content}
        </p>
      </div>
      <div className="flex items-center gap-3 mt-auto">
        <button
          type="button"
          onClick={handleDoIt}
          disabled={isAccepting}
          className="flex-1 bg-[#A8894B] hover:bg-[#8A5330] disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-card transition-colors text-center cursor-pointer"
        >
          {isAccepting ? 'Accepting...' : 'Do it'}
        </button>
        <button
          type="button"
          className="flex-1 bg-[#1E4D3B] hover:bg-[#266049] border border-[#2E7256] text-white text-sm font-bold py-2.5 rounded-card transition-colors text-center cursor-pointer"
        >
          Tell me more
        </button>
      </div>
    </div>
  );
}
