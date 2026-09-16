import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    data: {
      id,
      title: `Assessment ${id}`,
      sections: [
        {
          title: "General Knowledge",
          questions: [
            { id: "q1", text: "What is your primary target market?" },
            { id: "q2", text: "Who are your main competitors?" }
          ]
        }
      ]
    },
    meta: { status: 200, message: "Success" }
  });
}
