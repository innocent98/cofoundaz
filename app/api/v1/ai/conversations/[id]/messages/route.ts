import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return NextResponse.json({
    messages: [
      {
        id: 'msg-1',
        conversationId: resolvedParams.id,
        role: 'assistant',
        agentKey: 'cofounder',
        content: 'Hi there! I know your startup. Ask me anything, and I\'ll bring in the right specialist.',
        createdAt: new Date().toISOString(),
      }
    ]
  });
}

export async function POST(request: Request) {
  
  // Create a ReadableStream to simulate Server-Sent Events (SSE)
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const simulateStream = async (text: string, agentKey: string) => {
        // Send initial metadata
        const metadata = JSON.stringify({ agentKey });
        controller.enqueue(encoder.encode(`data: ${metadata}\n\n`));
        
        const chunks = text.split(' ');
        for (let i = 0; i < chunks.length; i++) {
          await new Promise(r => setTimeout(r, 50)); // simulate network delay
          const data = JSON.stringify({ text: chunks[i] + (i === chunks.length - 1 ? '' : ' ') });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        
        // Send reasoning summary and actions
        const extraData = JSON.stringify({
          reasoningSummary: 'Analyzed your burn rate and recent revenue metrics to conclude that pricing is the highest leverage lever right now.',
          actionChips: [
            { id: 'chip-1', label: 'Draft a pricing experiment', action: 'draft_pricing' },
            { id: 'chip-2', label: 'Model a 15% price increase', action: 'model_pricing' }
          ]
        });
        controller.enqueue(encoder.encode(`data: ${extraData}\n\n`));
        
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      };
      
      const formData = await request.formData();
      const userText = formData.get('content')?.toString() || '';
      
      let agentKey = 'cofounder';
      let responseText = `I heard you say: "${userText}". Let me think about that.`;
      
      if (userText.toLowerCase().includes('runway') || userText.toLowerCase().includes('burn')) {
        agentKey = 'finance';
        responseText = 'You have about 8.4 months at your current net burn of ₦4.9M a month. That is workable, but revenue has been flat for two months, so the trend is what I would act on. Two levers move it fastest: pricing, and your two largest variable costs. I would test a price change before cutting anything, since your smoke test suggests room.';
      } else if (userText.toLowerCase().includes('contract') || userText.toLowerCase().includes('nda')) {
        agentKey = 'legal';
        responseText = 'I can help with that. Attached is a standard mutual NDA that protects your IP while allowing for open discussions with contractors.';
      }
      
      simulateStream(responseText, agentKey);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
