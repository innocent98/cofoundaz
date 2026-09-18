import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      completion_percentage: 68,
      canvases: {
        lean: { status: "completed", updated_at: "2026-09-15T12:00:00Z" },
        bmc: { status: "in_progress", updated_at: "2026-09-14T10:30:00Z" },
        vpc: { status: "completed", updated_at: "2026-09-13T16:45:00Z" }
      },
      milestones: [
        { id: "m1", title: "Define Core Problem & Customer Segments", completed: true },
        { id: "m2", title: "Map Value Proposition & Differentiators", completed: true },
        { id: "m3", title: "Validate Unit Economics & Revenue Streams", completed: false }
      ],
      insights: [
        "Your unique value proposition is clearly defined for early adopters.",
        "Consider clarifying secondary acquisition channels before investor review."
      ]
    },
    meta: { status: 200 }
  });
}
