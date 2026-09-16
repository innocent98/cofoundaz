import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "c1", title: "Startup Basics", progress: 100 },
      { id: "c2", title: "Fundraising 101", progress: 20 }
    ],
    meta: { status: 200, message: "Success" }
  });
}
