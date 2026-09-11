import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.toLowerCase();
  const topic = searchParams.get('topic');

  let conversations = [
    {
      id: 'conv-1',
      title: 'Runway and pricing',
      topic: 'Finance',
      lastMessageAt: new Date().toISOString(),
      agentsInvolved: ['finance'],
    },
    {
      id: 'conv-2',
      title: 'Poke holes in my model',
      topic: 'Strategy',
      lastMessageAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      agentsInvolved: ['cofounder'],
    },
    {
      id: 'conv-3',
      title: 'NDA for a contractor',
      topic: 'Legal',
      lastMessageAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      agentsInvolved: ['legal'],
    },
    {
      id: 'conv-4',
      title: 'First 100 customers',
      topic: 'Growth',
      lastMessageAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      agentsInvolved: ['sales', 'marketing'],
    },
    {
      id: 'conv-5',
      title: 'Grant fit check',
      topic: 'Fundraising',
      lastMessageAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      agentsInvolved: ['funding'],
    },
  ];

  if (topic && topic !== 'All') {
    conversations = conversations.filter(c => c.topic === topic);
  }
  
  if (query) {
    conversations = conversations.filter(c => c.title.toLowerCase().includes(query));
  }

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    conversation: {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      topic: body.topic || 'General',
      lastMessageAt: new Date().toISOString(),
      agentsInvolved: body.agentKey ? [body.agentKey] : ['cofounder'],
    }
  });
}
