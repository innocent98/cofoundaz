import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; n: string }> }
) {
  const resolvedParams = await params;
  
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json({
    success: true,
    message: `Accepted action ${resolvedParams.n} for briefing ${resolvedParams.id}`,
    // Could return the newly created task or entity
    createdTask: {
      id: `task-${Date.now()}`,
      title: 'Draft a pricing experiment',
      completed: true,
    }
  });
}
