import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "mission1", title: "Launch Landing Page", status: "active", xp_reward: 100 },
      { id: "mission2", title: "First 10 Customers", status: "upcoming", xp_reward: 500 }
    ],
    meta: { status: 200, message: "Success" }
  });
}
