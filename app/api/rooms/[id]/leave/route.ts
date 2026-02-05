import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { roomQueries, roomParticipantQueries } from '@/lib/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const room = roomQueries.findById.get(id);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  roomParticipantQueries.leave.run(id, session.user.id);

  return NextResponse.json({ success: true });
}
