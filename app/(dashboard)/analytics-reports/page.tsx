'use client';

import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, Loader2, Download, ArrowDownUp, Sparkles } from 'lucide-react';
import { ShellTopBar } from '@/components/shell-top-bar';

type AnalyticsSubTab = 'Overview' | 'By hub' | 'Benchmarks' | 'Reports' | 'Export';
type TimeRange = '30 days' | '90 days' | '12 months';

export default function OverviewAnalyticsPage(): React.JSX.Element {
  const [subTab, setSubTab] = useState<AnalyticsSubTab>('Reports');
  const [timeRange, setTimeRange] = useState<TimeRange>('90 days');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for toggles in the Reports view
  const [weeklySummary, setWeeklySummary] = useState<boolean>(true);
  const [monthlyPerformance, setMonthlyPerformance] = useState<boolean>(true);
  const [investorUpdateDraft, setInvestorUpdateDraft] = useState<boolean>(false);

  // State for building a report loading state & notification
  const [isBuildingReport, setIsBuildingReport] = useState<boolean>(false);

  // Export specific state filters & logs
  const [exportFormat, setExportFormat] = useState<'CSV' | 'XLSX' | 'JSON'>('CSV');
  const [exportDataset, setExportDataset] = useState<'All Tables' | 'Revenue & Burn' | 'Savers & Growth' | 'Hub Metrics'>('All Tables');
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // By Hub state sub-filter
  const [hubFilter, setHubFilter] = useState<'All' | 'Marketing' | 'Sales' | 'Finance' | 'Validation'>('All');

  // Benchmarks sort state
  const [benchmarkSort, setBenchmarkSort] = useState<'percentile' | 'name'>('percentile');

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBuildReport = () => {
    setIsBuildingReport(true);
    setTimeout(() => {
      setIsBuildingReport(false);
      showToast('Report successfully compiled and ready for download.');
    }, 3000);
  };

  const handleRunExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast(`Successfully downloaded ${exportDataset} (${exportFormat}).`);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">
      
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-brand-x1e4231">
          <span className="w-4 h-4 rounded-full bg-brand-x1c4230 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <ShellTopBar title="Analytics &amp; Reports" />

      {/* Sub-Nav and Time Filters Bar */}
      <nav className="w-full bg-surface-subtle border-b border-line px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {(['Overview', 'By hub', 'Benchmarks', 'Reports', 'Export'] as AnalyticsSubTab[]).map((tab) => {
            const isActive = subTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setSubTab(tab);
                  showToast(`Switched to ${tab} tab.`);
                }}
                className={
                  isActive
                    ? "px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-xe2d4bc text-ink shadow-card transition-colors shrink-0"
                    : "px-4 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors shrink-0"
                }
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-1.5 bg-transparent p-1 shrink-0">
          {(['30 days', '90 days', '12 months'] as TimeRange[]).map((range) => {
            const isRangeActive = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  showToast(`Time range updated to ${range}.`);
                }}
                className={
                  isRangeActive
                    ? "px-3.5 py-1.5 rounded-modal text-xs font-semibold bg-brand-x11291e text-white shadow-card transition-colors border border-brand-x11291e"
                    : "px-3.5 py-1.5 rounded-modal text-xs font-medium text-ink-muted bg-white hover:bg-neutral-50 border border-line transition-colors"
                }
              >
                {range}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* ================================= OVERVIEW TAB ================================= */}
        {subTab === 'Overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">The numbers that matter</h1>
                <p className="text-xs text-ink-muted">Last {timeRange} · every figure traces back to its source.</p>
              </div>
              <button
                onClick={() => showToast('Overview report successfully exported to PDF.')}
                className="bg-accent-gold hover:bg-accent-xa38346 text-white px-4 py-2 rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px] flex items-center space-x-1.5"
              >
                <Download size={14} />
                <span>Export report</span>
              </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Monthly Revenue</span>
                  <div className="text-2xl font-display font-bold text-ink">₦1.6M</div>
                  <div className="text-xs text-ink-muted">
                    <span className="text-brand-strong font-semibold">+18%</span> vs last period
                  </div>
                </div>
                <div className="flex items-end space-x-1 h-6 pt-2">
                  {[40, 45, 50, 55, 60, 65, 75, 90].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-brand-xa5c3b3 rounded-t-xs" />
                  ))}
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Active Savers</span>
                  <div className="text-2xl font-display font-bold text-ink">1,240</div>
                  <div className="text-xs text-ink-muted">
                    <span className="text-brand-strong font-semibold">+164</span> net new
                  </div>
                </div>
                <div className="flex items-end space-x-1 h-6 pt-2">
                  {[30, 40, 45, 50, 58, 65, 78, 88].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-brand-xa5c3b3 rounded-t-xs" />
                  ))}
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Net Burn</span>
                  <div className="text-2xl font-display font-bold text-ink">₦4.9M</div>
                  <div className="text-xs text-ink-muted">
                    <span className="text-accent-xc05621 font-semibold">+3%</span> vs last period
                  </div>
                </div>
                <div className="flex items-end space-x-1 h-6 pt-2">
                  {[70, 70, 70, 70, 70, 70, 70, 70].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-accent-xe2d4bc rounded-t-xs" />
                  ))}
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">Runway</span>
                  <div className="text-2xl font-display font-bold text-ink">8.4 mo</div>
                  <div className="text-xs text-ink-muted">
                    <span className="text-accent-xc05621 font-semibold">-0.6</span> vs last period
                  </div>
                </div>
                <div className="flex items-end space-x-1 h-6 pt-2">
                  {[85, 85, 80, 80, 75, 75, 70, 70].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-accent-xe2d4bc rounded-t-xs" />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-ink">Revenue and active savers growth</h3>
                  <span className="text-xs text-ink-subtle">{timeRange} view</span>
                </div>
                <div className="h-56 relative flex items-end justify-between px-2 pt-6 pb-2 border-b border-neutral-xf2f2ec">
                  {[
                    { month: 'Feb', height: '35%' },
                    { month: 'Mar', height: '45%' },
                    { month: 'Apr', height: '55%' },
                    { month: 'May', height: '65%' },
                    { month: 'Jun', height: '75%' },
                    { month: 'Jul', height: '90%' },
                  ].map((item, idx) => (
                    <div key={idx} className="z-10 flex flex-col items-center flex-1 h-full justify-end group">
                      <div style={{ height: item.height }} className="w-10 bg-brand-x2d6a4f rounded-t-sm transition-all hover:bg-brand-x1b4332" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between px-2 text-xs text-ink-subtle font-medium">
                  <span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                </div>
              </div>

              <div className="bg-brand-x11291e border border-brand-x1a382a rounded-[24px] p-6 shadow-card flex flex-col justify-between space-y-6 text-white">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-accent-gold" />
                  <h3 className="font-semibold text-sm text-white tracking-wide">What the data says</h3>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="bg-brand-x163326 border border-brand-x214d38 p-3.5 rounded-modal space-y-1">
                    <div className="text-[10px] font-bold text-neutral-xa3b2a8 tracking-wider uppercase">Working</div>
                    <p className="text-white font-medium leading-relaxed">Referral is carrying growth. It brought 61% of new savers.</p>
                  </div>
                  <div className="bg-brand-x163326 border border-brand-x214d38 p-3.5 rounded-modal space-y-1">
                    <div className="text-[10px] font-bold text-accent-xe2d4bc tracking-wider uppercase">Watch</div>
                    <p className="text-white font-medium leading-relaxed">Burn crept up 3% while revenue grew 18%.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================= BY HUB TAB ================================= */}
        {subTab === 'By hub' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Performance by hub</h1>
                <p className="text-xs text-ink-muted">Granular operational telemetry across individual workspace hubs.</p>
              </div>

              {/* Hub Sub-filter pills */}
              <div className="flex items-center space-x-1.5 bg-white border border-line p-1 rounded-modal shadow-card">
                {(['All', 'Marketing', 'Sales', 'Finance', 'Validation'] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setHubFilter(h);
                      showToast(`Filtered by ${h} hub.`);
                    }}
                    className={`px-3 py-1 rounded-card text-xs font-semibold transition-colors ${hubFilter === h ? 'bg-brand-strong text-white' : 'text-ink-muted hover:bg-neutral-100'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(hubFilter === 'All' || hubFilter === 'Marketing') && (
                <div className="bg-white border border-line rounded-[24px] p-6 shadow-card flex flex-col justify-between space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-card bg-brand-tint flex items-center justify-center text-brand-strong">
                        <Clock size={16} />
                      </div>
                      <h3 className="font-semibold text-sm text-ink">Marketing Hub</h3>
                    </div>
                    <button onClick={() => showToast('Navigating to Marketing Hub...')} className="text-xs font-semibold text-ink hover:text-accent-gold flex items-center space-x-1">
                      <span>Open</span><span>→</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Reach</div>
                      <div className="text-lg font-display font-bold text-ink">4.2K</div>
                      <div className="text-xs text-brand-strong font-semibold">+12%</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">CAC</div>
                      <div className="text-lg font-display font-bold text-ink">₦240</div>
                      <div className="text-xs text-brand-strong font-semibold">-8%</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Conv.</div>
                      <div className="text-lg font-display font-bold text-ink">9.1%</div>
                      <div className="text-xs text-brand-strong font-semibold">+0.6</div>
                    </div>
                  </div>
                </div>
              )}

              {(hubFilter === 'All' || hubFilter === 'Sales') && (
                <div className="bg-white border border-line rounded-[24px] p-6 shadow-card flex flex-col justify-between space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-card bg-brand-tint flex items-center justify-center text-brand-strong">
                        <ArrowUpRight size={16} />
                      </div>
                      <h3 className="font-semibold text-sm text-ink">Sales Hub</h3>
                    </div>
                    <button onClick={() => showToast('Navigating to Sales Hub...')} className="text-xs font-semibold text-ink hover:text-accent-gold flex items-center space-x-1">
                      <span>Open</span><span>→</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Pipeline</div>
                      <div className="text-lg font-display font-bold text-ink">₦42M</div>
                      <div className="text-xs text-brand-strong font-semibold">+₦6M</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Win Rate</div>
                      <div className="text-lg font-display font-bold text-ink">31%</div>
                      <div className="text-xs text-brand-strong font-semibold">+3</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Cycle</div>
                      <div className="text-lg font-display font-bold text-ink">34d</div>
                      <div className="text-xs text-brand-strong font-semibold">+4d</div>
                    </div>
                  </div>
                </div>
              )}

              {(hubFilter === 'All' || hubFilter === 'Finance') && (
                <div className="bg-white border border-line rounded-[24px] p-6 shadow-card flex flex-col justify-between space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-card bg-brand-tint flex items-center justify-center text-brand-strong">
                        <span className="font-bold text-xs">₦</span>
                      </div>
                      <h3 className="font-semibold text-sm text-ink">Finance Hub</h3>
                    </div>
                    <button onClick={() => showToast('Navigating to Finance Hub...')} className="text-xs font-semibold text-ink hover:text-accent-gold flex items-center space-x-1">
                      <span>Open</span><span>→</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Revenue</div>
                      <div className="text-lg font-display font-bold text-ink">₦1.6M</div>
                      <div className="text-xs text-brand-strong font-semibold">+18%</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Burn</div>
                      <div className="text-lg font-display font-bold text-ink">₦4.9M</div>
                      <div className="text-xs text-accent-xc05621 font-semibold">+3%</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Runway</div>
                      <div className="text-lg font-display font-bold text-ink">8.4mo</div>
                      <div className="text-xs text-accent-xc05621 font-semibold">-0.6</div>
                    </div>
                  </div>
                </div>
              )}

              {(hubFilter === 'All' || hubFilter === 'Validation') && (
                <div className="bg-white border border-line rounded-[24px] p-6 shadow-card flex flex-col justify-between space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-card bg-brand-tint flex items-center justify-center text-brand-strong">
                        <CheckCircle2 size={16} />
                      </div>
                      <h3 className="font-semibold text-sm text-ink">Validation Hub</h3>
                    </div>
                    <button onClick={() => showToast('Navigating to Validation Hub...')} className="text-xs font-semibold text-ink hover:text-accent-gold flex items-center space-x-1">
                      <span>Open</span><span>→</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Interviews</div>
                      <div className="text-lg font-display font-bold text-ink">23</div>
                      <div className="text-xs text-brand-strong font-semibold">+9</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Assumptions</div>
                      <div className="text-lg font-display font-bold text-ink">6/11</div>
                      <div className="text-xs text-brand-strong font-semibold">+2</div>
                    </div>
                    <div className="bg-neutral-xf9f9f7 border border-neutral-xefefee rounded-modal p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-ink-subtle uppercase">Experiments</div>
                      <div className="text-lg font-display font-bold text-ink">3</div>
                      <div className="text-xs text-ink-muted font-normal">running</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================= BENCHMARKS TAB ================================= */}
        {subTab === 'Benchmarks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">How you compare</h1>
                <p className="text-xs text-ink-muted">Against anonymized pre-seed fintech companies in West Africa. 47 companies in this cohort.</p>
              </div>
              <button
                onClick={() => {
                  setBenchmarkSort(benchmarkSort === 'percentile' ? 'name' : 'percentile');
                  showToast(`Sorted benchmarks by ${benchmarkSort === 'percentile' ? 'metric name' : 'percentile'}.`);
                }}
                className="bg-white border border-line text-ink hover:bg-neutral-50 px-3.5 py-2 rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px] w-fit"
              >
                <ArrowDownUp size={14} />
                <span>Sort: {benchmarkSort === 'percentile' ? 'Percentile' : 'Name'}</span>
              </button>
            </div>

            <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold text-ink-subtle uppercase tracking-wider bg-neutral-xfaf9f6">
                    <th className="py-3.5 px-6">Metric</th>
                    <th className="py-3.5 px-6">You</th>
                    <th className="py-3.5 px-6">Cohort spread</th>
                    <th className="py-3.5 px-6 text-right">Percentile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-xefefee text-xs text-ink">
                  <tr className="hover:bg-neutral-xfcfcfb transition-colors">
                    <td className="py-4 px-6 font-semibold text-ink-strong">MoM revenue growth</td>
                    <td className="py-4 px-6 font-medium text-ink">18%</td>
                    <td className="py-4 px-6 w-1/2">
                      <div className="relative flex items-center">
                        <div className="w-full bg-neutral-xeaeaea h-2 rounded-full overflow-hidden flex"><div className="w-[60%] bg-neutral-xd6d6d0" /></div>
                        <div className="absolute left-[65%] w-3 h-3 bg-brand-x1b4332 rounded-full border-2 border-white shadow-card" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right"><span className="inline-block bg-brand-tint text-brand-strong font-bold px-2.5 py-1 rounded-card text-xs">78th</span></td>
                  </tr>
                  <tr className="hover:bg-neutral-xfcfcfb transition-colors">
                    <td className="py-4 px-6 font-semibold text-ink-strong">30-day retention</td>
                    <td className="py-4 px-6 font-medium text-ink">62%</td>
                    <td className="py-4 px-6 w-1/2">
                      <div className="relative flex items-center">
                        <div className="w-full bg-neutral-xeaeaea h-2 rounded-full overflow-hidden flex"><div className="w-[75%] bg-neutral-xd6d6d0" /></div>
                        <div className="absolute left-[80%] w-3 h-3 bg-brand-x1b4332 rounded-full border-2 border-white shadow-card" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right"><span className="inline-block bg-brand-tint text-brand-strong font-bold px-2.5 py-1 rounded-card text-xs">91st</span></td>
                  </tr>
                  <tr className="hover:bg-neutral-xfcfcfb transition-colors">
                    <td className="py-4 px-6 font-semibold text-ink-strong">Customer Acquisition Cost (CAC)</td>
                    <td className="py-4 px-6 font-medium text-ink">₦240</td>
                    <td className="py-4 px-6 w-1/2">
                      <div className="relative flex items-center">
                        <div className="w-full bg-neutral-xeaeaea h-2 rounded-full overflow-hidden flex"><div className="w-[50%] bg-neutral-xd6d6d0" /></div>
                        <div className="absolute left-[58%] w-3 h-3 bg-brand-x1b4332 rounded-full border-2 border-white shadow-card" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right"><span className="inline-block bg-brand-tint text-brand-strong font-bold px-2.5 py-1 rounded-card text-xs">74th</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================= REPORTS TAB ================================= */}
        {subTab === 'Reports' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header & Build Button */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Reports</h1>
              <button
                onClick={handleBuildReport}
                disabled={isBuildingReport}
                className="bg-accent-gold hover:bg-accent-xa38346 text-white px-4 py-2 rounded-modal text-xs font-semibold shadow-card transition-colors h-[36px] flex items-center space-x-1.5 cursor-pointer disabled:opacity-70"
              >
                <span>✦</span>
                <span>Build a report</span>
              </button>
            </div>

            {/* Loading State Container */}
            {isBuildingReport && (
              <div className="bg-white border border-line rounded-[24px] p-16 shadow-card flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
                <p className="text-sm font-medium text-ink">Compiling your report...</p>
              </div>
            )}

            {/* Reports List Cards */}
            <div className="space-y-4">
              
              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-modal bg-danger-tint text-danger-xc53030 flex items-center justify-center font-bold text-xs">PDF</div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-ink">July monthly performance</h3>
                    <p className="text-xs text-ink-subtle">Generated Jul 26 · 8 pages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="bg-neutral-xfaf3ec text-accent-gold px-2.5 py-1 rounded-full text-[11px] font-semibold">Scheduled</span>
                  <button onClick={() => showToast('Downloading July monthly performance.')} className="text-xs font-semibold text-ink hover:text-accent-gold">Download</button>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-modal bg-danger-tint text-danger-xc53030 flex items-center justify-center font-bold text-xs">PDF</div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-ink">Investor update pack, July</h3>
                    <p className="text-xs text-ink-subtle">Generated Jul 24 · metrics and narrative</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={() => showToast('Downloading Investor update pack, July.')} className="text-xs font-semibold text-ink hover:text-accent-gold">Download</button>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-modal bg-danger-tint text-danger-xc53030 flex items-center justify-center font-bold text-xs">PDF</div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-ink">Q2 board summary</h3>
                    <p className="text-xs text-ink-subtle">Generated Jul 2 · 12 pages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={() => showToast('Downloading Q2 board summary.')} className="text-xs font-semibold text-ink hover:text-accent-gold">Download</button>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[24px] p-5 shadow-card flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-modal bg-brand-tint text-brand-x2d6a4f flex items-center justify-center font-bold text-xs">XLS</div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-ink">Full metrics export, H1</h3>
                    <p className="text-xs text-ink-subtle">Generated Jul 1 · all hubs</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="bg-neutral-xfaf3ec text-accent-gold px-2.5 py-1 rounded-full text-[11px] font-semibold">Scheduled</span>
                  <button onClick={() => showToast('Downloading Full metrics export, H1.')} className="text-xs font-semibold text-ink hover:text-accent-gold">Download</button>
                </div>
              </div>

            </div>

            {/* Scheduled delivery Section */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              <h3 className="font-semibold text-sm text-ink">Scheduled delivery</h3>

              <div className="divide-y divide-neutral-xefefee">
                <div className="py-4 flex items-center justify-between first:pt-0">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs text-ink">Weekly summary</h4>
                    <p className="text-xs text-ink-subtle">Every Monday at 7:00 AM, to you.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setWeeklySummary(!weeklySummary);
                      showToast(`Weekly summary delivery ${!weeklySummary ? 'enabled' : 'disabled'}.`);
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${weeklySummary ? 'bg-brand-strong' : 'bg-neutral-xd1d1cb'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${weeklySummary ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs text-ink">Monthly performance report</h4>
                    <p className="text-xs text-ink-subtle">First of the month, to you and Daniel.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setMonthlyPerformance(!monthlyPerformance);
                      showToast(`Monthly performance delivery ${!monthlyPerformance ? 'enabled' : 'disabled'}.`);
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${monthlyPerformance ? 'bg-brand-strong' : 'bg-neutral-xd1d1cb'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${monthlyPerformance ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="py-4 flex items-center justify-between last:pb-0">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs text-ink">Investor update draft</h4>
                    <p className="text-xs text-ink-subtle">Monthly draft prepared for your review.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setInvestorUpdateDraft(!investorUpdateDraft);
                      showToast(`Investor update draft delivery ${!investorUpdateDraft ? 'enabled' : 'disabled'}.`);
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${investorUpdateDraft ? 'bg-brand-strong' : 'bg-neutral-xd1d1cb'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${investorUpdateDraft ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================= EXPORT TAB ================================= */}
        {subTab === 'Export' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Export data</h1>
              <p className="text-xs text-ink-muted">Download raw data tables, granular metric histories, and custom workspace records.</p>
            </div>

            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              <h3 className="font-semibold text-sm text-ink">Select dataset & format</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dataset Source */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Dataset source</label>
                  <div className="space-y-2">
                    {(['All Tables', 'Revenue & Burn', 'Savers & Growth', 'Hub Metrics'] as const).map((dataset) => (
                      <div 
                        key={dataset}
                        onClick={() => {
                          setExportDataset(dataset);
                          showToast(`Selected dataset: ${dataset}`);
                        }}
                        className={`p-3.5 rounded-modal border flex items-center justify-between cursor-pointer transition-all ${exportDataset === dataset ? 'border-brand-strong bg-brand-tint/40 text-brand-strong font-semibold' : 'border-line text-ink hover:bg-neutral-50'}`}
                      >
                        <span className="text-xs">{dataset}</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${exportDataset === dataset ? 'border-brand-strong bg-brand-strong text-white text-[10px]' : 'border-neutral-xd1d1cb'}`}>
                          {exportDataset === dataset ? '✓' : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-ink-muted">Include workspace metadata header</span>
                    <button 
                      onClick={() => setIncludeMetadata(!includeMetadata)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${includeMetadata ? 'bg-brand-strong' : 'bg-neutral-xd1d1cb'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${includeMetadata ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* File Format Options & Action */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">File Format</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['CSV', 'XLSX', 'JSON'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => {
                            setExportFormat(fmt);
                            showToast(`Selected format: ${fmt}`);
                          }}
                          className={`py-4 rounded-modal border text-xs font-semibold flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${exportFormat === fmt ? 'border-brand-strong bg-brand-strong text-white shadow-card' : 'border-line bg-white text-ink hover:bg-neutral-50'}`}
                        >
                          <Download size={16} />
                          <span>{fmt}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleRunExport}
                      disabled={isExporting}
                      className="w-full bg-brand-strong hover:bg-brand-x122b1d text-white py-3.5 rounded-modal text-xs font-semibold transition-colors shadow-card flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Generating package...</span>
                        </>
                      ) : (
                        <>
                          <Download size={15} />
                          <span>Generate and download {exportFormat}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}