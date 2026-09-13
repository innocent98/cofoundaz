import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    memory: [
      { id: 'mem-1', fact: 'Kolo is a mobile savings app for gig workers in West Africa.', createdAt: new Date().toISOString() },
      { id: 'mem-2', fact: 'You prefer straight, specific answers over caveats.', createdAt: new Date().toISOString() },
      { id: 'mem-3', fact: 'You are pre-seed and focused on validation this quarter.', createdAt: new Date().toISOString() },
      { id: 'mem-4', fact: 'Tayo is your legal advisor; Grace is your accountant.', createdAt: new Date().toISOString() },
    ]
  });
}

export async function DELETE() {
  await new Promise(r => setTimeout(r, 400));
  return NextResponse.json({ success: true, message: 'All memory cleared' });
}
