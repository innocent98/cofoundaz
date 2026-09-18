import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      startup_readiness_score: 72,
      active_milestones: 4,
      team_velocity: 12, // e.g. tasks per week
      burn_rate_summary: {
        monthly_burn: 5000,
        runway_months: 8
      },
      recent_achievements: [
        "Completed Customer Discovery Phase",
        "Registered C-Corp"
      ]
    },
    meta: { status: 200, message: "Success" }
  });
}
