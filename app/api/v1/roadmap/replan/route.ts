import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: {
      suggestion: "Consider delaying the 'Beta Launch' by 2 weeks to prioritize core feature stability.",
      updated_milestones: [
        { id: "ms3", title: "Beta Launch", status: "todo", dueDate: "2026-11-15" }
      ]
    },
    meta: { status: 200, message: "Replanned Successfully" }
  });
}
