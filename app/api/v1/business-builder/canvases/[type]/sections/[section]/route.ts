import { NextRequest, NextResponse } from 'next/server';

function buildResponse(section: string) {
  return {
    data: {
      section,
      items: ["Identified core founder bottlenecks", "Integrated roadmap & finance tracking"]
    },
    meta: { status: 200 }
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ type: string; section: string }> }) {
  const { section } = await context.params;
  return NextResponse.json(buildResponse(section));
}

export async function POST(request: NextRequest, context: { params: Promise<{ type: string; section: string }> }) {
  const { section } = await context.params;
  return NextResponse.json(buildResponse(section));
}

export async function PUT(request: NextRequest, context: { params: Promise<{ type: string; section: string }> }) {
  const { section } = await context.params;
  return NextResponse.json(buildResponse(section));
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ type: string; section: string }> }) {
  const { section } = await context.params;
  return NextResponse.json({ data: { section, deleted: true }, meta: { status: 200 } });
}
