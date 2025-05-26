import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { aiopProgress } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// Helper function to convert numeric or string IDs to a valid UUID format
function ensureUuid(id: string): string {
  // Check if the ID is already a valid UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(id)) {
    return id;
  }

  // If it's a simple number/string, convert it to a valid UUID format
  return `00000000-0000-0000-0000-${id.padStart(12, '0')}`;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const aiopId = req.nextUrl.searchParams.get('aiopId');
  if (!aiopId) {
    return NextResponse.json({ error: 'Missing aiopId' }, { status: 400 });
  }
  try {
    // Convert aiopId to valid UUID for consistency with complete endpoint
    const validAiopId = ensureUuid(aiopId);
    
    const records = await db.query.aiopProgress.findMany({
      where: and(
        eq(aiopProgress.userId, user.id),
        eq(aiopProgress.aiopId, validAiopId)
      ),
      columns: { documentId: true }
    });
    const docs = records.map(r => r.documentId);
    return NextResponse.json({ docs });
  } catch (error) {
    console.error('Error fetching AI-Op progress:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 