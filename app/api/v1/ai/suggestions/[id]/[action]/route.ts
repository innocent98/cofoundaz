import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const resolvedParams = await params;
  
  await new Promise(r => setTimeout(r, 400));
  
  return NextResponse.json({
    success: true,
    message: `Suggestion ${resolvedParams.id} handled with action ${resolvedParams.action}`,
  });
}
