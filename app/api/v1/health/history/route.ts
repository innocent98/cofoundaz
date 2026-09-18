import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { date: "2026-06-01", score: 60 },
      { date: "2026-07-01", score: 70 },
      { date: "2026-08-01", score: 78 },
      { date: "2026-09-01", score: 85 }
    ],
    meta: { status: 200, message: "Success" }
  });
}
