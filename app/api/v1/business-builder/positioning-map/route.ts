import { NextRequest, NextResponse } from "next/server";

let mockPositioning = {
  x_axis_label: "Execution Speed (Slow to Rapid)",
  y_axis_label: "Operational Automation (Manual to AI-Driven)",
  competitors: [
    { name: "Traditional Spreadsheets", x: 20, y: 15, is_self: false },
    { name: "Legacy ERP Systems", x: 35, y: 60, is_self: false },
    { name: "Point SaaS Tools", x: 65, y: 45, is_self: false },
    { name: "Cofaundaz (Our Solution)", x: 88, y: 92, is_self: true }
  ]
};

export async function GET() {
  return NextResponse.json({ data: mockPositioning, meta: { status: 200 } });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  mockPositioning = { ...mockPositioning, ...body };
  return NextResponse.json({ data: mockPositioning, meta: { status: 200, message: "Positioning map updated" } });
}
