import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string; record_id: string }> }
) {
  const { kind, record_id } = await context.params;
  return NextResponse.json({
    data: { id: record_id, kind, name: `Record ${record_id}`, updated_at: new Date().toISOString() },
    meta: { status: 200 }
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ kind: string; record_id: string }> }
) {
  const { kind, record_id } = await context.params;
  const body = await request.json();
  return NextResponse.json({
    data: { id: record_id, kind, ...body, updated_at: new Date().toISOString() },
    meta: { status: 200 }
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ kind: string; record_id: string }> }
) {
  const { kind, record_id } = await context.params;
  return NextResponse.json({
    data: { success: true, id: record_id, kind },
    meta: { status: 200 }
  });
}
