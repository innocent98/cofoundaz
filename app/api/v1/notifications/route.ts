import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: "n1", title: "New Message", read: false, timestamp: "2026-09-16T07:00:00Z" },
      { id: "n2", title: "Task Overdue", read: true, timestamp: "2026-09-15T09:00:00Z" }
    ],
    meta: { status: 200, message: "Success" }
  });
}
