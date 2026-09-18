import { NextRequest, NextResponse } from "next/server";

const journalEntries = [
  { id: "j1", title: "Day 1", content: "Started the company.", date: "2026-01-01" },
  { id: "j2", title: "First Customer", content: "We got our first paying user!", date: "2026-03-15" }
];

export async function GET() {
  return NextResponse.json({
    data: journalEntries,
    meta: { status: 200, message: "Success" }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const newEntry = { id: `j${Date.now()}`, ...body, date: new Date().toISOString() };
  journalEntries.push(newEntry);
  return NextResponse.json({
    data: newEntry,
    meta: { status: 201, message: "Created" }
  });
}
