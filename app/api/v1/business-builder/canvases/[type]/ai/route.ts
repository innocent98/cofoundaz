import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const section = body.section || "general";

  const suggestions: Record<string, Record<string, string[]>> = {
    lean: {
      problem: [
        "Inefficient manual handoffs between cross-functional teams",
        "Lack of standardized milestone tracking across seed cohorts"
      ],
      solution: [
        "AI-guided task routing and automatic status synchronization",
        "One-click investor digest generation directly from git commits"
      ],
      unique_value_proposition: [
        "The automated chief-of-staff for technical founding teams."
      ],
      channels: [
        "Open-source community distribution",
        "Technical founder podcasts and newsletter sponsorships"
      ]
    },
    bmc: {
      key_activities: [
        "Continuous fine-tuning of domain-specific operational models",
        "Automated compliance and SOC2 continuous auditing"
      ],
      key_resources: [
        "Proprietary benchmark graph of 5,000+ early-stage startups"
      ]
    }
  };

  const selectedSuggestions =
    suggestions[type]?.[section] || [
      `AI Suggested insight for ${type} - ${section}: Option A`,
      `AI Suggested insight for ${type} - ${section}: Option B`
    ];

  return NextResponse.json({
    data: {
      type,
      section,
      suggestions: selectedSuggestions,
      confidence_score: 0.94,
      generated_at: new Date().toISOString()
    },
    meta: { status: 200 }
  });
}
