import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "tpl1", name: "SAFE Note Template" },
      { id: "tpl2", name: "Advisor Agreement" },
      { id: "tpl3", name: "Mutual NDA" }
    ],
    meta: { status: 200, message: "Success" }
  });
}
