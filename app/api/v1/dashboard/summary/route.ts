import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    healthScore: 72,
    healthDelta: 4,
    missions: [
      {
        id: '1',
        title: 'Interview 3 gig workers',
        reason: 'Why: closes out your riskiest validation task.',
        completed: false,
      },
      {
        id: '2',
        title: 'Draft your pricing experiment',
        reason: 'Why: pricing moves both revenue and runway.',
        completed: false,
      },
      {
        id: '3',
        title: "Review Tayo's NDA comments",
        reason: 'Why: unblocks your first contractor.',
        completed: false,
      },
    ],
    briefing: {
      id: 'b-101',
      content: "Good news first: pipeline grew ₦9M this week and your smoke test cleared its bar. The watch item is runway, now 8.4 months and tightening. I'd spend today on pricing, it's your riskiest untested assumption and it moves both revenue and runway.",
    },
    kpis: [
      { id: 'k1', label: 'Monthly Revenue', value: '₦4.2M', delta: '+12%', isPositive: true, link: '/app/finance' },
      { id: 'k2', label: 'Runway', value: '8.4 mo', delta: '-0.2', isPositive: false, link: '/app/finance' },
      { id: 'k3', label: 'Pipeline Value', value: '₦18M', delta: '+₦9M', isPositive: true, link: '/app/sales' },
      { id: 'k4', label: 'Campaign CTR', value: '4.8%', delta: '+1.2%', isPositive: true, link: '/app/marketing' },
      { id: 'k5', label: 'Tasks This Week', value: '14', delta: '+2', isPositive: true, link: '/app/team' },
    ],
    risks: [
      { id: 'r1', description: 'Runway dropped below 9 months.', severity: 'amber', link: '/app/finance' },
      { id: 'r2', description: 'Pricing assumptions untested.', severity: 'red', link: '/app/business-builder' },
    ],
    opportunities: [
      { id: 'o1', description: 'Sahel Fund viewing data room.', link: '/app/funding' },
      { id: 'o2', description: 'New grant available in tech sector.', link: '/app/funding' },
    ]
  });
}
