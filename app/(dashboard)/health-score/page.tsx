'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar'; // Adjust path as needed
import { Bell, Plus, Sparkles } from 'lucide-react';

interface MetricCardProps {
  title: string;
  score: number;
  change: string;
  isNegative?: boolean;
  isSteady?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  score,
  change,
  isNegative = false,
  isSteady = false,
}) => {
  const strokeColor = isNegative ? '#9C5B34' : isSteady ? '#9C5B34' : '#2D5A3F';
  const pathD = isNegative
    ? 'M 0 10 Q 75 12 150 20'
    : isSteady
    ? 'M 0 15 L 150 15'
    : 'M 0 20 Q 75 18 150 10';

  return (
    <div className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-4">
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
        <svg
          className="w-full h-5"
          viewBox="0 0 150 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={pathD}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <span
        className={`text-xs font-semibold ${
          isNegative
            ? 'text-[#B04C4C]'
            : isSteady
            ? 'text-[#768478]'
            : 'text-[#2D5A3F]'
        }`}
      >
        {change}
      </span>
    </div>
  );
};

interface DimensionSignal {
  signal: string;
  current: string;
  target: string;
  contribution: number;
  source: string;
}

interface BenchmarkItem {
  category: string;
  percentile: number;
  medianPercent: number;
  yourPercent: number;
}

interface FullRecommendationItem {
  pts: string;
  title: string;
  description: string;
  effort: string;
  dimension: string;
}

export default function HealthScorePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Recommendations');
  const [selectedDimension, setSelectedDimension] = useState('Product');
  const [trendRange, setTrendRange] = useState('90d');

  const tabs = [
    'Overview',
    'Dimensions',
    'Trend history',
    'Benchmarks',
    'Recommendations',
  ];

  const dimensionPills = [
    { name: 'Product', score: 78 },
    { name: 'Market', score: 74 },
    { name: 'Financial', score: 58 },
    { name: 'Legal', score: 66 },
    { name: 'Team', score: 80 },
  ];

  const dimensionData: Record<string, DimensionSignal[]> = {
    Product: [
      {
        signal: 'MVP progress',
        current: '40% built',
        target: 'Working prototype',
        contribution: 6,
        source: 'Roadmap',
      },
      {
        signal: 'User feedback logged',
        current: '18 notes',
        target: '≥ 10',
        contribution: 4,
        source: 'Validation',
      },
      {
        signal: 'Feature focus',
        current: 'Narrow',
        target: 'Narrow',
        contribution: 3,
        source: 'Business Builder',
      },
    ],
    Market: [
      {
        signal: 'Assumptions validated',
        current: '3 of 7',
        target: '≥ 3',
        contribution: 5,
        source: 'Validation',
      },
      {
        signal: 'Segment clarity',
        current: 'Defined',
        target: 'Defined',
        contribution: 4,
        source: 'Business Builder',
      },
      {
        signal: 'Competitive map',
        current: 'Complete',
        target: 'Complete',
        contribution: 2,
        source: 'Business Builder',
      },
    ],
    Financial: [
      {
        signal: 'Runway',
        current: '8.4 months',
        target: '≥ 9 months',
        contribution: -3,
        source: 'Finance',
      },
      {
        signal: 'Revenue growth',
        current: 'Flat',
        target: '+10% / mo',
        contribution: -4,
        source: 'Finance',
      },
      {
        signal: 'Budget set',
        current: 'Yes',
        target: 'Yes',
        contribution: 2,
        source: 'Finance',
      },
      {
        signal: 'Burn discipline',
        current: 'On plan',
        target: 'On plan',
        contribution: 2,
        source: 'Finance',
      },
    ],
    Legal: [
      {
        signal: 'Entity formed',
        current: 'In progress',
        target: 'Formed',
        contribution: -2,
        source: 'Legal',
      },
      {
        signal: 'Founder agreements',
        current: 'Signed',
        target: 'Signed',
        contribution: 4,
        source: 'Legal',
      },
      {
        signal: 'IP assignment',
        current: 'Pending',
        target: 'Complete',
        contribution: -1,
        source: 'Legal',
      },
    ],
    Team: [
      {
        signal: 'Active members',
        current: '4',
        target: '≥ 2',
        contribution: 5,
        source: 'Team',
      },
      {
        signal: 'Advisors engaged',
        current: '2',
        target: '≥ 1',
        contribution: 3,
        source: 'Team',
      },
      {
        signal: 'Weekly activity',
        current: 'High',
        target: 'Steady',
        contribution: 2,
        source: 'Team',
      },
    ],
  };

  const benchmarkData: BenchmarkItem[] = [
    { category: 'Overall', percentile: 68, medianPercent: 53, yourPercent: 68 },
    { category: 'Product', percentile: 74, medianPercent: 56, yourPercent: 74 },
    { category: 'Market', percentile: 66, medianPercent: 58, yourPercent: 66 },
    { category: 'Financial', percentile: 41, medianPercent: 60, yourPercent: 56 },
    { category: 'Team', percentile: 80, medianPercent: 55, yourPercent: 80 },
  ];

  const fullRecommendationsList: FullRecommendationItem[] = [
    {
      pts: '+5 pts',
      title: 'Extend runway past 9 months',
      description:
        'Model a small price increase and trim your two largest variable costs. Both lift financials fast.',
      effort: 'Medium',
      dimension: 'Financial',
    },
    {
      pts: '+4 pts',
      title: 'Show revenue momentum',
      description:
        'Close two pilot deals this month to move revenue growth off flat.',
      effort: 'High',
      dimension: 'Financial',
    },
    {
      pts: '+3 pts',
      title: 'Finish entity formation',
      description:
        'Complete the last two incorporation steps to remove the legal drag.',
      effort: 'Low',
      dimension: 'Legal',
    },
    {
      pts: '+3 pts',
      title: 'Validate two more assumptions',
      description:
        'Run a survey and three interviews to lift market evidence.',
      effort: 'Medium',
      dimension: 'Market',
    },
    {
      pts: '+2 pts',
      title: 'Complete IP assignment',
      description:
        'Get founders and contractors to sign IP assignment agreements.',
      effort: 'Low',
      dimension: 'Legal',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] text-[#1E2923]">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Header & Navigation Wrapper */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5]">
          {/* Main Top Navbar */}
          <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-card">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
                aria-label="Open sidebar"
              >
                C
              </button>

              <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                <span className="text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="text-[#1E2923] font-bold truncate">
                  Health Score
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-[#E6EFEA] text-[#183B28] px-3.5 py-1.5 rounded-full text-xs font-medium">
                <span className="text-[#556358]">Health</span>
                <span className="font-bold text-sm">72</span>
                <span className="text-[10px] text-[#2D5A3F]">↑</span>
              </div>

              <button className="relative p-2.5 bg-[#F5F5F0] hover:bg-[#EBEBE6] rounded-full transition-colors text-[#1E2923]">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors shadow-card">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Invite</span>
              </button>
            </div>
          </header>

          {/* Sticky Tab Navigation Bar */}
          <div className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#EAD5C6] text-[#1E2923] font-semibold'
                        : 'bg-transparent text-[#617065] hover:bg-[#EBEBE6]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-4 bg-[#0F2218] rounded-[24px] p-8 flex flex-col items-center justify-between text-center min-h-[320px] shadow-card">
                  <div className="relative w-44 h-44 flex items-center justify-center my-auto">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#193B28"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#2D7A50"
                        strokeWidth="8"
                        strokeDasharray="263.89"
                        strokeDashoffset="73.88"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-5xl font-display font-bold text-white tracking-tight">
                        72
                      </span>
                      <span className="text-xs text-[#8BA193] mt-0.5">
                        of 100
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 mt-2">
                    <span className="bg-[#EAF2ED] text-[#183B28] px-3.5 py-1 rounded-full text-xs font-bold">
                      +4 this week
                    </span>
                    <button className="text-xs text-[#D89A6E] hover:underline font-medium mt-1">
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
                    You&apos;re strong for validation stage. Team is carrying you;
                    financials are holding you back.
                  </h2>

                  <p className="text-xs md:text-sm text-[#617065] mt-4 leading-relaxed font-normal">
                    The fastest points are in financials right now. Extending
                    runway and showing revenue momentum would lift your score
                    most.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard
                  title="Product"
                  score={78}
                  change="+2 this week"
                />
                <MetricCard
                  title="Market"
                  score={74}
                  change="+1 this week"
                />
                <MetricCard
                  title="Financial"
                  score={58}
                  change="-2 this week"
                  isNegative
                />
                <MetricCard
                  title="Legal"
                  score={66}
                  change="steady"
                  isSteady
                />
                <MetricCard
                  title="Team"
                  score={80}
                  change="+3 this week"
                />
              </div>

              <div className="flex flex-col gap-5 pt-2 pb-12">
                <h2 className="text-2xl font-display font-semibold text-[#1E2923] tracking-tight">
                  Top 3 fastest ways to raise your score
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {fullRecommendationsList.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6"
                    >
                      <div className="flex flex-col items-start gap-3">
                        <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-semibold px-3 py-1 rounded-full">
                          {item.pts} est.
                        </span>
                        <h3 className="text-base font-bold text-[#1E2923] leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#617065] leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <button className="w-full bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold py-3 rounded-card transition-colors shadow-card">
                        Do it
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* DIMENSIONS TAB */}
          {activeTab === 'Dimensions' && (
            <div className="flex flex-col gap-8 pt-2 pb-12">
              {/* Dimension Switcher Pills */}
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                {dimensionPills.map((dim) => {
                  const isSelected = selectedDimension === dim.name;
                  return (
                    <button
                      key={dim.name}
                      onClick={() => setSelectedDimension(dim.name)}
                      className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#183B28] border-[#183B28] text-white font-semibold'
                          : 'bg-white border-[#EBEBE6] text-[#1E2923] hover:border-[#C5CFC7]'
                      }`}
                    >
                      {dim.name} · {dim.score}
                    </button>
                  );
                })}
              </div>

              {/* Title Section */}
              <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
                What&apos;s driving {selectedDimension}
              </h2>

              {/* Signals Breakdown Table */}
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
                      {(dimensionData[selectedDimension] || []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="py-4 px-6 font-bold text-[#1E2923]">
                            {row.signal}
                          </td>
                          <td className="py-4 px-6 text-[#556358]">{row.current}</td>
                          <td className="py-4 px-6 text-[#556358]">{row.target}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`font-bold ${
                                row.contribution < 0
                                  ? 'text-[#B04C4C]'
                                  : 'text-[#2D5A3F]'
                              }`}
                            >
                              {row.contribution > 0
                                ? `+${row.contribution}`
                                : row.contribution}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-[#183B28]">
                            {row.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TREND HISTORY TAB */}
          {activeTab === 'Trend history' && (
            <div className="flex flex-col gap-6 pt-2 pb-12">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
                  Score over time
                </h2>

                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
                  {['30d', '90d', '1y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTrendRange(range)}
                      className={`px-3.5 py-1.5 rounded-input text-xs font-medium transition-all ${
                        trendRange === range
                          ? 'bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card'
                          : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score Chart Card */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col justify-between min-h-[420px]">
                <div className="relative w-full h-64 mt-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-[#F0F0EC] w-full h-0"></div>
                    <div className="border-b border-[#F0F0EC] w-full h-0"></div>
                    <div className="border-b border-[#F0F0EC] w-full h-0"></div>
                  </div>

                  {/* SVG Chart & Annotations Container */}
                  <div className="relative w-full h-full">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 1000 240"
                      preserveAspectRatio="none"
                    >
                      {/* Trend Line */}
                      <path
                        d="M 0 190 Q 250 175 500 140 T 1000 60"
                        fill="none"
                        stroke="#2D5A3F"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Point 1: Business plan generated */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: '33%', top: '63%', transform: 'translate(-50%, -50%)' }}
                    >
                      <span className="text-[11px] font-bold text-[#9C5B34] whitespace-nowrap mb-1">
                        Business plan generated
                      </span>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#9C5B34] border-2 border-white shadow-card"></div>
                    </div>

                    {/* Point 2: Smoke test passed */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: '68%', top: '42%', transform: 'translate(-50%, -50%)' }}
                    >
                      <span className="text-[11px] font-bold text-[#9C5B34] whitespace-nowrap mb-1">
                        Smoke test passed
                      </span>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#9C5B34] border-2 border-white shadow-card"></div>
                    </div>
                  </div>
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between items-center text-xs font-medium text-[#768478] pt-6 border-t border-transparent">
                  <span>12 weeks ago</span>
                  <span>Today · 72</span>
                </div>
              </div>
            </div>
          )}

          {/* BENCHMARKS TAB */}
          {activeTab === 'Benchmarks' && (
            <div className="flex flex-col gap-6 pt-2 pb-12">
              <div>
                <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
                  How you compare
                </h2>
                <p className="text-xs text-[#617065] mt-1.5">
                  Against anonymized fintech startups at the validation stage.
                </p>
              </div>

              {/* Benchmarks Card */}
              <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col gap-8">
                <div className="flex flex-col gap-7">
                  {benchmarkData.map((item) => (
                    <div key={item.category} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1E2923]">
                          {item.category}
                        </span>
                        <span className="font-bold text-[#1E2923]">
                          {item.percentile}th percentile
                        </span>
                      </div>

                      {/* Percentile Track */}
                      <div className="relative w-full h-3.5 bg-[#EAEFEA] rounded-full overflow-visible">
                        {/* Median Range Gray Bar */}
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-[#B8C4BB] rounded-full"
                          style={{ width: `${item.medianPercent}%` }}
                        ></div>

                        {/* Your Position Indicator Line */}
                        <div
                          className="absolute top-[-3px] bottom-[-3px] w-[3.5px] bg-[#2D5A3F] rounded-full z-10"
                          style={{ left: `${item.yourPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 pt-2 text-xs font-medium text-[#617065]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#B8C4BB] rounded-[2px]"></span>
                    <span>Cohort median</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#2D5A3F] rounded-xs"></span>
                    <span>You</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] italic text-[#8E9B90]">
                Benchmarks are anonymized and aggregated. No startup&apos;s individual data is ever visible.
              </p>
            </div>
          )}

          {/* RECOMMENDATIONS TAB */}
          {activeTab === 'Recommendations' && (
            <div className="flex flex-col gap-6 pt-2 pb-12">
              <div>
                <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
                  Recommendations
                </h2>
                <p className="text-xs text-[#617065] mt-1.5">
                  Ranked by estimated lift. Every one traces to a real signal.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {fullRecommendationsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
                        {item.pts}
                      </span>

                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-base font-bold text-[#1E2923] leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#617065] leading-relaxed">
                          {item.description}
                        </p>
                        <div className="text-[11px] text-[#768478] mt-1 font-medium">
                          Effort: {item.effort} · Dimension: {item.dimension}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center md:flex-col gap-2 shrink-0 justify-end md:justify-center">
                      <button className="w-24 bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold py-2.5 rounded-card transition-colors shadow-card">
                        Start
                      </button>
                      <button className="w-24 bg-white hover:bg-[#F5F5F0] text-[#1E2923] border border-[#EBEBE6] text-xs font-bold py-2.5 rounded-card transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}