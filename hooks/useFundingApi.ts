import { useState } from "react";

export type InvestorStage = 'Research' | 'Outreach' | 'Meeting' | 'Diligence' | 'Term Sheet' | 'Committed' | 'Passed';
export type SecurityType = 'Common' | 'Preferred' | 'SAFE' | 'Note' | 'Option';
export type GrantStatus = 'Draft' | 'Submitted' | 'Won' | 'Lost';

export interface InvestorDeal {
  id: string;
  name: string;
  firm: string;
  type: 'Angel' | 'VC' | 'Syndicate';
  stage: InvestorStage;
  checkRange: string;
  isWarm: boolean;
  lastTouch: string;
  nextStep: string;
  thesisNotes?: string;
}

export interface CapTableEntry {
  id: string;
  holder: string;
  security: SecurityType;
  shares: number;
  ownershipPct: number;
  vesting: string;
}

export interface GrantMatch {
  id: string;
  name: string;
  funder: string;
  amount: string;
  deadline: string;
  fitScore: number;
  fitReason: string;
}

export function useFundingApi() {
  const [pipeline, setPipeline] = useState<InvestorDeal[]>([
    {
      id: "inv-1",
      name: "Tayo Akinyemi",
      firm: "Nordic Seed",
      type: "VC",
      stage: "Research",
      checkRange: "$100k - $250k",
      isWarm: false,
      lastTouch: "N/A",
      nextStep: "Find intro",
      thesisNotes: "Invests in early-stage fintech in emerging markets."
    },
    {
      id: "inv-2",
      name: "Amara Chukwuma",
      firm: "GreenLight VC",
      type: "VC",
      stage: "Outreach",
      checkRange: "$50k - $150k",
      isWarm: false,
      lastTouch: "2 days ago",
      nextStep: "Send deck",
    },
    {
      id: "inv-3",
      name: "Sarah Jones",
      firm: "Sahel Fund",
      type: "Syndicate",
      stage: "Meeting",
      checkRange: "$150k - $300k",
      isWarm: true,
      lastTouch: "Yesterday",
      nextStep: "Partner call Tue",
    },
    {
      id: "inv-4",
      name: "David Smith",
      firm: "Adia Holdings",
      type: "Angel",
      stage: "Diligence",
      checkRange: "$50k",
      isWarm: true,
      lastTouch: "Today",
      nextStep: "Send data room",
    },
    {
      id: "inv-5",
      name: "Chijioke Obi",
      firm: "Ventures for Africa",
      type: "VC",
      stage: "Term Sheet",
      checkRange: "$200k",
      isWarm: true,
      lastTouch: "1 hour ago",
      nextStep: "Review terms",
    }
  ]);

  const [capTable] = useState<CapTableEntry[]>([
    { id: "cap-1", holder: "Founders", security: "Common", shares: 7000000, ownershipPct: 70, vesting: "4-year" },
    { id: "cap-2", holder: "Option Pool", security: "Option", shares: 1800000, ownershipPct: 18, vesting: "N/A" },
    { id: "cap-3", holder: "Kola Angels", security: "SAFE", shares: 1200000, ownershipPct: 12, vesting: "Fully vested" }
  ]);

  const [grantMatches, setGrantMatches] = useState<GrantMatch[]>([
    {
      id: "grant-1",
      name: "Digital Inclusion Fund",
      funder: "GIZ",
      amount: "₦5M",
      deadline: "closes Aug 30",
      fitScore: 92,
      fitReason: "Strong alignment with their goal to digitize informal markets."
    },
    {
      id: "grant-2",
      name: "Fintech for Good",
      funder: "MasterCard Foundation",
      amount: "₦8M",
      deadline: "closes Sep 15",
      fitScore: 84,
      fitReason: "Direct fit for your financial literacy curriculum."
    }
  ]);

  const updatePipelineStage = (id: string, stage: InvestorStage) => {
    setPipeline(prev => prev.map(inv => inv.id === id ? { ...inv, stage } : inv));
  };

  const removeGrantMatch = (id: string) => {
    setGrantMatches(prev => prev.filter(g => g.id !== id));
  };

  return {
    pipeline,
    capTable,
    grantMatches,
    updatePipelineStage,
    removeGrantMatch
  };
}
