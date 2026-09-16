import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [],
    meta: { status: 200, message: "Success" }
  });
}
