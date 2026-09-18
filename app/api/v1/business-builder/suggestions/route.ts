import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      {
        id: "sug_1",
        title: "Clarify B2B SaaS pricing tier",
        target_section: "revenue_streams",
        canvas_type: "lean",
        suggested_text: "Introduce a $299/mo Pro tier with dedicated analytics exports",
        status: "pending",
        created_at: new Date().toISOString()
      },
      {
        id: "sug_2",
        title: "Add developer community distribution channel",
        target_section: "channels",
        canvas_type: "lean",
        suggested_text: "Direct outreach through Discord and GitHub Discussions",
        status: "pending",
        created_at: new Date().toISOString()
      }
    ],
    meta: { status: 200 }
  });
}
