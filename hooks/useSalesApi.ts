import { useState, useCallback } from 'react';

// Sequences and the AI Coach are not built yet (slices B and C): their pages still read this
// seeded state. Pipeline, Leads and Accounts moved to hooks/useSalesCrm.ts + lib/api/sales.ts.

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
  const [sequences] = useState<SequenceItem[]>(INITIAL_SEQUENCES);
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Honestly, I am not sure my riders will trust an app to hold their money. Convince me."
  ]);

  const sendMessageToCoach = useCallback((msg: string) => {
    setChatMessages(prev => [...prev, msg, "Let us try that again. Why should I care about this?"]);
  }, []);

  return {
    sequences,
    chatMessages,
    sendMessageToCoach,
  };
}
