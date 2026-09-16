import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      widgets: [
        { id: "w1", type: "metric", title: "Readiness Score", value: 72, trend: "+5%" },
        { id: "w2", type: "list", title: "Active Tasks", items: ["Finish Pitch Deck", "Interview 5 Customers"] },
        { id: "w3", type: "chart", title: "Burn Rate", dataPoints: [5000, 5200, 4800, 5100] }
      ]
    },
    meta: { status: 200, message: "Success" }
  });
}
