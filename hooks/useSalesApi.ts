import { useState, useCallback } from 'react';

export type DealStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type LostReason = 'Price' | 'Timing' | 'Competitor' | 'No budget' | 'Ghosted' | 'Other';

export interface Deal {
  id: string;
  company: string;
  contactName: string;
  value: number;
  stage: DealStage;
  nextStep: string;
  nextStepDue: string;
  isOverdue?: boolean;
  isStalled?: boolean;
  daysInactive: number;
  closedReason?: LostReason;
}

export interface LeadItem {
  id: string;
  name: string;
  company: string;
  source: string;
  status: string;
}

export interface AccountActivity {
  text: string;
  time: string;
}

export interface AccountItem {
  id: string;
  name: string;
  description: string;
  openDealsCount: number;
  openDealsText: string;
  lifetimeValue: string;
  activities: AccountActivity[];
}

export interface SequenceStep {
  stepNumber: number;
  waitText: string;
  subject: string;
  description: string;
}

export interface SequenceItem {
  id: string;
  name: string;
  stats: string;
  steps: SequenceStep[];
  footerNote: string;
}

// MOCK DATA
const INITIAL_DEALS: Deal[] = [
  { id: 'd1', company: 'QuickCash', contactName: 'Chidi', value: 3000000, stage: 'new', nextStep: 'Qualify', nextStepDue: 'Today', daysInactive: 1 },
  { id: 'd2', company: 'RiderPay', contactName: 'Sola K.', value: 5500000, stage: 'contacted', nextStep: 'Book intro', nextStepDue: 'Tomorrow', daysInactive: 2 },
  { id: 'd3', company: 'Lagos Riders Co-op', contactName: 'Emeka O.', value: 6000000, stage: 'qualified', nextStep: 'Demo call Thu', nextStepDue: 'Thursday', daysInactive: 1 },
  { id: 'd4', company: 'MarketPlus', contactName: 'Bisi A.', value: 4200000, stage: 'qualified', nextStep: 'Send deck', nextStepDue: 'Tomorrow', daysInactive: 2 },
  { id: 'd5', company: 'BodaBoda Union', contactName: 'Tunde F.', value: 9000000, stage: 'proposal', nextStep: 'Follow up', nextStepDue: 'Yesterday', isOverdue: true, daysInactive: 4 },
  { id: 'd6', company: 'GigPay HR', contactName: 'Ada N.', value: 12000000, stage: 'negotiation', nextStep: 'Close call', nextStepDue: 'Last week', isStalled: true, daysInactive: 15 },
  { id: 'd7', company: 'Thrive SACCO', contactName: 'Olu', value: 8500000, stage: 'closed_won', nextStep: 'Onboarding', nextStepDue: 'Done', daysInactive: 2 }
];

const INITIAL_LEADS: LeadItem[] = [
  { id: 'l1', name: "Emeka O.", company: "Lagos Riders Co-op", source: "Referral", status: "New" },
  { id: 'l2', name: "Bisi A.", company: "MarketPlus", source: "WhatsApp", status: "Qualified" },
  { id: 'l3', name: "Tunde F.", company: "BodaBoda Union", source: "Event", status: "Working" },
  { id: 'l4', name: "Ada N.", company: "GigPay HR", source: "Inbound", status: "Working" },
  { id: 'l5', name: "Sola K.", company: "RiderPay", source: "Referral", status: "New" },
];

const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: "lagos-riders",
    name: "Lagos Riders Co-op",
    description: "Transport cooperative · 2,400 riders",
    openDealsCount: 1,
    openDealsText: "1 open · ₦6.0M",
    lifetimeValue: "₦6.0M",
    activities: [
      { text: "Demo scheduled for Thursday", time: "1d ago" },
      { text: "Sent one-pager", time: "4d ago" },
      { text: "Intro call completed", time: "1w ago" },
    ]
  },
  {
    id: "gigpay-hr",
    name: "GigPay HR",
    description: "HR platform · gig payroll",
    openDealsCount: 1,
    openDealsText: "1 open · ₦12.0M",
    lifetimeValue: "₦12.0M",
    activities: [
      { text: "No activity, 14 days", time: "stalled" },
      { text: "Proposal sent", time: "3w ago" },
    ]
  },
  {
    id: "thrive-sacco",
    name: "Thrive SACCO",
    description: "Savings cooperative",
    openDealsCount: 0,
    openDealsText: "0 open · ₦8.5M",
    lifetimeValue: "₦8.5M",
    activities: [
      { text: "Closed won, onboarding", time: "2d ago" },
    ]
  }
];

const INITIAL_SEQUENCES: SequenceItem[] = [
  {
    id: "new-account-outreach",
    name: "New account outreach",
    stats: "18 enrolled · 34% reply rate",
    steps: [
      {
        stepNumber: 1,
        waitText: "Wait 0 days, then send",
        subject: "A quick idea for {{company}}",
        description: "Noticed your riders get paid daily. Here is how Kolo helps them save."
      },
      {
        stepNumber: 2,
        waitText: "Wait 3 days, then send",
        subject: "Following up, {{first_name}}",
        description: "Sharing a one-pager and a short pilot proposal."
      },
      {
        stepNumber: 3,
        waitText: "Wait 5 days, then send",
        subject: "Worth a 15-minute call?",
        description: "Happy to walk your team through a 30-day pilot."
      }
    ],
    footerNote: "Unsubscribe link is appended automatically. Sequence stops when they reply."
  }
];

export function useSalesApi() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [accounts] = useState<AccountItem[]>(INITIAL_ACCOUNTS);
  const [sequences] = useState<SequenceItem[]>(INITIAL_SEQUENCES);
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Honestly, I am not sure my riders will trust an app to hold their money. Convince me."
  ]);

  const moveDealStage = useCallback((dealId: string, newStage: DealStage, closedReason?: LostReason) => {
    setDeals(prev => prev.map(deal => 
      deal.id === dealId ? { ...deal, stage: newStage, closedReason } : deal
    ));
  }, []);

  const convertLead = useCallback((leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    // Usually we would also create a new deal here
  }, []);

  const addLead = useCallback((lead: Omit<LeadItem, 'id'>) => {
    setLeads(prev => [{ ...lead, id: `l${Date.now()}` }, ...prev]);
  }, []);

  const importLeads = useCallback((newLeads: Omit<LeadItem, 'id'>[]) => {
    const withIds = newLeads.map((l, i) => ({ ...l, id: `l${Date.now()}_${i}` }));
    setLeads(prev => [...withIds, ...prev]);
  }, []);

  const sendMessageToCoach = useCallback((msg: string) => {
    setChatMessages(prev => [...prev, msg, "Let us try that again. Why should I care about this?"]);
  }, []);

  return {
    deals,
    leads,
    accounts,
    sequences,
    chatMessages,
    moveDealStage,
    convertLead,
    addLead,
    importLeads,
    sendMessageToCoach,
  };
}
