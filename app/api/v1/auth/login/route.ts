import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {}

  const email = body.email || "founder@cofoundaz.com";

  const user = {
    id: "usr_dev_123",
    email: email,
    first_name: "Founder",
    last_name: "User",
    full_name: "Founder",
    role: "founder",
    is_verified: true,
    status: "active",
    email_verified: true,
    current_workspace_id: "ws_local_test_123",
    workspaces: [
      {
        id: "ws_local_test_123",
        name: "Local Dev Startup",
        role: "owner"
      }
    ],
    created_at: "2026-01-01T00:00:00Z"
  };

  return NextResponse.json({
    data: {
      access_token: "dev_mock_token_123",
      token_type: "bearer",
      refresh_token: "dev_mock_refresh_123",
      expires_in: 86400,
      user,
      workspace: user.workspaces[0]
    },
    access_token: "dev_mock_token_123",
    token: "dev_mock_token_123",
    token_type: "bearer",
    user,
    meta: { status: 200, message: "Logged in successfully (Dev Mock)" }
  });
}
