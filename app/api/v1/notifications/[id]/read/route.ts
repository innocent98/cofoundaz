import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ data: { id, read: true }, meta: { status: 200 } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ data: { id, read: true }, meta: { status: 200 } });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ data: { id, read: true }, meta: { status: 200 } });
}
