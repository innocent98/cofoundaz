import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      id: "usr_local_test_123",
      email: "founder@cofoundaz.com",
      full_name: "Founder",
      workspace_id: "ws_local_test_123",
      role: "founder",
      created_at: new Date().toISOString()
    },
    meta: null
  });
}