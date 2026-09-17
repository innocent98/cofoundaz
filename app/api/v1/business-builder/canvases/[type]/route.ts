import { NextRequest, NextResponse } from 'next/server';

const mockCanvases: Record<string, unknown> = {
  lean: {
    id: "canvas_lean_dev_123",
    type: "lean",
    workspace_id: "ws_local_test_123",
    name: "My Lean Canvas",
    data: {
      problem: ["High customer acquisition cost", "Lack of transparent market data"],
      existing_alternatives: ["Manual spreadsheets", "Agency retainers"],
      solution: ["Automated AI workflow engine", "Real-time benchmark dashboards"],
      key_metrics: ["Weekly active teams", "MRR growth rate", "Customer churn < 2%"],
      unique_value_proposition: "The end-to-end founder cockpit that replaces fragmented spreadsheets.",
      high_level_concept: "Linear meets Pitch for startup operations.",
      unfair_advantage: "Proprietary benchmark models trained on 10k+ founder outcomes.",
      channels: ["Founder communities", "Product Hunt", "Direct referrals"],
      customer_segments: ["Early-stage SaaS founders", "Pre-seed accelerators"],
      early_adopters: ["YC & Techstars batch founders building MVP"],
      cost_structure: ["Cloud infrastructure", "LLM API usage", "Team payroll"],
      revenue_streams: ["$49/mo Starter tier", "$199/mo Growth tier"]
    },
    updated_at: new Date().toISOString()
  },
  bmc: {
    id: "canvas_bmc_dev_123",
    type: "bmc",
    workspace_id: "ws_local_test_123",
    name: "Business Model Canvas",
    data: {
      key_partners: ["Cloud providers (AWS/GCP)", "Early-stage venture accelerators", "Stripe & payment processors"],
      key_activities: ["Product engineering & updates", "Community ecosystem building", "Customer success onboarding"],
      key_resources: ["Proprietary benchmark datasets", "Core engineering team", "AI orchestration pipeline"],
      value_propositions: ["Consolidated operations workspace", "Data-driven milestone prioritization", "Real-time burn & metric visibility"],
      customer_relationships: ["Self-serve onboarding", "Automated lifecycle emails", "Dedicated Slack channels"],
      channels: ["Inbound search content", "Accelerator partner perks", "Word-of-mouth referral network"],
      customer_segments: ["Seed & Series A startups", "B2B SaaS product teams", "Venture studio founders"],
      cost_structure: ["Hosting & infrastructure", "Third-party API expenses", "Team payroll"],
      revenue_streams: ["Monthly recurring subscriptions", "Annual licenses", "Add-on seats & analytics modules"]
    },
    updated_at: new Date().toISOString()
  },
  vpc: {
    id: "canvas_vpc_dev_123",
    type: "vpc",
    workspace_id: "ws_local_test_123",
    name: "Value Proposition Canvas",
    data: {
      customer_profile: {
        customer_jobs: [
          "Maintain accurate financial & roadmap reporting for investors",
          "Track feature delivery timelines across engineering",
          "Allocate runway efficiently without unexpected burn spikes"
        ],
        pains: [
          "Fragmented data scattered across 5+ disconnected SaaS tools",
          "Excessive time spent compiling manual slide decks for board updates",
          "Lack of clarity on which product metrics drive retention"
        ],
        gains: [
          "A single source of truth for founders and lead investors",
          "Instant automated status reporting in 1 click",
          "Benchmark comparisons against peers in the same vertical"
        ]
      },
      value_map: {
        products_services: [
          "Founder Cockpit Web App",
          "Automated Metric Sync Integrations",
          "Interactive Strategy & Canvas Modeler"
        ],
        pain_relievers: [
          "Eliminates duplicate manual spreadsheet maintenance",
          "Pre-built investor updates auto-populated from live workspace data",
          "Real-time alerts when burn deviates from projections"
        ],
        gain_creators: [
          "Improves investor confidence during follow-on fundraising rounds",
          "Aligns leadership and product teams around identical north-star KPIs",
          "Accelerates decision-making velocity with predictive runway simulations"
        ]
      }
    },
    updated_at: new Date().toISOString()
  }
};

mockCanvases["business-model"] = mockCanvases.bmc;
mockCanvases["value-proposition"] = mockCanvases.vpc;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;
  const canvas = mockCanvases[type] || {
    id: `canvas_${type}_dev_123`,
    type,
    workspace_id: "ws_local_test_123",
    name: `${type.toUpperCase()} Canvas`,
    data: {},
    updated_at: new Date().toISOString()
  };

  return NextResponse.json({
    data: canvas,
    meta: { status: 200 }
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;
  const body = await request.json();

  mockCanvases[type] = {
    ...(mockCanvases[type] || {}),
    ...body,
    type,
    updated_at: new Date().toISOString()
  };

  return NextResponse.json({
    data: mockCanvases[type],
    meta: { status: 200, message: "Canvas updated successfully" }
  });
}



