import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    data: {
      id,
      score: 92,
      feedback: "Great job! Your answers indicate strong market readiness."
    },
    meta: { status: 200, message: "Submitted Successfully" }
  });
}
