"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import { 
  Bell, 
  UserPlus, 
  Check, 
  ChevronDown,
  FileText
} from "lucide-react";

type LegalTab =
  | "Formation"
  | "Templates"
  | "Contract review"
  | "IP tracker"
  | "Compliance"
  | "Advisor requests";

interface FormationStep {
  id: string;
  title: string;
  meta: string;
  completed: boolean;
}

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  badge: string;
}

interface AdvisorRequest {
  id: string;
  title: string;
  subtitle: string;
  status: "In review" | "Returned" | "Requested";
  statusBg: string;
}

interface IPAsset {
  id: string;
  type: string;
  name: string;
  jurisdiction: string;
  status: "Filed" | "Registered" | "Expired";
  statusBg: string;
  renewal: string;
}

interface ComplianceItem {
  id: string;
  filing: string;
  authority: string;
  due: string;
  dueColor?: string;
  status: "Overdue" | "Due soon" | "Upcoming" | "Done";
  statusBg: string;
}

export default function LegalComplianceApp() {
  const [activeNavTab, setActiveNavTab] = useState<LegalTab>("Compliance");
  const [jurisdiction, setJurisdiction] = useState<string>("Nigeria");
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Advisor requests state list
  const [advisorRequests, setAdvisorRequests] = useState<AdvisorRequest[]>([
    { id: "req-1", title: "Review contractor non-compete", subtitle: "Contractor agreement · Tayo N.", status: "In review", statusBg: "bg-[#f5efe6] text-[#8c6d33]" },
    { id: "req-2", title: "SAFE terms sanity check", subtitle: "SAFE draft · Tayo N.", status: "Returned", statusBg: "bg-[#e2ede6] text-[#1e4836]" },
    { id: "req-3", title: "Trademark filing question", subtitle: "TM application · Tayo N.", status: "Requested", statusBg: "bg-gray-100 text-gray-600" },
  ]);

  // IP Assets state list
  const [ipAssets] = useState<IPAsset[]>([
    { id: "ip-1", type: "Trademark", name: "Kolo (wordmark)", jurisdiction: "Nigeria", status: "Filed", statusBg: "bg-[#f5efe6] text-[#8c6d33]", renewal: "Renews 2034" },
    { id: "ip-2", type: "Domain", name: "kolo.africa", jurisdiction: "Global", status: "Registered", statusBg: "bg-[#e2ede6] text-[#1e4836]", renewal: "Renews Feb 2027" },
    { id: "ip-3", type: "Copyright", name: "App source code", jurisdiction: "Nigeria", status: "Registered", statusBg: "bg-[#e2ede6] text-[#1e4836]", renewal: "No renewal" },
    { id: "ip-4", type: "Trademark", name: "Logo mark", jurisdiction: "Nigeria", status: "Expired", statusBg: "bg-red-100 text-red-700", renewal: "Renew now" },
  ]);

  // Compliance items state list matching Image 5efb5e.png
  const [complianceItems] = useState<ComplianceItem[]>([
    { id: "comp-1", filing: "VAT filing", authority: "FIRS", due: "Was due Jul 10", dueColor: "text-red-700", status: "Overdue", statusBg: "bg-red-100 text-red-700" },
    { id: "comp-2", filing: "Annual return", authority: "CAC", due: "in 9 days", dueColor: "text-amber-700", status: "Due soon", statusBg: "bg-amber-100 text-amber-800" },
    { id: "comp-3", filing: "PAYE remittance", authority: "State IRS", due: "Aug 10", dueColor: "text-gray-600", status: "Upcoming", statusBg: "bg-amber-100/60 text-amber-900" },
    { id: "comp-4", filing: "Pension remittance", authority: "PenCom", due: "Jun 30", dueColor: "text-gray-600", status: "Done", statusBg: "bg-emerald-100 text-emerald-800" },
  ]);

  // Formation steps state
  const [formationSteps, setFormationSteps] = useState<FormationStep[]>([
    { id: "step-1", title: "Reserve company name", meta: "CAC · est. 1 day · ₦500", completed: true },
    { id: "step-2", title: "File incorporation documents", meta: "CAC · est. 3 days · ₦20,000", completed: true },
    { id: "step-3", title: "Get Tax Identification Number", meta: "FIRS · est. 5 days", completed: false },
    { id: "step-4", title: "Open a corporate bank account", meta: "Your bank · est. 2 days", completed: false },
  ]);

  const toggleStep = (id: string) => {
    setFormationSteps(prev =>
      prev.map(step => step.id === id ? { ...step, completed: !step.completed } : step)
    );
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSendToAdvisor = () => {
    setActiveNavTab("Advisor requests");
    triggerToast("New advisor request opened.");
  };

  const handleAcceptAndContinue = () => {
    triggerToast("Accepted. Continuing to signature.");
  };

  const handleAddAsset = () => {
    triggerToast("Add IP asset drawer opened.");
  };

  const handleNewRequestButton = () => {
    const newTitle = prompt("Enter new request title:", "Custom contract review");
    if (newTitle) {
      const newReq: AdvisorRequest = {
        id: `req-${Date.now()}`,
        title: newTitle,
        subtitle: "Contract review · Tayo N.",
        status: "Requested",
        statusBg: "bg-gray-100 text-gray-600",
      };
      setAdvisorRequests([newReq, ...advisorRequests]);
      triggerToast("New advisor request opened.");
    }
  };

  const ndaTemplates: TemplateItem[] = [
    { id: "mutual-nda", title: "Mutual NDA", description: "Two-way confidentiality for partners.", badge: "Nigeria" },
    { id: "oneway-nda", title: "One-way NDA", description: "Protect your info with contractors.", badge: "Nigeria" },
  ];

  const employmentTemplates: TemplateItem[] = [
    { id: "contractor-agreement", title: "Contractor agreement", description: "Scope, pay, and IP for freelancers.", badge: "Nigeria" },
    { id: "employment-offer", title: "Employment offer", description: "Standard full-time offer letter.", badge: "Nigeria" },
  ];

  const fundraisingTemplates: TemplateItem[] = [
    { id: "safe", title: "SAFE", description: "Simple agreement for future equity.", badge: "General" },
    { id: "convertible-note", title: "Convertible note", description: "Debt that converts at your round.", badge: "General" },
  ];

  const ipAssignmentTemplates: TemplateItem[] = [
    { id: "founder-ip", title: "Founder IP assignment", description: "Assign founder work to the company.", badge: "Nigeria" },
    { id: "contractor-ip", title: "Contractor IP assignment", description: "Ensure you own contractor output.", badge: "Nigeria" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#2c3531] flex font-sans relative">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0e271f] text-white flex-shrink-0 hidden md:block shadow-lg">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 w-full md:pl-64">
        
        {/* STICKY HEADER WITH WHITE BACKGROUND */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200/85 shadow-xs w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hover:text-gray-700 cursor-pointer">Workspace</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">Legal & Compliance</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <div className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-[#d2e2d8]">
                <span>Health</span>
                <span className="font-serif font-bold text-sm sm:text-base text-[#0e271f]">72</span>
                <span className="text-xs">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative p-2.5 rounded-full bg-gray-100/80 border border-gray-200/60 text-gray-700 hover:bg-gray-200/60 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#b89d5f] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 cursor-pointer">
                <UserPlus className="w-4 h-4" />
                <span>+ Invite</span>
              </button>
            </div>
          </div>

          {/* TOP NAV TABS */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1">
            <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(
                [
                  "Formation",
                  "Templates",
                  "Contract review",
                  "IP tracker",
                  "Compliance",
                  "Advisor requests",
                ] as LegalTab[]
              ).map((tab) => {
                const isActive = activeNavTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveNavTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#eadaaf] text-[#2c220b] shadow-2xs font-semibold"
                        : "bg-[#eaeee9] text-gray-700 hover:bg-[#e0e6df]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* TOAST NOTIFICATION POPUP */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0e271f] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#23483b] animate-bounce">
            <div className="w-5 h-5 rounded-full bg-[#1e4836] flex items-center justify-center text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* MAIN BODY VIEW ROUTER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full space-y-6">
          
          {/* 1. FORMATION TAB VIEW */}
          {activeNavTab === "Formation" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-serif font-semibold text-gray-900 mb-1">Get the foundation right</h1>
                <p className="text-sm text-gray-600">A jurisdiction-specific path to a properly formed company.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Where are you incorporating?
                </label>
                <div className="relative">
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e271f]/20 appearance-none cursor-pointer"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Delaware, USA">Delaware, USA</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs divide-y divide-gray-100 overflow-hidden">
                {formationSteps.map((step) => (
                  <div
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                          step.completed
                            ? "bg-[#1e4836] border-[#1e4836] text-white"
                            : "bg-white border-gray-300 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <h4 className={`font-semibold text-sm ${step.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{step.meta}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Docs</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. TEMPLATES TAB VIEW */}
          {activeNavTab === "Templates" && (
            <div className="space-y-8 animate-fadeIn pb-10">
              <div>
                <h1 className="text-3xl font-serif font-semibold text-gray-900 mb-1">Contract templates</h1>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#b89d5f]">NDAs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ndaTemplates.map((template) => (
                    <div key={template.id} className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{template.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="bg-[#e2ede6] text-[#1e4836] text-xs font-medium px-2.5 py-1 rounded-full">{template.badge}</span>
                        <button
                          onClick={() => triggerToast(`Opening the ${template.title} generator.`)}
                          className="text-xs font-semibold text-gray-900 hover:text-[#b89d5f] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Use template</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#b89d5f]">Employment & Contractors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employmentTemplates.map((template) => (
                    <div key={template.id} className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{template.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="bg-[#e2ede6] text-[#1e4836] text-xs font-medium px-2.5 py-1 rounded-full">{template.badge}</span>
                        <button
                          onClick={() => triggerToast(`Opening the ${template.title} generator.`)}
                          className="text-xs font-semibold text-gray-900 hover:text-[#b89d5f] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Use template</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#b89d5f]">Fundraising</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fundraisingTemplates.map((template) => (
                    <div key={template.id} className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{template.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="bg-[#e2ede6] text-[#1e4836] text-xs font-medium px-2.5 py-1 rounded-full">{template.badge}</span>
                        <button
                          onClick={() => triggerToast(`Opening the ${template.title} generator.`)}
                          className="text-xs font-semibold text-gray-900 hover:text-[#b89d5f] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Use template</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#b89d5f]">IP Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ipAssignmentTemplates.map((template) => (
                    <div key={template.id} className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{template.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="bg-[#e2ede6] text-[#1e4836] text-xs font-medium px-2.5 py-1 rounded-full">{template.badge}</span>
                        <button
                          onClick={() => triggerToast(`Opening the ${template.title} generator.`)}
                          className="text-xs font-semibold text-gray-900 hover:text-[#b89d5f] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Use template</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. CONTRACT REVIEW TAB VIEW */}
          {activeNavTab === "Contract review" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-3xl font-serif font-semibold text-gray-900">Contractor agreement, review</h1>
                <span className="text-sm font-semibold text-red-700">3 findings · 1 high risk</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs min-h-[460px] flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
                    <div className="h-3 bg-gray-50 rounded-md w-full"></div>
                    <div className="h-3 bg-gray-50 rounded-md w-5/6"></div>
                    <div className="h-3 bg-red-100/70 border border-red-200 rounded-md w-full"></div>
                    <div className="h-3 bg-gray-50 rounded-md w-4/5"></div>
                    <div className="h-3 bg-amber-100/60 border border-amber-200 rounded-md w-2/3"></div>
                    <div className="h-3 bg-gray-50 rounded-md w-full"></div>
                    <div className="h-3 bg-gray-50 rounded-md w-11/12"></div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-md">High risk</span>
                      <span className="text-xs text-gray-400 font-medium">Clause 8.2</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      This non-compete is 5 years and worldwide, far beyond typical enforceable scope. Narrow it to your market and 12 months.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-md">Caution</span>
                      <span className="text-xs text-gray-400 font-medium">Clause 4.1</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      Payment terms are net-60. For a small vendor that is a long float, consider net-30.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-md">FYI</span>
                      <span className="text-xs text-gray-400 font-medium">Clause 11</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      Governing law is set to Lagos State. Standard and fine for your setup.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSendToAdvisor}
                      className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center"
                    >
                      Send to my legal advisor
                    </button>
                    <button
                      onClick={handleAcceptAndContinue}
                      className="flex-1 bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center"
                    >
                      Accept & continue
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 italic mt-2">
                    This is AI-assisted guidance, not professional legal advice. For anything non-standard, involve a licensed professional, you can find one in the Marketplace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. IP TRACKER TAB VIEW */}
          {activeNavTab === "IP tracker" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-serif font-semibold text-gray-900">IP tracker</h1>
                <button
                  onClick={handleAddAsset}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>+ Add asset</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6">Name</th>
                        <th className="py-4 px-6">Jurisdiction</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {ipAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-6 text-gray-800 font-medium">{asset.type}</td>
                          <td className="py-4 px-6 text-gray-900 font-semibold">{asset.name}</td>
                          <td className="py-4 px-6 text-gray-600">{asset.jurisdiction}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${asset.statusBg}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-600 font-medium">{asset.renewal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. COMPLIANCE TAB VIEW (Matches Image 5efb5e.png) */}
          {activeNavTab === "Compliance" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <h1 className="text-3xl font-serif font-semibold text-gray-900">Compliance calendar</h1>

              {/* Overdue alert banner */}
              <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3">
                <span>1 filing overdue. These carry penalties, handle it first.</span>
              </div>

              {/* Compliance Table */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="py-4 px-6">Filing</th>
                        <th className="py-4 px-6">Authority</th>
                        <th className="py-4 px-6">Due</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {complianceItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-6 text-gray-900 font-semibold">{item.filing}</td>
                          <td className="py-4 px-6 text-gray-600">{item.authority}</td>
                          <td className={`py-4 px-6 font-medium ${item.dueColor}`}>{item.due}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${item.statusBg}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. ADVISOR REQUESTS TAB VIEW */}
          {activeNavTab === "Advisor requests" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-serif font-semibold text-gray-900">Legal advisor requests</h1>
                <button
                  onClick={handleNewRequestButton}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>+ New request</span>
                </button>
              </div>

              <div className="space-y-3">
                {advisorRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0e271f] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        TN
                      </div>
                      <div>
                        <h4 className="font-semibold text-base text-gray-900">{req.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{req.subtitle}</p>
                      </div>
                    </div>

                    <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${req.statusBg}`}>
                      {req.status}
                    </span>
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