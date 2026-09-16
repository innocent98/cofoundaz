import { NextRequest, NextResponse } from 'next/server';

const activities = [
  { id: "a1", type: "commit", message: "Initial push to main", timestamp: "2026-09-15T10:00:00Z" },
  { id: "a2", type: "canvas_update", message: "Updated Lean Canvas Value Proposition", timestamp: "2026-09-15T14:30:00Z" },
  { id: "a3", type: "task_completion", message: "Completed: Register Domain", timestamp: "2026-09-16T09:15:00Z" }
];

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: activities,
    meta: { status: 200, message: "Success" }
  });
}
