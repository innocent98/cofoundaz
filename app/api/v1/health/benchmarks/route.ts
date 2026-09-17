import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      cohort_average: 65,
      percentile: 85,
      industry_comparison: {
        product: "+15%",
        market: "+5%",
        finance: "-10%",
        team: "+20%",
        legal: "0%"
      }
    },
    meta: { status: 200, message: "Success" }
  });
}
