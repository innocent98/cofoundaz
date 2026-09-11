import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: 'a1', actor: 'Amara Okafor', verb: 'checked off', entity: 'Interview 3 gig workers', time: new Date(Date.now() - 1000 * 60 * 15).toISOString() }, // 15 mins ago
      { id: 'a2', actor: 'Tayo', verb: 'commented on', entity: 'NDA Draft', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() }, // 5 hours ago
      { id: 'a3', actor: 'System', verb: 'generated', entity: 'Daily Briefing', time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() }, // 8 hours ago
      { id: 'a4', actor: 'Sahel Fund', verb: 'viewed', entity: 'Data Room', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }, // 1 day ago
    ]
  });
}
