import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({
    data: { id, key: "target_market", value: "B2B SaaS Founders", category: "market", updated_at: new Date().toISOString() },
    meta: { status: 200 }
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ data: { id, updated: true }, meta: { status: 200 } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ data: { id, deleted: true }, meta: { status: 200 } });
}
