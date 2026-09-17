import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    data: { id, title: `Journal ${id}`, content: "..." },
    meta: { status: 200, message: "Success" }
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    data: { id, ...body },
    meta: { status: 200, message: "Updated" }
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json({
    data: { id },
    meta: { status: 200, message: "Deleted" }
  });
}
