export interface FormationStep {
  id: string;
  title: string;
  meta: string;
  completed: boolean;
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  badge: string;
}

export interface AdvisorRequest {
  id: string;
  title: string;
  subtitle: string;
  status: "In review" | "Returned" | "Requested";
  statusBg: string;
}

export interface IPAsset {
  id: string;
  type: string;
  name: string;
  jurisdiction: string;
  status: "Filed" | "Registered" | "Expired";
  statusBg: string;
  renewal: string;
}

export interface ComplianceItem {
  id: string;
  filing: string;
  authority: string;
  due: string;
  dueColor?: string;
  status: "Overdue" | "Due soon" | "Upcoming" | "Done";
  statusBg: string;
}

import { useState } from "react";

export function useLegalApi() {
  const [jurisdiction, setJurisdiction] = useState<string>("Nigeria");

  const [formationSteps, setFormationSteps] = useState<FormationStep[]>([
    { id: "step-1", title: "Reserve company name", meta: "CAC · est. 1 day · ₦500", completed: true },
    { id: "step-2", title: "File incorporation documents", meta: "CAC · est. 3 days · ₦20,000", completed: true },
    { id: "step-3", title: "Get Tax Identification Number", meta: "FIRS · est. 5 days", completed: false },
    { id: "step-4", title: "Open a corporate bank account", meta: "Your bank · est. 2 days", completed: false },
  ]);

  const toggleFormationStep = (id: string) => {
    setFormationSteps(prev =>
      prev.map(step => step.id === id ? { ...step, completed: !step.completed } : step)
    );
  };

  const updateJurisdiction = (newJurisdiction: string) => {
    setJurisdiction(newJurisdiction);
    if (newJurisdiction === "Delaware, USA") {
      setFormationSteps([
        { id: "step-1", title: "File Certificate of Incorporation", meta: "Delaware Sec. of State · est. 1 day", completed: true },
        { id: "step-2", title: "Obtain EIN", meta: "IRS · est. 2 days", completed: false },
        { id: "step-3", title: "Open a corporate bank account", meta: "Mercury / Brex · est. 2 days", completed: false },
      ]);
    } else {
      setFormationSteps([
        { id: "step-1", title: "Reserve company name", meta: "Local registry · est. 1 day", completed: true },
        { id: "step-2", title: "File incorporation documents", meta: "Local registry · est. 3 days", completed: true },
        { id: "step-3", title: "Get Tax Identification Number", meta: "Tax Auth · est. 5 days", completed: false },
        { id: "step-4", title: "Open a corporate bank account", meta: "Your bank · est. 2 days", completed: false },
      ]);
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

  const [advisorRequests, setAdvisorRequests] = useState<AdvisorRequest[]>([
    { id: "req-1", title: "Review contractor non-compete", subtitle: "Contractor agreement · Tayo N.", status: "In review", statusBg: "bg-[#f5efe6] text-[#8A5330]" },
    { id: "req-2", title: "SAFE terms sanity check", subtitle: "SAFE draft · Tayo N.", status: "Returned", statusBg: "bg-[#e2ede6] text-[#1e4836]" },
    { id: "req-3", title: "Trademark filing question", subtitle: "TM application · Tayo N.", status: "Requested", statusBg: "bg-sage-100 text-sage-600" },
  ]);

  const addAdvisorRequest = (title: string, subtitle: string) => {
    const newReq: AdvisorRequest = {
      id: `req-${Date.now()}`,
      title,
      subtitle,
      status: "Requested",
      statusBg: "bg-sage-100 text-sage-600",
    };
    setAdvisorRequests(prev => [newReq, ...prev]);
  };

  const [ipAssets] = useState<IPAsset[]>([
    { id: "ip-1", type: "Trademark", name: "Kolo (wordmark)", jurisdiction: "Nigeria", status: "Filed", statusBg: "bg-[#f5efe6] text-[#8A5330]", renewal: "Renews 2034" },
    { id: "ip-2", type: "Domain", name: "kolo.africa", jurisdiction: "Global", status: "Registered", statusBg: "bg-[#e2ede6] text-[#1e4836]", renewal: "Renews Feb 2027" },
    { id: "ip-3", type: "Copyright", name: "App source code", jurisdiction: "Nigeria", status: "Registered", statusBg: "bg-[#e2ede6] text-[#1e4836]", renewal: "No renewal" },
    { id: "ip-4", type: "Trademark", name: "Logo mark", jurisdiction: "Nigeria", status: "Expired", statusBg: "bg-red-100 text-red-700", renewal: "Renew now" },
  ]);

  const [complianceItems] = useState<ComplianceItem[]>([
    { id: "comp-1", filing: "VAT filing", authority: "FIRS", due: "Was due Jul 10", dueColor: "text-red-700", status: "Overdue", statusBg: "bg-red-100 text-red-700" },
    { id: "comp-2", filing: "Annual return", authority: "CAC", due: "in 9 days", dueColor: "text-copper-700", status: "Due soon", statusBg: "bg-copper-100 text-copper-800" },
    { id: "comp-3", filing: "PAYE remittance", authority: "State IRS", due: "Aug 10", dueColor: "text-sage-600", status: "Upcoming", statusBg: "bg-copper-100/60 text-copper-900" },
    { id: "comp-4", filing: "Pension remittance", authority: "PenCom", due: "Jun 30", dueColor: "text-sage-600", status: "Done", statusBg: "bg-green-100 text-green-800" },
  ]);

  return {
    jurisdiction,
    updateJurisdiction,
    formationSteps,
    toggleFormationStep,
    ndaTemplates,
    employmentTemplates,
    fundraisingTemplates,
    ipAssignmentTemplates,
    advisorRequests,
    addAdvisorRequest,
    ipAssets,
    complianceItems
  };
}
