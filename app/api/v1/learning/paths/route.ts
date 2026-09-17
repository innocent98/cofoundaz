import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "p1", title: "Idea to First 10 Customers", enrolled: true },
      { id: "p2", title: "Fundraising Prep", enrolled: false }
    ],
    meta: { status: 200, message: "Success" }
  });
}
