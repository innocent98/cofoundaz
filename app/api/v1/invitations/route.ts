import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "inv1", email: "test@example.com", status: "pending", role: "co_founder" }
    ],
    meta: { status: 200, message: "Success" }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    data: { id: `inv${Date.now()}`, status: "sent", ...body },
    meta: { status: 201, message: "Invitation Sent" }
  });
}
