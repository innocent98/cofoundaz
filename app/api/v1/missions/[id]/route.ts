import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    data: {
      id,
      title: `Mission ${id}`,
      description: "Complete the following checklist items to earn your reward.",
      checklist: [
        { id: "task1", label: "Buy Domain", completed: true },
        { id: "task2", label: "Deploy App", completed: false }
      ],
      xp_reward: 100
    },
    meta: { status: 200, message: "Success" }
  });
}
