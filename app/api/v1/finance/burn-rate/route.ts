import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: { monthly_burn: 10000 },
    meta: { status: 200, message: "Success" }
  });
}
