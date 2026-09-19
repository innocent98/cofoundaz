'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X, ClipboardCheck } from 'lucide-react';
import { useHealthScore } from '@/hooks/useHealthScore';
import type { HealthBand } from '@/hooks/useHealthScore';
import { DimensionsRadar } from '@/components/health/health-charts';

function RadialGauge({ targetScore }: { targetScore: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 600; // 600ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.floor(easeOut * targetScore));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [targetScore]);

  // Determine stroke color strictly based on target score (decoupled from animation)
  let strokeColor = '#B0483B'; // --red-600
  if (targetScore >= 70) strokeColor = '#2E7256'; // --green-500
  else if (targetScore >= 40) strokeColor = '#9C5B34'; // copper-600

  // Circumference calculation for 100 max
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative w-44 h-44 flex items-center justify-center my-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" stroke="#193B28" strokeWidth="8" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={strokeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-75"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-display font-bold text-white tracking-tight">
          {displayScore}
        </span>
        <span className="text-xs text-[#8BA193] mt-0.5">of 100</span>
      </div>
    </div>
  );
}

// Band → tile presentation. The API returns a per-dimension `band`
// (at_risk / needs_work / healthy / thriving); we drive colour and the caption
// off it instead of hardcoded weekly-change strings.
const BAND_UI: Record<HealthBand, { label: string; tone: 'good' | 'warn' | 'bad'; path: string }> = {
  thriving: { label: 'Thriving', tone: 'good', path: 'M 0 20 Q 75 18 150 10' },
  healthy: { label: 'Healthy', tone: 'good', path: 'M 0 20 Q 75 18 150 10' },
  needs_work: { label: 'Needs work', tone: 'warn', path: 'M 0 15 L 150 15' },
  at_risk: { label: 'At risk', tone: 'bad', path: 'M 0 10 Q 75 12 150 20' },
};

function MetricCard({
  title,
  score,
  band,
  dimKey,
}: {
  title: string;
  score: number;
  band: HealthBand | null;
  dimKey: string;
}) {
  const ui = band ? BAND_UI[band] : { label: '—', tone: 'warn' as const, path: 'M 0 15 L 150 15' };
  const strokeColor = ui.tone === 'good' ? '#2D5A3F' : '#9C5B34';
  const captionColor =
    ui.tone === 'good' ? 'text-[#2D5A3F]' : ui.tone === 'bad' ? 'text-[#B04C4C]' : 'text-[#768478]';

  return (
    <Link href={`/health/dimensions/${dimKey}`} className="block group">
      <div className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-4 group-hover:border-[#C5CFC7] transition-colors cursor-pointer h-full">
        <div>
          <span className="text-xs font-semibold text-[#1E2923]">{title}</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl md:text-3xl font-display font-bold text-[#1E2923]">
              {score}
            </span>
            <span className="text-xs text-[#768478] font-medium">/100</span>
          </div>
        </div>

        <div className="w-full h-6 flex items-center overflow-hidden">
          <svg className="w-full h-5" viewBox="0 0 150 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={ui.path} stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <span className={`text-xs font-semibold ${captionColor}`}>{ui.label}</span>
      </div>
    </Link>
  );
}

// Empty-state shown before the founder completes the kickoff assessment
// (GET /health-score → status "pending_assessment"). Copy comes from the API's
// own `message`.
function PendingState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-[24px] p-10 md:p-14 border border-[#EBEBE6] shadow-card flex flex-col items-center text-center gap-5 max-w-2xl mx-auto mt-4">
      <div className="p-3 bg-[#EAF2ED] rounded-full">
        <ClipboardCheck className="w-7 h-7 text-[#2D5A3F]" />
      </div>
      <h2 className="text-2xl md:text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
        Your Health Score is waiting
      </h2>
      <p className="text-sm md:text-base text-[#617065] leading-relaxed max-w-md">
        {message}
      </p>
      <Link
        href="/assessment"
        className="bg-[#9C5B34] hover:bg-[#8A5330] text-white text-sm font-bold px-6 py-3 rounded-card transition-colors shadow-card inline-block"
      >
        Take your assessment
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 bg-[#0F2218]/90 rounded-[24px] min-h-[320px]" />
        <div className="lg:col-span-8 bg-white border border-[#EBEBE6] rounded-[24px] min-h-[320px]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#EBEBE6] rounded-modal h-32" />
        ))}
      </div>
    </div>
  );
}

export default function HealthOverviewPage() {
  const { data, loading } = useHealthScore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Esc key listener for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  if (loading) {
    return <LoadingState />;
  }

  if (data.status === 'pending_assessment') {
    return <PendingState message={data.message} />;
  }

  const dims = data.dimensions;

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 bg-[#0F2218] rounded-[24px] p-8 flex flex-col items-center justify-between text-center min-h-[320px] shadow-card">
            <RadialGauge targetScore={data.score} />
            <div className="flex flex-col items-center gap-2 mt-2">
              <span className="bg-[#EAF2ED] text-[#183B28] px-3.5 py-1 rounded-full text-xs font-bold">
                {data.weeklyDelta > 0 ? '+' : ''}{data.weeklyDelta} this week
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-[#D89A6E] hover:underline font-medium mt-1 cursor-pointer"
              >
                How is this calculated?
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-[24px] p-8 md:p-10 border border-[#EBEBE6] shadow-card flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[#8A5330] mb-4">
              <div className="p-1.5 bg-[#F7EEDC] rounded-[6px]">
                <Sparkles className="w-4 h-4 fill-[#8A5330]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                AI summary
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-medium text-[#1E2923] leading-snug tracking-tight">
              {data.summary}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard title="Product" score={dims.product.score} band={dims.product.band} dimKey="product" />
          <MetricCard title="Market" score={dims.market.score} band={dims.market.band} dimKey="market" />
          <MetricCard title="Financial" score={dims.financial.score} band={dims.financial.band} dimKey="financial" />
          <MetricCard title="Legal" score={dims.legal.score} band={dims.legal.band} dimKey="legal" />
          <MetricCard title="Team" score={dims.team.score} band={dims.team.band} dimKey="team" />
        </div>

        <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#EBEBE6] shadow-card">
          <h2 className="text-sm font-bold text-[#1E2923] uppercase tracking-wide mb-2">Dimension balance</h2>
          <p className="text-xs text-[#768478] mb-2">How your five dimensions compare right now.</p>
          <DimensionsRadar
            data={[
              { dimension: 'Product', score: dims.product.score },
              { dimension: 'Market', score: dims.market.score },
              { dimension: 'Financial', score: dims.financial.score },
              { dimension: 'Legal', score: dims.legal.score },
              { dimension: 'Team', score: dims.team.score },
            ]}
          />
        </div>

        {data.topRecommendations.length > 0 && (
          <div className="flex flex-col gap-5 pt-2 pb-12">
            <h2 className="text-2xl font-display font-semibold text-[#1E2923] tracking-tight">
              Top {Math.min(3, data.topRecommendations.length)} fastest ways to raise your score
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.topRecommendations.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col items-start gap-3">
                    <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-semibold px-3 py-1 rounded-full">
                      est. +{item.estimatedLift} pts
                    </span>
                    <h3 className="text-base font-bold text-[#1E2923] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#617065] leading-relaxed">
                      {item.rationale}
                    </p>
                  </div>

                  <Link
                    href={item.actionUrl}
                    className="w-full text-center bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold py-3 rounded-card transition-colors shadow-card inline-block"
                  >
                    Do it
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-[24px] max-w-md w-full p-8 shadow-card relative"
            onClick={(e) => e.stopPropagation()} // prevent backdrop dismiss
          >
            <button
              className="absolute top-4 right-4 p-2 text-[#768478] hover:bg-[#F5F5F0] rounded-full transition-colors cursor-pointer"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-display font-bold text-[#1E2923] mb-4">How is this calculated?</h3>
            <p className="text-sm text-[#617065] leading-relaxed">
              Your Health Score weighs live signals from every hub — roadmap progress, runway, validation evidence, legal hygiene, and team activity — against benchmarks for your stage and industry. It&apos;s explainable: every point traces to something real, and every recommendation tells you the estimated lift.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
