import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "cert1", title: "Startup Basics Certified", issue_date: "2026-05-15" }
    ],
    meta: { status: 200, message: "Success" }
  });
}
