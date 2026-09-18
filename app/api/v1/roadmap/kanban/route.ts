import { NextRequest, NextResponse } from 'next/server';

let kanbanBoard = {
  columns: [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "blocked", title: "Blocked" },
    { id: "done", title: "Done" }
  ],
  tasks: [
    { id: "t1", title: "Define User Personas", columnId: "done" },
    { id: "t2", title: "Design Landing Page", columnId: "in_progress" },
    { id: "t3", title: "Setup Database", columnId: "todo" }
  ]
};

export async function GET() {
  return NextResponse.json({
    data: kanbanBoard,
    meta: { status: 200, message: "Success" }
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    kanbanBoard = body; // Replace entire board state for mock
    return NextResponse.json({
      data: kanbanBoard,
      meta: { status: 200, message: "Updated" }
    });
  } catch {
    return NextResponse.json({ meta: { status: 400, message: "Bad Request" } }, { status: 400 });
  }
}
