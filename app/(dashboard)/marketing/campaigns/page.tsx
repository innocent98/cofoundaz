'use client';

import React, { useState } from "react";
import { useMarketingApi, Campaign, CampaignObjective, MarketingChannel } from "@/hooks/useMarketingApi";
import { useToast } from "../ToastContext";

export default function MarketingCampaignsPage() {
  const { campaigns, addCampaign } = useMarketingApi();
  const { triggerToast } = useToast();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: '',
    objective: 'awareness',
    channels: [],
    budget: 0,
  });

  const handleLaunchCampaign = () => {
    if (!newCampaign.name) return;
    addCampaign({
      id: Date.now().toString(),
      name: newCampaign.name,
      objective: newCampaign.objective as CampaignObjective,
      budget: newCampaign.budget || 0,
      channels: newCampaign.channels || [],
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      metrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0 }
    });
    
    triggerToast(`Campaign "${newCampaign.name}" launched successfully!`);
    setIsWizardOpen(false);
    setWizardStep(1);
    setNewCampaign({ name: '', objective: 'awareness', channels: [], budget: 0 });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
            Campaigns
          </h1>
        </div>

        {!isWizardOpen && (
          <button
            onClick={() => setIsWizardOpen(true)}
            className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card flex items-center gap-2 self-start md:self-auto"
          >
            <span>+ New campaign</span>
          </button>
        )}
      </div>

      {isWizardOpen ? (
        <div className="bg-white rounded-modal border border-sage-200/80 shadow-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-sage-900">Campaign Wizard</h2>
            <button onClick={() => setIsWizardOpen(false)} className="text-sage-500 hover:text-sage-900 text-sm font-semibold">Cancel</button>
          </div>
          
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`h-1.5 flex-1 rounded-full ${step <= wizardStep ? 'bg-[#9C5B34]' : 'bg-sage-200'}`} />
            ))}
          </div>

          {wizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sage-900">Step 1: Objective</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Campaign Name</label>
                <input 
                  type="text" 
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm focus:border-sage-400 outline-none" 
                  placeholder="e.g. Q4 Push"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Objective</label>
                <select 
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value as CampaignObjective })}
                  className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm focus:border-sage-400 outline-none"
                >
                  <option value="awareness">Awareness</option>
                  <option value="leads">Leads</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              <button 
                onClick={() => setWizardStep(2)} 
                disabled={!newCampaign.name}
                className="bg-[#0e271f] hover:bg-[#1e4836] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all"
              >
                Next Step
              </button>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sage-900">Step 2: Audience</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Target Segment</label>
                <select className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm focus:border-sage-400 outline-none">
                  <option>Active Power Users</option>
                  <option>Waitlist Subscribers</option>
                  <option>Churned Users</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setWizardStep(1)} className="border border-sage-300 text-sage-700 font-semibold px-5 py-2.5 rounded-card text-sm transition-all">Back</button>
                <button onClick={() => setWizardStep(3)} className="bg-[#0e271f] hover:bg-[#1e4836] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all">Next Step</button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sage-900">Step 3: Channels & Budget</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Budget ($)</label>
                <input 
                  type="number" 
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm focus:border-sage-400 outline-none" 
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setWizardStep(2)} className="border border-sage-300 text-sage-700 font-semibold px-5 py-2.5 rounded-card text-sm transition-all">Back</button>
                <button onClick={() => setWizardStep(4)} className="bg-[#0e271f] hover:bg-[#1e4836] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all">Next Step</button>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sage-900">Step 4: Content</h3>
              <p className="text-sm text-sage-600">You can generate variants for this campaign in the AI Copy Generator after launching.</p>
              <div className="flex gap-3">
                <button onClick={() => setWizardStep(3)} className="border border-sage-300 text-sage-700 font-semibold px-5 py-2.5 rounded-card text-sm transition-all">Back</button>
                <button onClick={handleLaunchCampaign} className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all flex items-center gap-2">
                  <span>✦</span> Launch Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sage-200 bg-sage-50/50 text-[11px] font-bold text-sage-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Campaign</th>
                  <th className="py-3.5 px-6">Objective</th>
                  <th className="py-3.5 px-6">Budget</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 text-sm">
                {campaigns.map((camp, idx) => {
                  const isLive = camp.status === "active";
                  return (
                    <tr key={idx} className="hover:bg-sage-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-sage-900">{camp.name}</td>
                      <td className="py-4 px-6 text-sage-600 capitalize">{camp.objective}</td>
                      <td className="py-4 px-6 text-sage-900 font-medium">${camp.budget}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isLive
                              ? "bg-green-100 text-green-800"
                              : "bg-sage-100 text-sage-600"
                          }`}
                        >
                          {isLive ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td className={`py-4 px-6 font-semibold ${isLive ? "text-green-700" : "text-sage-400"}`}>
                        {camp.metrics.conversions} conv
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isWizardOpen && (
        <div className="bg-[#0e271f] rounded-modal p-5 md:p-6 flex items-center gap-4 text-white shadow-card">
          <div className="w-9 h-9 rounded-card bg-[#9C5B34] text-white flex items-center justify-center font-bold flex-shrink-0">
            ✦
          </div>
          <p className="text-sm text-sage-200 leading-relaxed">
            Weekly readout: WhatsApp referral is your cheapest conversion at ₦180 CAC. Consider shifting budget there.
          </p>
        </div>
      )}
    </div>
  );
}
