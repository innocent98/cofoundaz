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
    // Body optional
  }

  const section = body.section;

  // Mock AI generated content tailored per canvas type
  const generatedData: Record<string, any> = {
    lean: {
      problem: [
        "High customer acquisition costs across standard paid channels",
        "Fragmented operational tooling leading to disjointed investor updates",
        "Lack of real-time benchmark metrics for pre-seed teams"
      ],
      solution: [
        "Automated intelligence engine that synthesizes team operations",
        "Single-click investor reporting and continuous metric monitoring"
      ],
      unique_value_proposition: "The automated operations copilot for early-stage founders.",
      channels: ["Direct developer communities", "Strategic accelerator partnerships"],
      customer_segments: ["Early-stage SaaS founders", "Venture-backed builders"]
    },
    bmc: {
      key_activities: ["Algorithmic optimization", "Community building", "Developer advocacy"],
      key_resources: ["Proprietary founder datasets", "Core engineering infrastructure"],
      value_propositions: ["Unified operating system for scaling tech companies"]
    },
    vpc: {
      customer_profile: {
        customer_jobs: ["Streamline investor relations", "Track sprint velocity accurately"],
        pains: ["Siloed data across multiple disconnected dashboards"],
        gains: ["Real-time visibility into burn rate and runway projections"]
      }
    }
  };

  const canvasResult = generatedData[type] || {
    recommendation: `AI recommendations generated for ${type}`
  };

  // If a specific section was targeted, return only that section's payload
  const result = section && canvasResult[section] ? { [section]: canvasResult[section] } : canvasResult;

  return NextResponse.json({
    data: {
      type,
      section: section || "all",
      suggested_data: result,
      confidence: 0.96,
      created_at: new Date().toISOString()
    },
    meta: { status: 200, message: "AI fill generated successfully" }
  });
}
