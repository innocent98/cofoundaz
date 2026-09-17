import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // fallback
  }

  const prompt = body.prompt || body.query || "startup strategy";

  return NextResponse.json({
    data: {
      prompt,
      response: `Based on your startup profile, focusing on early product-led growth through specialized developer communities will deliver the lowest CAC. Prioritize shipping the core canvas roadmap before launching broad paid channels.`,
      actionable_items: [
        "Set up an open-source template repository for community lead capture",
        "Schedule 5 weekly customer discovery calls with pre-seed founders"
      ],
      timestamp: new Date().toISOString()
    },
    meta: { status: 200 }
  });
}
