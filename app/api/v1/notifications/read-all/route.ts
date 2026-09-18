import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: { success: true },
    meta: { status: 200, message: "All Read" }
  });
}
