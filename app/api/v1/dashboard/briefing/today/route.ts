import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    id: 'b-101',
    content: "Good news first: pipeline grew ₦9M this week and your smoke test cleared its bar. The watch item is runway, now 8.4 months and tightening. I'd spend today on pricing, it's your riskiest untested assumption and it moves both revenue and runway.",
  });
}
