import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { id: "sig1", document: "Founders Agreement", status: "pending" }
    ],
    meta: { status: 200, message: "Success" }
  });
}

export async function POST() {
  return NextResponse.json({
    data: { id: `sig${Date.now()}`, status: "sent" },
    meta: { status: 201, message: "Signature Request Sent" }
  });
}
