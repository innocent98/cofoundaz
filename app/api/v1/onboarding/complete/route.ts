import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: {
      completed: true,
      workspace_id: "ws_local_test_123",
      redirect_url: "/dashboard",
    },
    meta: null,
  });
}