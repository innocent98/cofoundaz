import { NextRequest, NextResponse } from "next/server";

let onboardingState = {
  step: 1,
  completed: false,
  profile: {
    first_name: "Samuel",
    last_name: "Olowoyo",
    role: "Founder",
  },
  startup: {
    name: "Acme Innovations",
    description: "AI-driven platform for founders.",
    website: "https://example.com",
  },
  business_model: "B2B SaaS",
  stage: "Seed",
  goals: ["fundraising", "hiring"],
  logo_url: null,
};

export async function GET() {
  return NextResponse.json({
    data: onboardingState,
    meta: null,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    onboardingState = {
      ...onboardingState,
      ...body,
    };
    return NextResponse.json({
      data: onboardingState,
      meta: null,
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid payload" } },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}