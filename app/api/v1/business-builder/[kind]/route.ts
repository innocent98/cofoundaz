import { NextRequest, NextResponse } from 'next/server';

const store: Record<string, unknown[]> = {
  personas: [
    { id: "p1", name: "Alex the Founder", role: "CEO", primary_pain: "Time-consuming board updates" }
  ],
  roadmaps: [
    { id: "r1", title: "Launch Core MVP", quarter: "Q3 2026", status: "in_progress" }
  ]
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;
  const items = store[kind] || [
    { id: "item_1", name: `Sample ${kind} item`, status: "active", updated_at: new Date().toISOString() }
  ];
  return NextResponse.json({ data: items, meta: { status: 200 } });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;
  const body = await request.json();
  const newItem = { id: `rec_${Date.now()}`, ...body, created_at: new Date().toISOString() };
  if (!store[kind]) store[kind] = [];
  store[kind].push(newItem);
  return NextResponse.json({ data: newItem, meta: { status: 201 } });
}



