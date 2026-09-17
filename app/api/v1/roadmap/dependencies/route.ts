import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      nodes: [
        { id: "t1", label: "Define User Personas" },
        { id: "t2", label: "Design Landing Page" },
        { id: "t3", label: "Setup Database" }
      ],
      edges: [
        { source: "t1", target: "t2" }
      ]
    },
    meta: { status: 200, message: "Success" }
  });
}
