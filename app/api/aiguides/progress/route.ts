import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { aiguidesProgress } from '@/lib/db/schema';
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
  const guideId = req.nextUrl.searchParams.get('guideId');
  if (!guideId) {
    return NextResponse.json({ error: 'Missing guideId' }, { status: 400 });
  }
  try {
    // Convert guideId to valid UUID for consistency with complete endpoint
    const validGuideId = ensureUuid(guideId);
    
    const records = await db.query.aiguidesProgress.findMany({
      where: and(
        eq(aiguidesProgress.userId, user.id),
        eq(aiguidesProgress.guideId, validGuideId)
      ),
      columns: {
        documentId: true
      }
    });
    const docs = records.map(r => r.documentId);
    return NextResponse.json({ docs });
  } catch (error) {
    console.error('Error fetching guide progress:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 