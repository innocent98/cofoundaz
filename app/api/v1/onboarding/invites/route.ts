import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: {
      invites_sent: 0,
    },
    meta: null,
  });
}