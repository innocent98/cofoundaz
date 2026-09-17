'use client';

import React, { useState } from 'react';
import { useValidationApi, SmokeTest } from '@/hooks/useValidationApi';
import { Plus, ArrowRight, ChevronRight, Check } from 'lucide-react';
import { useToast } from '../layout';

export default function SmokeTestsPage() {
  const { smokeTests } = useValidationApi();
  const { triggerToast } = useToast();
  
  const [viewState, setViewState] = useState<'list' | 'builder' | 'results'>('list');
  const [selectedTest, setSelectedTest] = useState<SmokeTest | null>(null);
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [slug, setSlug] = useState('');

  const handleOpenBuilder = () => {
    setWizardStep(1);
    setViewState('builder');
  };

  const handlePublish = () => {
    triggerToast(`Smoke test published at ${slug}.cofoundaz.site!`);
    setViewState('list');
  };

  const openResults = (test: SmokeTest) => {
    setSelectedTest(test);
    setViewState('results');
  };

  if (viewState === 'builder') {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewState('list')} className="text-sm font-bold text-[#617065] hover:text-[#1E2923]">
            ← Back
          </button>
          <h2 className="text-2xl font-display font-bold text-[#1E2923]">
            New Smoke Test
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className={`flex-1 h-2 rounded-full ${wizardStep >= 1 ? 'bg-[#183B28]' : 'bg-[#EBEBE6]'}`} />
          <div className={`flex-1 h-2 rounded-full ${wizardStep >= 2 ? 'bg-[#183B28]' : 'bg-[#EBEBE6]'}`} />
          <div className={`flex-1 h-2 rounded-full ${wizardStep >= 3 ? 'bg-[#183B28]' : 'bg-[#EBEBE6]'}`} />
        </div>

        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-8 flex flex-col gap-6">
          {wizardStep === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-[#1E2923]">Step 1: Page Design</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Hero Headline</label>
                  <input type="text" placeholder="e.g. Save every day on WhatsApp" className="w-full bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Subheadline</label>
                  <textarea placeholder="e.g. Automated daily savings for gig workers..." className="w-full bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28] h-20 resize-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">CTA Button Text</label>
                  <input type="text" placeholder="e.g. Get Early Access" className="w-full bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28]" />
                </div>
                
                <div className="flex flex-col gap-3 pt-4 border-t border-[#EBEBE6]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#183B28] rounded focus:ring-[#183B28] bg-[#F7F7F5] border-[#D5E3DB]" />
                    <span className="text-sm font-medium text-[#1E2923]">Require email capture</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-[#183B28] rounded focus:ring-[#183B28] bg-[#F7F7F5] border-[#D5E3DB]" />
                    <span className="text-sm font-medium text-[#1E2923]">Show fake-door pricing section</span>
                  </label>
                </div>
                
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Post-signup message</label>
                  <input type="text" defaultValue="You're on the list — we'll be in touch soon." className="w-full bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28]" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => setWizardStep(2)} className="bg-[#183B28] hover:bg-[#11291C] text-white px-6 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-[#1E2923]">Step 2: Goal & Metrics</h3>
              
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Success Metric</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 p-4 border border-[#EBEBE6] rounded-card cursor-pointer hover:bg-[#FAFAFA] transition-colors has-[:checked]:bg-[#E6EFEA] has-[:checked]:border-[#183B28]">
                    <input type="radio" name="metric" defaultChecked className="w-4 h-4 text-[#183B28] focus:ring-[#183B28]" />
                    <span className="text-sm font-bold text-[#1E2923]">Email signup</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-[#EBEBE6] rounded-card cursor-pointer hover:bg-[#FAFAFA] transition-colors has-[:checked]:bg-[#E6EFEA] has-[:checked]:border-[#183B28]">
                    <input type="radio" name="metric" className="w-4 h-4 text-[#183B28] focus:ring-[#183B28]" />
                    <span className="text-sm font-bold text-[#1E2923]">CTA click (No email)</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-[#EBEBE6] rounded-card cursor-pointer hover:bg-[#FAFAFA] transition-colors has-[:checked]:bg-[#E6EFEA] has-[:checked]:border-[#183B28]">
                    <input type="radio" name="metric" className="w-4 h-4 text-[#183B28] focus:ring-[#183B28]" />
                    <span className="text-sm font-bold text-[#1E2923]">Preorder click (Pricing page)</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1.5 pt-4">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Target Conversion Rate (%)</label>
                  <input type="number" defaultValue={5} className="w-full bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28]" />
                  <span className="text-xs text-[#617065]">Typical validation bar: 5–10% cold traffic</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#EBEBE6]">
                <button onClick={() => setWizardStep(1)} className="text-sm font-bold text-[#617065] hover:text-[#1E2923]">
                  Back
                </button>
                <button onClick={() => setWizardStep(3)} className="bg-[#183B28] hover:bg-[#11291C] text-white px-6 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-[#1E2923]">Step 3: Launch</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E2923] uppercase tracking-wider">Custom Slug</label>
                  <div className="flex items-center">
                    <span className="bg-[#F0F0EC] border border-r-0 border-[#EBEBE6] px-4 py-2.5 text-sm text-[#617065] rounded-l-input">https://</span>
                    <input 
                      type="text" 
                      placeholder="my-cool-idea"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="flex-1 bg-[#F7F7F5] border border-[#EBEBE6] px-4 py-2.5 text-sm outline-none focus:border-[#183B28] focus:ring-1 focus:ring-[#183B28]" 
                    />
                    <span className="bg-[#F0F0EC] border border-l-0 border-[#EBEBE6] px-4 py-2.5 text-sm text-[#617065] rounded-r-input">.cofoundaz.site</span>
                  </div>
                </div>

                <div className="mt-4 border border-[#EBEBE6] rounded-modal bg-[#F7F7F5] p-6 flex flex-col items-center justify-center gap-4 text-center">
                  <h4 className="text-2xl font-bold text-[#1E2923]">Hero Headline Preview</h4>
                  <p className="text-[#617065] text-sm">Automated daily savings for gig workers...</p>
                  <button className="bg-[#9C5B34] text-white px-6 py-2 rounded-card font-bold mt-2">Get Early Access</button>
                  <div className="mt-8 pt-4 border-t border-[#EBEBE6] w-full text-center">
                    <span className="text-[10px] text-[#8E9B90] uppercase tracking-widest font-bold">Powered by Cofoundaz</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#EBEBE6]">
                <button onClick={() => setWizardStep(2)} className="text-sm font-bold text-[#617065] hover:text-[#1E2923]">
                  Back
                </button>
                <button 
                  onClick={handlePublish} 
                  disabled={!slug}
                  className="bg-[#9C5B34] hover:bg-[#8A5330] disabled:bg-[#D5D5D0] disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2"
                >
                  Publish page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'results' && selectedTest) {
    const isSignificant = selectedTest.visits >= 100;
    const isValidated = selectedTest.conversionRate >= selectedTest.targetConversion;

    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewState('list')} className="text-sm font-bold text-[#617065] hover:text-[#1E2923]">
            ← Back
          </button>
          <h2 className="text-2xl font-display font-bold text-[#1E2923]">
            {selectedTest.name} Results
          </h2>
        </div>

        {isSignificant ? (
          <div className={`p-4 rounded-modal border flex items-start gap-3 shadow-card ${isValidated ? 'bg-[#E6EFEA] border-[#D5E3DB]' : 'bg-[#FDF2F2] border-[#F4C7C7]'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isValidated ? 'bg-[#183B28] text-white' : 'bg-[#B0483B] text-white'}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isValidated ? 'text-[#183B28]' : 'text-[#A34B4B]'}`}>
                Signal: {selectedTest.conversionRate}% conversion against your {selectedTest.targetConversion}% bar → looks {isValidated ? 'validated' : 'weak'}.
              </p>
              <p className={`text-xs mt-1 ${isValidated ? 'text-[#2D5A3F]' : 'text-[#8A3A30]'}`}>
                You have collected enough data (&gt;{selectedTest.visits} visits) to make an informed decision.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-modal border bg-[#FAFAFA] border-[#EBEBE6] flex items-start gap-3 shadow-card">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#8E9B90] text-white font-bold text-xs">
              i
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E2923]">
                Collecting data...
              </p>
              <p className="text-xs mt-1 text-[#617065]">
                Need at least 100 visits for a reliable signal. Currently at {selectedTest.visits}.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-8 flex flex-col gap-8">
          <div>
            <h3 className="text-lg font-bold text-[#1E2923]">Funnel Drop-off</h3>
          </div>

          <div className="flex flex-col gap-2 relative">
            {/* Funnel Level 1: Visits */}
            <div className="w-full bg-[#E6EFEA] border border-[#D5E3DB] rounded-card p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-[#183B28]">Visits</span>
              <span className="text-lg font-display font-bold text-[#183B28]">{selectedTest.visits}</span>
            </div>
            
            {/* Funnel Level 2: Clicks (Mocked as ~40% of visits for display) */}
            <div className="w-[70%] mx-auto bg-[#F5ECDC] border border-[#EAD5C6] rounded-card p-4 flex items-center justify-between z-10">
              <span className="text-sm font-bold text-[#522F1A]">Clicks</span>
              <span className="text-lg font-display font-bold text-[#522F1A]">{Math.floor(selectedTest.visits * 0.4)}</span>
            </div>

            {/* Funnel Level 3: Signups */}
            <div className="w-[40%] mx-auto bg-[#FDF2F2] border border-[#F4C7C7] rounded-card p-4 flex items-center justify-between z-20">
              <span className="text-sm font-bold text-[#A34B4B]">Signups</span>
              <span className="text-lg font-display font-bold text-[#A34B4B]">{selectedTest.signups}</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
            Smoke Tests
          </h2>
          <p className="text-sm text-[#617065] mt-1.5">
            Validate demand with simple landing pages.
          </p>
        </div>
        <button 
          onClick={handleOpenBuilder}
          className="bg-[#183B28] hover:bg-[#11291C] text-white px-5 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2 shadow-card"
        >
          <Plus className="w-4 h-4" />
          <span>New Smoke Test</span>
        </button>
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                  TEST NAME
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                  STATUS
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase text-right">
                  VISITS
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase text-right">
                  CONVERSION
                </th>
                <th className="py-3.5 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EC]">
              {smokeTests.map((test) => {
                const isLive = test.status === 'Live';
                return (
                  <tr key={test.id} onClick={() => openResults(test)} className="hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                    <td className="py-4 px-6 text-sm font-bold text-[#1E2923]">
                      {test.name}
                      <div className="text-xs font-medium text-[#617065] mt-0.5">{test.slug}.cofoundaz.site</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isLive ? 'bg-[#E6EFEA] text-[#183B28]' : 
                        test.status === 'Ended' ? 'bg-[#F0F0EC] text-[#617065]' : 
                        'bg-[#FDF4E3] text-[#8A5330]'
                      }`}>
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#2E7A56] mr-1.5 animate-pulse" />}
                        {test.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-[#1E2923] text-right">
                      {test.visits}
                    </td>
                    <td className="py-4 px-6 text-sm text-right">
                      <span className="font-bold text-[#1E2923]">{test.conversionRate}%</span>
                      <span className="text-[#8E9B90] text-xs ml-1">/ {test.targetConversion}%</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <ChevronRight className="w-5 h-5 text-[#A0AABA] group-hover:text-[#183B28] inline-block transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
