import { useState } from 'react';

// Sequences are not built yet (slice B waits on the outreach mail host): that page still reads this
// seeded state. Pipeline, Leads, Accounts, the AI Coach and Analytics use hooks/useSalesCrm.ts,
// hooks/useSalesCoach.ts and lib/api/sales.ts.

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

  return { sequences };
}
