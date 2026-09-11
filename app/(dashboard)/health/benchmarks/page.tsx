import React from 'react';

interface BenchmarkItem {
  category: string;
  percentile: number;
  medianPercent: number;
  yourPercent: number;
}

const benchmarkData: BenchmarkItem[] = [
  { category: 'Overall', percentile: 68, medianPercent: 53, yourPercent: 68 },
  { category: 'Product', percentile: 74, medianPercent: 56, yourPercent: 74 },
  { category: 'Market', percentile: 66, medianPercent: 58, yourPercent: 66 },
  { category: 'Financial', percentile: 41, medianPercent: 60, yourPercent: 56 }, // Wait, if percentile is 41, yourPercent should probably be left as is in the UI
  { category: 'Team', percentile: 80, medianPercent: 55, yourPercent: 80 },
];

export default function BenchmarksPage() {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
          How you compare
        </h2>
        <p className="text-xs text-[#617065] mt-1.5">
          Against anonymized fintech startups at the validation stage.
        </p>
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-7">
          {benchmarkData.map((item) => (
            <div key={item.category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1E2923]">{item.category}</span>
                <span className="font-bold text-[#1E2923]">{item.percentile}th percentile</span>
              </div>

              <div className="relative w-full h-3.5 bg-[#EAEFEA] rounded-full overflow-visible">
                {/* Median Range Bar */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-[#B8C4BB] rounded-full"
                  style={{ width: `${item.medianPercent}%` }}
                />
                
                {/* Your Position Indicator */}
                <div
                  className="absolute top-[-3px] bottom-[-3px] w-[3.5px] bg-[#2D5A3F] rounded-full z-10"
                  style={{ left: `${item.yourPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 pt-2 text-xs font-medium text-[#617065]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#B8C4BB] rounded-[2px]"></span>
            <span>Cohort median</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-3.5 bg-[#2D5A3F] rounded-[2px]"></span>
            <span>You</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] italic text-[#8E9B90]">
        Benchmarks are anonymized and aggregated. No startup&apos;s individual data is ever visible.
      </p>
    </div>
  );
}
