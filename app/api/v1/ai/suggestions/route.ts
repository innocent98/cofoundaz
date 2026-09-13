import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    suggestions: [
      {
        id: 'sugg-1',
        agentKey: 'finance',
        suggestion: 'Your runway crossed below 9 months',
        rationale: 'Revenue is flat and burn ticked up. Worth reviewing pricing and your two largest costs this week.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sugg-2',
        agentKey: 'funding',
        suggestion: 'A ₦5M grant closes in 3 weeks',
        rationale: 'It fits your stage and sector. I can pre-fill most of the application from your Business Builder.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'sugg-3',
        agentKey: 'product',
        suggestion: 'Two interviews flagged the same feature',
        rationale: 'Automated round-ups came up twice. Might be worth a small MVP task to test demand.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'sugg-4',
        agentKey: 'sales',
        suggestion: 'GigPay HR has gone quiet for 14 days',
        rationale: 'It is your largest open deal. I can draft a re-engagement note in your voice.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ]
  });
}
