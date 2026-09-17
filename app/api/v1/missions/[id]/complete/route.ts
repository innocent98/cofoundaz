import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    data: { id, status: "completed", xp_earned: 100 },
    meta: { status: 200, message: "Mission Completed" }
  });
}
