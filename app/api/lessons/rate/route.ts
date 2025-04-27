import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session-server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { lessonRatings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get session data
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch full user record to get username
    const dbUser = await getUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Use name if available, otherwise fallback to email
    const userName = dbUser.name || dbUser.email;
    // Extract client IP address
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.ip ||
      request.headers.get('host') ||
      '';

    const { lessonId, rating } = await request.json();
    
    if (!lessonId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Upsert the lesson rating using Drizzle ORM
    // Check if a rating already exists for this user and lesson
    const existing = await db
      .select()
      .from(lessonRatings)
      .where(
        and(
          eq(lessonRatings.userId, session.user.id),
          eq(lessonRatings.lessonId, lessonId)
        )
      );
    let result;
    if (existing.length > 0) {
      // Update existing rating
      [result] = await db
        .update(lessonRatings)
        .set({
          rating,
          userName,
          ipAddress: ip,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(lessonRatings.userId, session.user.id),
            eq(lessonRatings.lessonId, lessonId)
          )
        )
        .returning();
    } else {
      // Create a new rating
      [result] = await db
        .insert(lessonRatings)
        .values({
          userId: session.user.id,
          userName,
          ipAddress: ip,
          lessonId,
          rating,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error rating lesson:', error);
    return NextResponse.json({ error: 'Failed to rate lesson' }, { status: 500 });
  }
} 