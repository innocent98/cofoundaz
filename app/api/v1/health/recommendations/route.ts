import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { id: "rec1", priority: "high", domain: "finance", message: "Decrease monthly burn rate by 15% to extend runway." },
      { id: "rec2", priority: "medium", domain: "product", message: "Conduct 5 more user interviews to validate the new feature." }
    ],
    meta: { status: 200, message: "Success" }
  });
}
