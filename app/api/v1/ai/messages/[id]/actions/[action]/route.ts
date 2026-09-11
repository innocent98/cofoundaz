import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const resolvedParams = await params;
  
  await new Promise(r => setTimeout(r, 800));
  
  return NextResponse.json({
    success: true,
    messageId: resolvedParams.id,
    action: resolvedParams.action,
    artifactTitle: `Created artifact for ${resolvedParams.action}`,
  });
}
