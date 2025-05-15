import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { aiguidesProgress } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const guideId = formData.get('guideId') as string;
  const documentId = parseInt(formData.get('documentId') as string, 10);
  if (!guideId || isNaN(documentId)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  try {
    await db.insert(aiguidesProgress).values({
      userId: user.id,
      guideId,
      documentId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving guide progress:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 