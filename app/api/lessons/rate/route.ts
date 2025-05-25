import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session-server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { lessonRatings, activityLogs, ActivityType } from '@/lib/db/schema';
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get session data
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get lessonId from URL search params
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    
    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Convert lessonId to UUID format
    const validLessonId = ensureUuid(lessonId.toString());

    // Check if user has rated this lesson
    const existingRecords = await db.execute(sql`
      SELECT id, rating, comment, created_at FROM public.lesson_ratings 
      WHERE user_id = ${session.user.id} AND lesson_id = ${validLessonId}
    `);
    
    const hasRated = existingRecords && 
                     Array.isArray(existingRecords) && 
                     existingRecords.length > 0;
    
    const ratingData = hasRated ? existingRecords[0] : null;

    return NextResponse.json({ 
      hasRated,
      rating: ratingData
    });
  } catch (error) {
    console.error('Error checking lesson rating:', error);
    return NextResponse.json({ error: 'Failed to check rating' }, { status: 500 });
  }
}

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
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('host') || 
               '';

    const data = await request.json();
    const lessonId = data.lessonId;
    const rating = data.rating;
    const comment = data.comment;
    
    if (!lessonId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Convert lessonId to UUID format
    const validLessonId = ensureUuid(lessonId.toString());

    // Add column if doesn't exist using raw SQL
    try {
      await db.execute(sql`
        ALTER TABLE public.lesson_ratings 
        ADD COLUMN IF NOT EXISTS lesson_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
      `);
    } catch (err) {
      console.warn("Could not add lesson_id column, might already exist:", err);
    }

    // Use raw SQL to insert directly to avoid schema issues
    let result;
    try {
      // First check if record exists
      const existingRecords = await db.execute(sql`
        SELECT id FROM public.lesson_ratings 
        WHERE user_id = ${session.user.id} AND lesson_id = ${validLessonId}
      `);
      
      // Check if records exist
      const hasExistingRecord = existingRecords && 
                               Array.isArray(existingRecords) && 
                               existingRecords.length > 0;
      
      if (hasExistingRecord) {
        // Update existing
        result = await db.execute(sql`
          UPDATE public.lesson_ratings 
          SET rating = ${rating}, comment = ${comment}, user_name = ${userName}, ip_address = ${ip}, updated_at = NOW()
          WHERE user_id = ${session.user.id} AND lesson_id = ${validLessonId}
          RETURNING *
        `);
      } else {
        // Insert new
        result = await db.execute(sql`
          INSERT INTO public.lesson_ratings 
          (id, user_id, lesson_id, user_name, ip_address, rating, comment, created_at, updated_at)
          VALUES 
          (gen_random_uuid(), ${session.user.id}, ${validLessonId}, ${userName}, ${ip}, ${rating}, ${comment}, NOW(), NOW())
          RETURNING *
        `);
      }
    } catch (sqlError) {
      console.error("SQL Error in lesson rating:", sqlError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Log to activity_logs table using raw SQL to avoid schema issues
    try {
      // Get user's team
      const userTeam = await getTeamForUser(session.user.id);
      if (userTeam) {
        await db.execute(sql`
          INSERT INTO public.activity_logs 
          (id, team_id, user_id, action, timestamp, ip_address)
          VALUES 
          (gen_random_uuid(), ${userTeam.id}, ${session.user.id}, ${ActivityType.LESSON_RATED}, NOW(), ${ip})
        `);
      } else {
        console.log("Skipping activity log - user has no team");
        // Try to find default team
        const defaultTeam = await db.execute(sql`SELECT id FROM public.teams LIMIT 1`);
        if (defaultTeam && Array.isArray(defaultTeam) && defaultTeam.length > 0) {
          const teamId = defaultTeam[0].id;
          await db.execute(sql`
            INSERT INTO public.activity_logs 
            (id, team_id, user_id, action, timestamp, ip_address)
            VALUES 
            (gen_random_uuid(), ${teamId}, ${session.user.id}, ${ActivityType.LESSON_RATED}, NOW(), ${ip})
          `);
        }
      }
    } catch (logError) {
      console.error("Error logging activity:", logError);
    }

    // Extract data from result safely
    const resultData = result && Array.isArray(result) && result.length > 0 
      ? result[0] 
      : { id: 'unknown', rating };

    return NextResponse.json({ success: true, data: resultData });
  } catch (error) {
    console.error('Error rating lesson:', error);
    return NextResponse.json({ error: 'Failed to rate lesson' }, { status: 500 });
  }
} 