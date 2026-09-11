'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import { Menu, History, Sparkles, Users, Check } from 'lucide-react';

type BillingTab = 'Overview' | 'Plans' | 'Usage' | 'Invoices' | 'Payment' | 'Add-ons';
type PlanType = 'Starter' | 'Growth' | 'Scale';
type BillingInterval = 'Monthly' | 'Annual';

export default function SubscriptionBillingPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState<BillingTab>('Overview');
  const [currentPlan, setCurrentPlan] = useState<PlanType>('Starter');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('Monthly');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upgrade/Downgrade Modal state
  const [modalType, setModalType] = useState<'upgrade' | 'downgrade' | null>(null);
  const [targetPlan, setTargetPlan] = useState<PlanType | null>(null);

  // Cancellation Modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Too expensive right now');

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePlanAction = (plan: PlanType) => {
    if (plan === currentPlan) return;
    const rank: Record<PlanType, number> = { Starter: 1, Growth: 2, Scale: 3 };
    const isUpgrade = rank[plan] > rank[currentPlan];
    setTargetPlan(plan);
    setModalType(isUpgrade ? 'upgrade' : 'downgrade');
  };

  const confirmPlanChange = () => {
    if (!targetPlan) return;
    setCurrentPlan(targetPlan);
    setModalType(null);

    if (targetPlan === 'Starter') {
      showToast('Downgrade scheduled for end of billing cycle.');
    } else if (targetPlan === 'Scale') {
      showToast('Welcome to Scale.');
    } else {
      showToast(`Successfully switched to ${targetPlan} plan.`);
    }
  };

  // Mock billing history invoices data
  const invoicesData = [
    { date: 'Jul 26, 2026', description: 'Growth plan, monthly', amount: '₦24,000', status: 'Failed' },
    { date: 'Jul 12, 2026', description: 'AI credit top-up, 2,000', amount: '₦8,000', status: 'Paid' },
    { date: 'Jun 26, 2026', description: 'Growth plan, monthly', amount: '₦24,000', status: 'Paid' },
    { date: 'May 26, 2026', description: 'Growth plan, monthly', amount: '₦24,000', status: 'Paid' },
    { date: 'Apr 26, 2026', description: 'Growth plan, monthly', amount: '₦24,000', status: 'Paid' },
    { date: 'Mar 26, 2026', description: 'Starter to Growth upgrade', amount: '₦18,400', status: 'Paid' },
  ];

  // Mock usage breakdown data matching the reference image layout
  const usageBreakdownData = [
    { feature: 'Business plan generation', runs: '2', credits: '1,100', share: '28%' },
    { feature: 'AI Co-Founder chat', runs: '184', credits: '920', share: '24%' },
    { feature: 'Financial model build', runs: '3', credits: '720', share: '18%' },
    { feature: 'Marketing copy generation', runs: '46', credits: '560', share: '14%' },
    { feature: 'Contract review', runs: '5', credits: '400', share: '10%' },
    { feature: 'Deck analysis', runs: '2', credits: '200', share: '6%' },
  ];

  // Daily consumption mock heights matching the visual distribution in the chart screenshot
  const dailyBars = [
    35, 45, 25, 55, 65, 20, 15, 45, 60, 75, 50, 40, 30, 60, 80, 45, 35, 55, 70, 65, 50
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923] font-body antialiased relative selection:bg-[#EAD5C6]">

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-[#1E4231]">
          <span className="w-4 h-4 rounded-full bg-[#1C4230] flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Upgrade / Downgrade Modal Dialog */}
      {modalType && targetPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-7 max-w-md w-full shadow-accent space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-xl font-display font-medium text-[#1E2923]">
                {modalType === 'upgrade' ? `Upgrade to ${targetPlan}` : `Downgrade to ${targetPlan}`}
              </h3>
              <p className="text-xs text-[#8E9B90] leading-relaxed">
                {modalType === 'upgrade'
                  ? `You get everything in ${targetPlan} immediately.`
                  : `You keep your data, but features above ${targetPlan} will lock at the end of your billing cycle.`}
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E8E8E2] rounded-[24px] p-4 space-y-3 text-xs">
              {modalType === 'upgrade' ? (
                <>
                  <div className="flex justify-between text-[#1E2923]">
                    <span>{targetPlan}, {billingInterval.toLowerCase()}</span>
                    <span className="font-semibold">
                      {billingInterval === 'Annual' 
                        ? (targetPlan === 'Scale' ? '₦680,000' : '₦240,000') 
                        : (targetPlan === 'Scale' ? '₦68,000' : '₦24,000')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[#1E2923] pt-2 border-t border-[#E8E8E2] text-sm">
                    <span>Due today</span>
                    <span>
                      {billingInterval === 'Annual' 
                        ? (targetPlan === 'Scale' ? '₦680,000' : '₦240,000') 
                        : (targetPlan === 'Scale' ? '₦68,000' : '₦24,000')}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-[#1E2923]">
                    <span>New plan</span>
                    <span className="font-semibold">{targetPlan} ({targetPlan === 'Starter' ? 'Free' : 'Paid'})</span>
                  </div>
                  <div className="flex justify-between text-[#1E2923]">
                    <span>Effective</span>
                    <span className="font-semibold">End of current period</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#1E2923] pt-2 border-t border-[#E8E8E2] text-sm">
                    <span>Due today</span>
                    <span>₦0</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 bg-white hover:bg-sage-50 text-[#1E2923] border border-[#E0E0DA] font-medium py-2.5 px-4 rounded-modal text-xs transition-colors cursor-pointer text-center"
              >
                Not now
              </button>

              <button
                type="button"
                onClick={confirmPlanChange}
                className="flex-1 bg-[#B39353] hover:bg-[#A38346] text-white font-semibold py-2.5 px-4 rounded-modal text-xs transition-colors shadow-xs cursor-pointer text-center"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Survey Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 max-w-lg w-full shadow-accent space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-xl font-display font-medium text-[#1E2923]">Before you go</h3>
              <p className="text-xs text-[#8E9B90] leading-relaxed">
                Cancelling pauses your roadmap and locks advanced hubs.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1E2923]">What is driving this?</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-white border border-[#E0E0DA] rounded-modal px-3.5 py-2.5 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#B39353]"
              >
                <option value="Too expensive right now">Too expensive right now</option>
                <option value="Not using it enough">Not using it enough</option>
                <option value="Missing a feature I need">Missing a feature I need</option>
                <option value="Switching to something else">Switching to something else</option>
                <option value="My startup is winding down">My startup is winding down</option>
              </select>
            </div>

            <div className="bg-[#FAF6EE] border border-[#F2E5D0] rounded-[24px] p-4 text-xs text-[#6B5A35] space-y-1">
              <p className="font-medium">Would pausing for 2 months help instead? Your data and roadmap stay safe.</p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  showToast('Plan paused for 2 months.');
                }}
                className="flex-1 bg-[#B39353] hover:bg-[#A38346] text-white font-semibold py-2.5 px-4 rounded-modal text-xs transition-colors shadow-xs cursor-pointer text-center"
              >
                Pause instead
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  showToast('Plan cancelled.');
                }}
                className="flex-1 bg-white hover:bg-red-50 text-[#A63326] border border-[#E0E0DA] font-semibold py-2.5 px-4 rounded-modal text-xs transition-colors cursor-pointer text-center"
              >
                Cancel anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E8E2] px-8 py-3.5 flex items-center justify-between bg-white w-full">
        <div className="flex items-center space-x-3">
          <button 
            onClick={openSidebar}
            className="md:hidden w-9 h-9 rounded-modal border border-[#E0E0DA] bg-white text-[#183B28] hover:bg-sage-50 flex items-center justify-center transition-colors shrink-0 shadow-xs"
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center space-x-2 text-sm md:text-base font-semibold tracking-tight">
            <span className="text-[#617065] font-normal">Settings</span>
            <span className="text-[#8E9B90] font-normal">/</span>
            <span className="text-[#1E2923] font-semibold">Subscription & Billing</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setActiveTab('Plans')}
            className="bg-[#EAF2ED] text-[#183B28] border border-[#D5E6DC] px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-accent hover:bg-[#DDEEE4] transition-colors cursor-pointer"
          >
            <span>{currentPlan} plan</span>
          </button>

          <div className="relative w-9 h-9 rounded-full border border-[#E0E0DA] bg-white flex items-center justify-center text-[#55635C] shadow-xs">
            <History className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-[#B39353] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              5
            </span>
          </div>
        </div>
      </header>

      {/* Sub-Navbar / Tabs */}
      <nav className="w-full bg-[#F7F7F5] border-b border-[#E8E8E2] px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar">
          {(['Overview', 'Plans', 'Usage', 'Invoices', 'Payment', 'Add-ons'] as BillingTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  showToast(`Switched to ${tab} tab.`);
                }}
                className={
                  isActive
                    ? "px-4 py-1.5 rounded-full text-xs font-semibold bg-[#EAD5C6] text-[#1E2923] shadow-2xs transition-colors shrink-0 cursor-pointer border border-[#DFC4B2]"
                    : "px-4 py-1.5 rounded-full text-xs font-medium text-[#617065] hover:bg-[#EFEFEE] transition-colors shrink-0 cursor-pointer border border-transparent"
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-8 py-8 space-y-8">

        {/* ================= OVERVIEW TAB (Updated to match exact image specs) ================= */}
        {activeTab === 'Overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Payment Failed Alert Banner */}
            <div className="bg-[#FDF0ED] border border-[#F3D5CE] rounded-[24px] p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start space-x-3.5">
                <div className="w-7 h-7 rounded-full bg-[#E5573B] text-white flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
                  !
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#A63326]">Your last payment failed</h4>
                  <p className="text-xs text-[#8D4037]">We will retry on Jul 30. Update your card to keep everything running.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('Payment')}
                className="bg-[#A63326] hover:bg-[#8D2A20] text-white font-semibold px-4 py-2 rounded-modal text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Update card
              </button>
            </div>

            {/* Top row cards (Current Plan & Next Invoice) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Current Plan Dark Card (spanning 2 columns) */}
              <div className="md:col-span-2 bg-[#12291F] text-white border border-[#12291F] rounded-[24px] p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold text-[#A3B3A6] uppercase tracking-wider">Current Plan</span>
                    <div className="text-3xl font-display font-medium text-white">
                      {currentPlan === 'Starter' ? 'Free' : currentPlan === 'Growth' ? '₦24,000' : '₦68,000'}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-display font-medium text-white">{currentPlan}</h3>
                    <p className="text-xs text-[#A3B3A6] mt-1">
                      {currentPlan === 'Starter' ? '1 seat · 500 AI credits monthly' : 'Active billing cycle'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <div className="text-xs text-[#A3B3A6]">
                    {currentPlan === 'Starter' ? 'no card required' : 'renews monthly'}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('Plans')}
                      className="bg-[#B39353] hover:bg-[#A38346] text-white font-semibold px-5 py-2.5 rounded-modal text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Change plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Payment')}
                      className="bg-[#1C4230] hover:bg-[#25523D] text-white border border-[#2E5E43] font-semibold px-5 py-2.5 rounded-modal text-xs transition-colors cursor-pointer"
                    >
                      Payment method
                    </button>
                  </div>
                </div>
              </div>

              {/* Next Invoice Card (1 column) */}
              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-8 flex flex-col justify-between shadow-xs space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Next invoice</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-display font-medium text-[#1E2923]">₦0</div>
                    <p className="text-xs text-[#8E9B90]">on Jul 30, 2026</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E8E2] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 font-semibold text-[#1E2923]">
                    <span className="bg-[#183B28] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">VISA</span>
                    <span>•••• 4291</span>
                  </div>
                  <span className="text-[11px] text-[#8E9B90]">Expires 09/28</span>
                </div>
              </div>

            </div>

            {/* Bottom row metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* AI Credits Metric */}
              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">AI Credits</span>
                  <span className="text-xs font-bold text-[#B39353]">78%</span>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-display font-medium text-[#1E2923]">3,900 of 5,000</div>
                  <div className="w-full bg-[#EFEFED] h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-[#B39353] h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <p className="text-[11px] text-[#8E9B90] pt-1">Resets in 9 days</p>
              </div>

              {/* Seats Metric */}
              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Seats</span>
                  <span className="text-xs font-bold text-[#183B28]">60%</span>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-display font-medium text-[#1E2923]">3 of 5 used</div>
                  <div className="w-full bg-[#EFEFED] h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-[#183B28] h-full rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <p className="text-[11px] text-[#8E9B90] pt-1">2 professionals are free</p>
              </div>

              {/* Storage Metric */}
              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Storage</span>
                  <span className="text-xs font-bold text-[#183B28]">11%</span>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-display font-medium text-[#1E2923]">2.1 GB of 20 GB</div>
                  <div className="w-full bg-[#EFEFED] h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-[#183B28] h-full rounded-full" style={{ width: '11%' }}></div>
                  </div>
                </div>

                <p className="text-[11px] text-[#8E9B90] pt-1">38 documents</p>
              </div>

            </div>

            {/* Banner Callout at bottom of Overview */}
            <div className="bg-[#FAF6EE] border border-[#F2E5D0] rounded-[24px] p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start space-x-3.5">
                <div className="w-7 h-7 rounded-full bg-[#B39353] text-white flex items-center justify-center shrink-0 text-xs mt-0.5">
                  <Sparkles size={14} />
                </div>
                <p className="text-xs text-[#6B5A35] leading-relaxed">
                  You have used 78% of this month's AI credits with 9 days to go. Big jobs like a business plan cost more, plan accordingly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('Add-ons')}
                className="bg-[#B39353] hover:bg-[#A38346] text-white font-semibold px-4 py-2 rounded-modal text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Add credits
              </button>
            </div>

          </div>
        )}

        {/* ================= PLANS TAB ================= */}
        {activeTab === 'Plans' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">Change your plan</h2>
              
              <div className="inline-flex bg-[#EFEFED] border border-[#E2E2DC] p-1 rounded-full items-center space-x-1">
                {(['Monthly', 'Annual'] as BillingInterval[]).map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => {
                      setBillingInterval(interval);
                      showToast(`Switched to ${interval} billing.`);
                    }}
                    className={
                      billingInterval === interval
                        ? "px-5 py-1.5 rounded-full text-xs font-semibold bg-white text-[#1E2923] shadow-xs cursor-pointer"
                        : "px-5 py-1.5 rounded-full text-xs font-medium text-[#617065] hover:text-[#1E2923] cursor-pointer"
                    }
                  >
                    {interval}
                  </button>
                ))}
              </div>
              {billingInterval === 'Annual' && (
                <p className="text-xs text-[#183B28] font-medium pt-1">Two months free on annual billing.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* STARTER CARD */}
              <div className={`rounded-[24px] p-8 flex flex-col justify-between transition-all duration-200 relative ${
                currentPlan === 'Starter'
                  ? 'bg-[#12291F] text-white border-2 border-[#12291F] shadow-accent'
                  : 'bg-white text-[#1E2923] border border-[#E8E8E2] shadow-xs'
              }`}>
                {currentPlan === 'Starter' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1C4230] border border-[#2E5E43] text-white text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-card">
                    Your plan
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-xl font-display font-medium ${currentPlan === 'Starter' ? 'text-white' : 'text-[#1E2923]'}`}>Starter</h3>
                    <p className={`text-xs mt-1 ${currentPlan === 'Starter' ? 'text-[#A3B3A6]' : 'text-[#8E9B90]'}`}>For validating an idea.</p>
                  </div>

                  <div>
                    <div className={`text-3xl font-display font-medium ${currentPlan === 'Starter' ? 'text-white' : 'text-[#1E2923]'}`}>
                      Free
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanAction('Starter')}
                    disabled={currentPlan === 'Starter'}
                    className={`w-full py-2.5 rounded-modal text-xs font-semibold transition-colors text-center ${
                      currentPlan === 'Starter'
                        ? 'bg-[#1C4230] text-white border border-[#2E5E43] cursor-default'
                        : 'bg-white hover:bg-sage-50 text-[#1E2923] border border-[#E0E0DA] cursor-pointer shadow-xs'
                    }`}
                  >
                    {currentPlan === 'Starter' ? 'Current plan' : 'Downgrade'}
                  </button>

                  <ul className={`space-y-3 text-xs pt-2 ${currentPlan === 'Starter' ? 'text-[#D1E0D4]' : 'text-[#55635C]'}`}>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Starter' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Core AI Co-Founder</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Starter' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Roadmap and Health Score</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Starter' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Business Builder</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Starter' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Documents</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Starter' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>500 AI credits monthly</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Starter' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>1 seat</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* GROWTH CARD */}
              <div className={`rounded-[24px] p-8 flex flex-col justify-between transition-all duration-200 relative ${
                currentPlan === 'Growth'
                  ? 'bg-[#12291F] text-white border-2 border-[#12291F] shadow-accent'
                  : 'bg-white text-[#1E2923] border border-[#E8E8E2] shadow-xs'
              }`}>
                {currentPlan === 'Growth' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1C4230] border border-[#2E5E43] text-white text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-card">
                    Your plan
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-xl font-display font-medium ${currentPlan === 'Growth' ? 'text-white' : 'text-[#1E2923]'}`}>Growth</h3>
                    <p className={`text-xs mt-1 ${currentPlan === 'Growth' ? 'text-[#A3B3A6]' : 'text-[#8E9B90]'}`}>For getting to revenue.</p>
                  </div>

                  <div>
                    <div className={`text-3xl font-display font-medium flex items-baseline space-x-1.5 ${currentPlan === 'Growth' ? 'text-white' : 'text-[#1E2923]'}`}>
                      <span>{billingInterval === 'Annual' ? '₦240,000' : '₦24,000'}</span>
                      <span className={`text-xs font-body font-normal ${currentPlan === 'Growth' ? 'text-[#A3B3A6]' : 'text-[#8E9B90]'}`}>
                        per {billingInterval === 'Annual' ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanAction('Growth')}
                    disabled={currentPlan === 'Growth'}
                    className={`w-full py-2.5 rounded-modal text-xs font-semibold transition-colors text-center ${
                      currentPlan === 'Growth'
                        ? 'bg-[#1C4230] text-white border border-[#2E5E43] cursor-default'
                        : currentPlan === 'Scale'
                          ? 'bg-white hover:bg-sage-50 text-[#1E2923] border border-[#E0E0DA] cursor-pointer shadow-xs'
                          : 'bg-[#B39353] hover:bg-[#A38346] text-white cursor-pointer shadow-xs'
                    }`}
                  >
                    {currentPlan === 'Growth' ? 'Current plan' : currentPlan === 'Scale' ? 'Downgrade' : 'Upgrade'}
                  </button>

                  <ul className={`space-y-3 text-xs pt-2 ${currentPlan === 'Growth' ? 'text-[#D1E0D4]' : 'text-[#55635C]'}`}>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Growth' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Everything in Starter</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Growth' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Marketing, Sales, Finance, Validation Hubs</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Growth' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Analytics and Reports</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Growth' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>5,000 AI credits monthly</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Growth' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>5 seats</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* SCALE CARD */}
              <div className={`rounded-[24px] p-8 flex flex-col justify-between transition-all duration-200 relative ${
                currentPlan === 'Scale'
                  ? 'bg-[#12291F] text-white border-2 border-[#12291F] shadow-accent'
                  : 'bg-white text-[#1E2923] border border-[#E8E8E2] shadow-xs'
              }`}>
                {currentPlan === 'Scale' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1C4230] border border-[#2E5E43] text-white text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-card">
                    Your plan
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-xl font-display font-medium ${currentPlan === 'Scale' ? 'text-white' : 'text-[#1E2923]'}`}>Scale</h3>
                    <p className={`text-xs mt-1 ${currentPlan === 'Scale' ? 'text-[#A3B3A6]' : 'text-[#8E9B90]'}`}>For raising and expanding.</p>
                  </div>

                  <div>
                    <div className={`text-3xl font-display font-medium flex items-baseline space-x-1.5 ${currentPlan === 'Scale' ? 'text-white' : 'text-[#1E2923]'}`}>
                      <span>{billingInterval === 'Annual' ? '₦680,000' : '₦68,000'}</span>
                      <span className={`text-xs font-body font-normal ${currentPlan === 'Scale' ? 'text-[#A3B3A6]' : 'text-[#8E9B90]'}`}>
                        per {billingInterval === 'Annual' ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanAction('Scale')}
                    disabled={currentPlan === 'Scale'}
                    className={`w-full py-2.5 rounded-modal text-xs font-semibold transition-colors text-center ${
                      currentPlan === 'Scale'
                        ? 'bg-[#1C4230] text-white border border-[#2E5E43] cursor-default'
                        : 'bg-[#B39353] hover:bg-[#A38346] text-white cursor-pointer shadow-xs'
                    }`}
                  >
                    {currentPlan === 'Scale' ? 'Current plan' : 'Upgrade'}
                  </button>

                  <ul className={`space-y-3 text-xs pt-2 ${currentPlan === 'Scale' ? 'text-[#D1E0D4]' : 'text-[#55635C]'}`}>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Scale' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Everything in Growth</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Scale' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Funding Hub and Investor Readiness</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Scale' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Legal and Compliance</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Scale' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Scale' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>20,000 AI credits monthly</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check size={14} className={currentPlan === 'Scale' ? 'text-[#85C29A]' : 'text-[#137333]'} />
                      <span>Unlimited seats</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= USAGE TAB ================= */}
        {activeTab === 'Usage' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header section */}
            <div className="space-y-1">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">AI credit usage</h2>
              <p className="text-xs text-[#8E9B90]">July 2026 · resets in 9 days</p>
            </div>

            {/* Daily Consumption Card */}
            <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E2923]">Daily consumption</span>
                <span className="text-xs font-medium text-[#8E9B90]">3,900 of 5,000 credits used</span>
              </div>

              {/* Bar Chart Mock Container */}
              <div className="h-44 w-full flex items-end justify-between pt-6 pb-2 px-2 gap-1.5 md:gap-3 border-b border-[#E8E8E2]">
                {dailyBars.map((height, index) => {
                  const isHighlighted = index === 10 || index === 18; 
                  return (
                    <div key={index} className="w-full flex flex-col items-center h-full justify-end group relative">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isHighlighted ? 'bg-[#B39353]' : 'bg-[#2E5E43] hover:bg-[#386F51]'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Footer X-Axis Labels */}
              <div className="flex items-center justify-between text-[11px] text-[#8E9B90] font-medium pt-1">
                <span>Jul 1</span>
                <span>Jul 10</span>
                <span>Jul 20</span>
                <span>Jul 27</span>
              </div>
            </div>

            {/* What Used Credits Table */}
            <div className="bg-white border border-[#E8E8E2] rounded-[24px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E8E2] text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider bg-[#FAFAF8]">
                      <th className="py-3.5 px-6">What used credits</th>
                      <th className="py-3.5 px-6">Runs</th>
                      <th className="py-3.5 px-6">Credits</th>
                      <th className="py-3.5 px-6 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F2EC] text-xs font-medium text-[#1E2923]">
                    {usageBreakdownData.map((row, i) => (
                      <tr key={i} className="hover:bg-[#FCFCFB] transition-colors">
                        <td className="py-4 px-6 font-semibold text-[#1E2923]">{row.feature}</td>
                        <td className="py-4 px-6 text-[#55635C]">{row.runs}</td>
                        <td className="py-4 px-6 font-bold">{row.credits}</td>
                        <td className="py-4 px-6 text-right text-[#55635C]">{row.share}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= INVOICES TAB ================= */}
        {activeTab === 'Invoices' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">Billing history</h2>
              <button
                type="button"
                onClick={() => showToast('All invoices downloaded.')}
                className="bg-white hover:bg-sage-50 text-[#1E2923] border border-[#E0E0DA] px-4 py-2 rounded-modal text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center space-x-2"
              >
                <span>Download all</span>
              </button>
            </div>

            <div className="bg-white border border-[#E8E8E2] rounded-[24px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E8E2] text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider bg-[#FAFAF8]">
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Description</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F2EC] text-xs font-medium text-[#1E2923]">
                    {invoicesData.map((inv, i) => {
                      const isFailed = inv.status === 'Failed';
                      return (
                        <tr key={i} className="hover:bg-[#FCFCFB] transition-colors">
                          <td className="py-4 px-6 text-[#55635C]">{inv.date}</td>
                          <td className="py-4 px-6 font-semibold">{inv.description}</td>
                          <td className="py-4 px-6 font-bold">{inv.amount}</td>
                          <td className="py-4 px-6">
                            <span className={
                              isFailed
                                ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FCE8E6] text-[#A63326]"
                                : "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F4EA] text-[#137333]"
                            }>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => showToast(`Invoice for ${inv.date} downloaded.`)}
                              className="font-semibold text-[#1E2923] hover:text-[#B39353] transition-colors cursor-pointer inline-flex items-center space-x-1"
                            >
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAYMENT TAB ================= */}
        {activeTab === 'Payment' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">Payment methods</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-5 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-4">
                  <div className="bg-[#183B28] text-white font-bold text-[11px] px-2.5 py-1.5 rounded-card tracking-wider">
                    VISA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1E2923]">•••• 4291</div>
                    <div className="text-[11px] text-[#8E9B90]">Expires 09/28</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="bg-[#E6F4EA] text-[#137333] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    Primary
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast('Card removed.')}
                    className="text-xs font-semibold text-[#A63326] hover:text-[#8D2A20] transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => showToast('Add card form opened.')}
                className="w-full py-4 border border-dashed border-[#D0D0C8] rounded-[24px] text-xs font-semibold text-[#617065] hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>+ Add a payment method</span>
              </button>
            </div>

            <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-[#1E2923]">Billing details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#617065]">Company name</label>
                  <input
                    type="text"
                    defaultValue="Kolo Technologies Ltd"
                    className="w-full bg-white border border-[#E0E0DA] rounded-modal px-3.5 py-2.5 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#B39353]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#617065]">Tax ID (TIN)</label>
                  <input
                    type="text"
                    defaultValue="Pending"
                    className="w-full bg-white border border-[#E0E0DA] rounded-modal px-3.5 py-2.5 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#B39353]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#617065]">Billing address</label>
                <input
                  type="text"
                  defaultValue="14 Adeola Odeku, Victoria Island, Lagos"
                  className="w-full bg-white border border-[#E0E0DA] rounded-modal px-3.5 py-2.5 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#B39353]"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => showToast('Billing details saved.')}
                  className="bg-[#B39353] hover:bg-[#A38346] text-white font-semibold py-2.5 px-5 rounded-modal text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Save details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ADD-ONS TAB ================= */}
        {activeTab === 'Add-ons' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-3xl font-display font-medium text-[#1E2923]">Add-ons</h2>
              <p className="text-xs text-[#8E9B90]">Top up without changing your plan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 flex flex-col justify-between shadow-xs space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-modal bg-[#EAF2ED] text-[#183B28] flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#1E2923]">2,000 AI credits</h3>
                    <p className="text-[11px] text-[#8E9B90]">One-time top-up, never expires.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold text-[#1E2923]">₦8,000</span>
                  <button
                    type="button"
                    onClick={() => showToast('2,000 AI credits added.')}
                    className="bg-[#B39353] hover:bg-[#A38346] text-white font-semibold py-2 px-5 rounded-modal text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 flex flex-col justify-between shadow-xs space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-modal bg-[#EAF2ED] text-[#183B28] flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#1E2923]">Extra seat</h3>
                    <p className="text-[11px] text-[#8E9B90]">One more team member, monthly.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold text-[#1E2923]">₦4,000</span>
                  <button
                    type="button"
                    onClick={() => showToast('Extra seat added.')}
                    className="bg-[#B39353] hover:bg-[#A38346] text-white font-semibold py-2 px-5 rounded-modal text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Cancel Subscription Card */}
            <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#1E2923]">Cancel subscription</h3>
                <p className="text-[11px] text-[#8E9B90]">Your plan stays active until the end of the billing period.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="bg-white hover:bg-red-50 text-[#A63326] border border-[#E0E0DA] font-semibold py-2 px-4 rounded-modal text-xs transition-colors cursor-pointer shadow-xs shrink-0"
              >
                Cancel plan
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}