import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  await new Promise(r => setTimeout(r, 400));
  
  return NextResponse.json({
    success: true,
    message: `Memory fact ${resolvedParams.id} forgotten`,
  });
}
