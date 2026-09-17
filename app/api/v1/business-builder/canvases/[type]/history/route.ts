import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;

  const versions = [
    {
      version_id: "v3",
      timestamp: new Date().toISOString(),
      author: "Samuel Olowoyo",
      change_summary: "Updated UVP and refined cost structure items"
    },
    {
      version_id: "v2",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      author: "Samuel Olowoyo",
      change_summary: "Added customer segments and initial channels"
    },
    {
      version_id: "v1",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      author: "Samuel Olowoyo",
      change_summary: "Initialized draft from template"
    }
  ];

  return NextResponse.json({
    data: {
      type,
      workspace_id: "ws_local_test_123",
      versions
    },
    meta: { status: 200 }
  });
}
