import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "assessment1", title: "Founder Compatibility", status: "completed" },
      { id: "assessment2", title: "Market Readiness", status: "available" }
    ],
    meta: { status: 200, message: "Success" }
  });
}
