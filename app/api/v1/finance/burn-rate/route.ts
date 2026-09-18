import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: { monthly_burn: 10000 },
    meta: { status: 200, message: "Success" }
  });
}
