import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    data: { success: true },
    meta: { status: 200, message: "All Read" }
  });
}
