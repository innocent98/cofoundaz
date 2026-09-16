import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "sig1", document: "Founders Agreement", status: "pending" }
    ],
    meta: { status: 200, message: "Success" }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    data: { id: `sig${Date.now()}`, status: "sent" },
    meta: { status: 201, message: "Signature Request Sent" }
  });
}
