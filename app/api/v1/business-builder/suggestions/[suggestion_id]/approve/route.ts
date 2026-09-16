import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ suggestion_id: string }> }
) {
  const { suggestion_id } = await context.params;
  return NextResponse.json({
    data: { id: suggestion_id, status: "approved", updated_at: new Date().toISOString() },
    meta: { status: 200, message: "Suggestion approved and applied" }
  });
}
