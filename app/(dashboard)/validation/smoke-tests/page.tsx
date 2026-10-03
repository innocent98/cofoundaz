'use client';

import React, { useState, useCallback } from 'react';
import { Plus, ArrowRight, ChevronRight, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useSmokeTests, SmokeTest, SmokeTestStats } from '@/hooks/useSmokeTests';
import { useToast } from '../layout';

const STATUS_LABEL: Record<string, string> = { draft: 'Draft', live: 'Live', ended: 'Ended' };

export default function SmokeTestsPage() {
  const { tests, loading, error, refetch, create, updateMetrics, getStats, errMsg } = useSmokeTests();
  const { triggerToast } = useToast();

  const [viewState, setViewState] = useState<'list' | 'builder' | 'results'>('list');
  const [selected, setSelected] = useState<SmokeTest | null>(null);

  // Results state
  const [stats, setStats] = useState<SmokeTestStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [visitsInput, setVisitsInput] = useState('');
  const [signupsInput, setSignupsInput] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('Get Early Access');
  const [requireEmail, setRequireEmail] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [postSignupMsg, setPostSignupMsg] = useState("You're on the list, we'll be in touch soon.");
  const [metricType, setMetricType] = useState('email_signup');
  const [targetConversion, setTargetConversion] = useState('5');
  const [slug, setSlug] = useState('');
  const [publishing, setPublishing] = useState(false);

  const resetWizard = () => {
    setWizardStep(1);
    setHeadline('');
    setSubheadline('');
    setCta('Get Early Access');
    setRequireEmail(true);
    setShowPricing(false);
    setPostSignupMsg("You're on the list, we'll be in touch soon.");
    setMetricType('email_signup');
    setTargetConversion('5');
    setSlug('');
  };

  const openResults = useCallback(
    async (test: SmokeTest) => {
      setSelected(test);
      setStats(null);
      setVisitsInput(String(test.visits));
      setSignupsInput(String(test.signups));
      setViewState('results');
      setStatsLoading(true);
      try {
        setStats(await getStats(test.id));
      } catch {
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    },
    [getStats]
  );

  const handlePublish = () => {
    if (publishing) return;
    const name = headline.trim() || slug.trim();
    if (!name) {
      triggerToast('Add a headline (or slug) to name this test.');
      return;
    }
    setPublishing(true);
    create({
      name,
      config: {
        headline: headline.trim(),
        subheadline: subheadline.trim(),
        cta_text: cta.trim(),
        require_email: requireEmail,
        show_pricing: showPricing,
        post_signup_message: postSignupMsg.trim(),
        metric_type: metricType,
        target_conversion: Number(targetConversion) || 0,
        slug: slug.trim(),
      },
      metrics: { visits: 0, signups: 0 },
    })
      .then(() => {
        triggerToast('Smoke test created. Record visits & signups as they come in.');
        resetWizard();
        setViewState('list');
      })
      .catch((e) => triggerToast(errMsg(e)))
      .finally(() => setPublishing(false));
  };

  const handleSaveMetrics = () => {
    if (!selected || savingMetrics) return;
    const v = Math.max(0, Math.floor(Number(visitsInput) || 0));
    const sgn = Math.max(0, Math.floor(Number(signupsInput) || 0));
    setSavingMetrics(true);
    updateMetrics(selected.id, v, sgn)
      .then(async () => {
        triggerToast('Numbers updated.');
        try {
          setStats(await getStats(selected.id));
        } catch {
          /* keep prior */
        }
      })
      .catch((e) => triggerToast(errMsg(e)))
      .finally(() => setSavingMetrics(false));
  };

  // ---- Builder view ----
  if (viewState === 'builder') {
    const field = 'w-full bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28]';
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewState('list')} className="text-sm font-bold text-[#617065] hover:text-[#1E2923] cursor-pointer">← Back</button>
          <h2 className="text-2xl font-display font-bold text-[#1E2923]">New smoke test</h2>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`flex-1 h-2 rounded-full ${wizardStep >= n ? 'bg-[#183B28]' : 'bg-[#EBEBE6]'}`} />
          ))}
        </div>

        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-8 flex flex-col gap-6">
          {wizardStep === 1 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-[#1E2923]">Step 1: Page design</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Hero headline</label>
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} type="text" placeholder="e.g. Save every day on WhatsApp" className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Subheadline</label>
                  <textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="e.g. Automated daily savings for gig workers…" className={`${field} h-20 resize-none`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">CTA button text</label>
                  <input value={cta} onChange={(e) => setCta(e.target.value)} type="text" placeholder="e.g. Get Early Access" className={field} />
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-[#EBEBE6]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={requireEmail} onChange={(e) => setRequireEmail(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-medium text-[#1E2923]">Require email capture</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showPricing} onChange={(e) => setShowPricing(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-medium text-[#1E2923]">Show fake-door pricing section</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Post-signup message</label>
                  <input value={postSignupMsg} onChange={(e) => setPostSignupMsg(e.target.value)} type="text" className={field} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setWizardStep(2)} className="bg-[#183B28] hover:bg-[#11291C] text-white px-6 py-2.5 rounded-card font-bold text-sm flex items-center gap-2 cursor-pointer">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-[#1E2923]">Step 2: Goal &amp; metrics</h3>
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Success metric</label>
                <div className="flex flex-col gap-3">
                  {[
                    { v: 'email_signup', label: 'Email signup' },
                    { v: 'cta_click', label: 'CTA click (no email)' },
                    { v: 'preorder_click', label: 'Preorder click (pricing page)' },
                  ].map((m) => (
                    <label key={m.v} className={`flex items-center gap-3 p-4 border rounded-card cursor-pointer transition-colors ${metricType === m.v ? 'bg-[#E6EFEA] border-[#183B28]' : 'border-[#EBEBE6] hover:bg-[#FAFAFA]'}`}>
                      <input type="radio" name="metric" checked={metricType === m.v} onChange={() => setMetricType(m.v)} className="w-4 h-4" />
                      <span className="text-sm font-bold text-[#1E2923]">{m.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 pt-4">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Target conversion rate (%)</label>
                  <input value={targetConversion} onChange={(e) => setTargetConversion(e.target.value)} type="number" min={0} className={field} />
                  <span className="text-xs text-[#617065]">Typical validation bar: 5-10% cold traffic</span>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-[#EBEBE6]">
                <button onClick={() => setWizardStep(1)} className="text-sm font-bold text-[#617065] hover:text-[#1E2923] cursor-pointer">Back</button>
                <button onClick={() => setWizardStep(3)} className="bg-[#183B28] hover:bg-[#11291C] text-white px-6 py-2.5 rounded-card font-bold text-sm flex items-center gap-2 cursor-pointer">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-[#1E2923]">Step 3: Create</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Slug (label for your landing page)</label>
                  <div className="flex items-center">
                    <span className="bg-[#F0F0EC] border border-r-0 border-[#EBEBE6] px-4 py-2.5 text-sm text-[#617065] rounded-l-input">https://</span>
                    <input type="text" placeholder="my-cool-idea" value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 bg-[#F7F7F5] border border-[#EBEBE6] px-4 py-2.5 text-sm outline-none focus:border-[#183B28]" />
                    <span className="bg-[#F0F0EC] border border-l-0 border-[#EBEBE6] px-4 py-2.5 text-sm text-[#617065] rounded-r-input">.yoursite.com</span>
                  </div>
                  <span className="text-xs text-[#617065]">Host the landing page yourself; record its visits &amp; signups here as they come in.</span>
                </div>
                <div className="mt-2 border border-[#EBEBE6] rounded-modal bg-[#F7F7F5] p-6 flex flex-col items-center justify-center gap-3 text-center">
                  <h4 className="text-xl font-bold text-[#1E2923]">{headline || 'Hero headline preview'}</h4>
                  {subheadline && <p className="text-[#617065] text-sm">{subheadline}</p>}
                  <button className="bg-[#9C5B34] text-white px-6 py-2 rounded-card font-bold mt-1" type="button" disabled>{cta || 'Get Early Access'}</button>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-[#EBEBE6]">
                <button onClick={() => setWizardStep(2)} className="text-sm font-bold text-[#617065] hover:text-[#1E2923] cursor-pointer">Back</button>
                <button onClick={handlePublish} disabled={publishing} className="bg-[#9C5B34] hover:bg-[#8A5330] disabled:opacity-60 text-white px-6 py-2.5 rounded-card font-bold text-sm flex items-center gap-2 cursor-pointer">
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create smoke test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Results view ----
  if (viewState === 'results' && selected) {
    const visits = stats?.visits ?? selected.visits;
    const signups = stats?.signups ?? selected.signups;
    const conversion = stats?.conversion ?? selected.conversionRate;
    const isSignificant = visits >= 100;
    const isValidated = conversion >= selected.targetConversion;

    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewState('list')} className="text-sm font-bold text-[#617065] hover:text-[#1E2923] cursor-pointer">← Back</button>
          <h2 className="text-2xl font-display font-bold text-[#1E2923]">{selected.name} results</h2>
        </div>

        {statsLoading && !stats ? (
          <div className="flex items-center justify-center gap-2 text-sage-500 py-10">
            <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading results…</span>
          </div>
        ) : (
          <>
            {isSignificant ? (
              <div className={`p-4 rounded-modal border flex items-start gap-3 shadow-card ${isValidated ? 'bg-[#E6EFEA] border-[#D5E3DB]' : 'bg-[#FDF2F2] border-[#F4C7C7]'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isValidated ? 'bg-[#183B28] text-white' : 'bg-[#B0483B] text-white'}`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isValidated ? 'text-[#183B28]' : 'text-[#A34B4B]'}`}>
                    Signal: {conversion}% conversion against your {selected.targetConversion}% bar → looks {isValidated ? 'validated' : 'weak'}.
                  </p>
                  <p className={`text-xs mt-1 ${isValidated ? 'text-[#2D5A3F]' : 'text-[#8A3A30]'}`}>Enough data ({visits} visits) to make an informed call.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-modal border bg-[#FAFAFA] border-[#EBEBE6] flex items-start gap-3 shadow-card">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#8E9B90] text-white font-bold text-xs">i</div>
                <div>
                  <p className="text-sm font-bold text-[#1E2923]">Collecting data…</p>
                  <p className="text-xs mt-1 text-[#617065]">Aim for at least 100 visits for a reliable signal. Currently at {visits}.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-8 flex flex-col gap-8">
              <h3 className="text-lg font-bold text-[#1E2923]">Funnel</h3>
              <div className="flex flex-col gap-2">
                <div className="w-full bg-[#E6EFEA] border border-[#D5E3DB] rounded-card p-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#183B28]">Visits</span>
                  <span className="text-lg font-display font-bold text-[#183B28]">{visits}</span>
                </div>
                <div className="w-[55%] mx-auto bg-[#FDF2F2] border border-[#F4C7C7] rounded-card p-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#A34B4B]">Signups</span>
                  <span className="text-lg font-display font-bold text-[#A34B4B]">{signups}</span>
                </div>
                <p className="text-center text-xs text-[#617065] mt-1">Conversion: <span className="font-bold text-[#1E2923]">{conversion}%</span></p>
              </div>

              {/* Record real numbers (there is no traffic instrumentation — you enter what you observed) */}
              <div className="border-t border-[#EBEBE6] pt-6">
                <h4 className="text-sm font-bold text-[#1E2923] mb-3">Record your numbers</h4>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#768478] uppercase">Visits</label>
                    <input type="number" min={0} value={visitsInput} onChange={(e) => setVisitsInput(e.target.value)} className="w-28 bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-3 py-2 text-sm outline-none focus:border-[#183B28]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#768478] uppercase">Signups</label>
                    <input type="number" min={0} value={signupsInput} onChange={(e) => setSignupsInput(e.target.value)} className="w-28 bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-3 py-2 text-sm outline-none focus:border-[#183B28]" />
                  </div>
                  <button onClick={handleSaveMetrics} disabled={savingMetrics} className="bg-[#183B28] hover:bg-[#11291C] text-white px-4 py-2 rounded-card font-bold text-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer">
                    {savingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- List view ----
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">Smoke tests</h2>
          <p className="text-sm text-[#617065] mt-1.5">Validate demand with simple landing pages.</p>
        </div>
        <button onClick={() => { resetWizard(); setViewState('builder'); }} className="bg-[#183B28] hover:bg-[#11291C] text-white px-5 py-2.5 rounded-card font-bold text-sm flex items-center gap-2 shadow-card cursor-pointer">
          <Plus className="w-4 h-4" /> <span>New smoke test</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-[#FBEAE7] border border-[#F0C9C2] rounded-card px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-[#8A2E22]"><AlertTriangle className="w-4 h-4 shrink-0" /> {error}</span>
          <button onClick={() => refetch()} className="text-xs font-semibold text-[#8A2E22] underline cursor-pointer">Retry</button>
        </div>
      )}

      {loading && tests.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-sage-500 py-16"><Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading smoke tests…</span></div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-modal p-10 border border-dashed border-sage-200 text-center">
          <p className="text-sm text-sage-500">No smoke tests yet. Create one to design a fake-door landing page and track its conversion.</p>
        </div>
      ) : (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">Test name</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Status</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase text-right">Visits</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase text-right">Conversion</th>
                  <th className="py-3.5 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EC]">
                {tests.map((test) => {
                  const isLive = test.status === 'live';
                  return (
                    <tr key={test.id} onClick={() => openResults(test)} className="hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                      <td className="py-4 px-6 text-sm font-bold text-[#1E2923]">
                        {test.name}
                        {test.slug && <div className="text-xs font-medium text-[#617065] mt-0.5">{test.slug}</div>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLive ? 'bg-[#E6EFEA] text-[#183B28]' : test.status === 'ended' ? 'bg-[#F0F0EC] text-[#617065]' : 'bg-[#FDF4E3] text-[#8A5330]'}`}>
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#2E7A56] mr-1.5 animate-pulse" />}
                          {STATUS_LABEL[test.status] ?? test.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-[#1E2923] text-right">{test.visits}</td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-bold text-[#1E2923]">{test.conversionRate}%</span>
                        <span className="text-[#8E9B90] text-xs ml-1">/ {test.targetConversion}%</span>
                      </td>
                      <td className="py-4 px-6 text-right"><ChevronRight className="w-5 h-5 text-[#A0AABA] group-hover:text-[#183B28] inline-block" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
