import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: { months_remaining: 12, cash_balance: 120000 },
    meta: { status: 200, message: "Success" }
  });
}
