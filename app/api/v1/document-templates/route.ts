import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { id: "tpl1", name: "SAFE Note Template" },
      { id: "tpl2", name: "Advisor Agreement" },
      { id: "tpl3", name: "Mutual NDA" }
    ],
    meta: { status: 200, message: "Success" }
  });
}
