import { useState, useCallback } from 'react';

export type AssumptionStatus = 'untested' | 'testing' | 'validated' | 'invalidated';
export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface Assumption {
  id: string;
  statement: string;
  risk: RiskLevel;
  status: AssumptionStatus;
  evidenceCount: number;
  linkedExperimentIds?: string[];
}

export interface SmokeTest {
  id: string;
  name: string;
  slug: string;
  status: 'Live' | 'Draft' | 'Ended';
  visits: number;
  signups: number;
  conversionRate: number;
  targetConversion: number;
  metricType: 'email_signup' | 'cta_click' | 'preorder_click';
}

export interface InterviewRecord {
  id: string;
  interviewee: string;
  segment: string;
  date: string;
  notes: string;
  keyQuotes: string[];
  linkedAssumptionIds: string[];
  verdict: 'Supports' | 'Contradicts' | 'Neutral';
}

export interface FeedbackTheme {
  id: string;
  theme: string;
  mentionCount: number;
  sourceCount: number;
  quotes: string[];
}

const initialAssumptions: Assumption[] = [
  {
    id: 'a1',
    statement: 'Gig workers will pay ₦500/month for automated savings',
    risk: 'High',
    status: 'untested',
    evidenceCount: 0,
  },
  {
    id: 'a2',
    statement: 'Users will trust a non-bank app with their daily income',
    risk: 'High',
    status: 'testing',
    evidenceCount: 3,
    linkedExperimentIds: ['st1'],
  },
  {
    id: 'a3',
    statement: 'Target audience has smartphones with WhatsApp',
    risk: 'Low',
    status: 'validated',
    evidenceCount: 12,
  },
  {
    id: 'a4',
    statement: 'Users want complex investment dashboards',
    risk: 'Medium',
    status: 'invalidated',
    evidenceCount: 5,
  },
];

const initialSmokeTests: SmokeTest[] = [
  {
    id: 'st1',
    name: 'Trust Landing Page MVP',
    slug: 'kolo-trust',
    status: 'Live',
    visits: 450,
    signups: 32,
    conversionRate: 7.1,
    targetConversion: 5.0,
    metricType: 'email_signup',
  },
  {
    id: 'st2',
    name: 'Premium Pricing Tier',
    slug: 'kolo-pro',
    status: 'Ended',
    visits: 1200,
    signups: 24,
    conversionRate: 2.0,
    targetConversion: 10.0,
    metricType: 'preorder_click',
  },
  {
    id: 'st3',
    name: 'WhatsApp Bot Waitlist',
    slug: 'kolo-bot',
    status: 'Draft',
    visits: 0,
    signups: 0,
    conversionRate: 0,
    targetConversion: 8.0,
    metricType: 'email_signup',
  },
];

const initialInterviews: InterviewRecord[] = [
  {
    id: 'i1',
    interviewee: 'Chidi (Okada Rider)',
    segment: 'Gig Worker',
    date: '2023-10-12',
    notes: 'Chidi mentioned he earns daily but loses track of cash. Banks are too far. He uses WhatsApp for everything.',
    keyQuotes: ['"If I could save from WhatsApp, I would do it every day."'],
    linkedAssumptionIds: ['a2', 'a3'],
    verdict: 'Supports',
  },
  {
    id: 'i2',
    interviewee: 'Funke (Market Trader)',
    segment: 'Traders',
    date: '2023-10-14',
    notes: 'Likes the idea of saving but ₦500 flat fee feels too high during slow weeks. Preferred percentage based fee.',
    keyQuotes: ['"₦500 is a lot when rain ruins the market day."'],
    linkedAssumptionIds: ['a1'],
    verdict: 'Contradicts',
  },
];

const initialFeedbackThemes: FeedbackTheme[] = [
  {
    id: 'ft1',
    theme: 'Pricing is too rigid',
    mentionCount: 8,
    sourceCount: 3,
    quotes: ['"I need flexible fees based on what I earn."', '"Flat fee scares me."'],
  },
  {
    id: 'ft2',
    theme: 'Strong desire for WhatsApp integration',
    mentionCount: 15,
    sourceCount: 5,
    quotes: ['"Just let me send a message to save."', '"I use WhatsApp more than Chrome."'],
  },
];

export function useValidationApi() {
  const [assumptions, setAssumptions] = useState<Assumption[]>(initialAssumptions);
  const [smokeTests] = useState<SmokeTest[]>(initialSmokeTests);
  const [interviews] = useState<InterviewRecord[]>(initialInterviews);
  const [feedbackThemes] = useState<FeedbackTheme[]>(initialFeedbackThemes);

  const updateAssumptionStatus = useCallback((id: string, newStatus: AssumptionStatus) => {
    setAssumptions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  }, []);

  const addAssumption = useCallback((statement: string) => {
    const newAssumption: Assumption = {
      id: `a${Date.now()}`,
      statement,
      risk: 'Medium',
      status: 'untested',
      evidenceCount: 0,
    };
    setAssumptions(prev => [...prev, newAssumption]);
  }, []);

  return {
    assumptions,
    updateAssumptionStatus,
    addAssumption,
    smokeTests,
    interviews,
    feedbackThemes,
  };
}
