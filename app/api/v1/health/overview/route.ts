import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      overall_score: 85,
      breakdown: {
        product: 90,
        market: 80,
        finance: 75,
        team: 100,
        legal: 80
      }
    },
    meta: { status: 200, message: "Success" }
  });
}
