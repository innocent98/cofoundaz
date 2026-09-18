import { NextRequest, NextResponse } from 'next/server';

const milestones = [
  { id: "ms1", title: "Idea Validation", status: "completed", dueDate: "2026-09-01" },
  { id: "ms2", title: "MVP Development", status: "in_progress", dueDate: "2026-10-15" },
  { id: "ms3", title: "Beta Launch", status: "todo", dueDate: "2026-11-01" }
];

export async function GET() {
  return NextResponse.json({
    data: milestones,
    meta: { status: 200, message: "Success" }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newMilestone = {
      id: `ms${Date.now()}`,
      ...body,
      status: body.status || "todo"
    };
    milestones.push(newMilestone);
    return NextResponse.json({
      data: newMilestone,
      meta: { status: 201, message: "Created" }
    });
  } catch {
    return NextResponse.json({ meta: { status: 400, message: "Bad Request" } }, { status: 400 });
  }
}
