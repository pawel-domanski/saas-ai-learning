import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, userProgress, users, prompts, aiguidesProgress, aiopProgress, aiTools } from './schema';
import { getSession } from '@/lib/auth/session-server';

export async function getUser() {
  const sessionData = await getSession();
  if (!sessionData) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: string,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: string) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser(userId: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

export async function getUserLessonProgress(userId: string, lessonId: string) {
  // Convert lessonId to a valid UUID
  const validLessonId = ensureUuid(lessonId);
  
  const result = await db
    .select()
    .from(userProgress)
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.lessonId, validLessonId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getAllUserProgress(userId: string) {
  const results = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(userProgress.lessonId);
  
  // Konwertuj wszystkie IDs lekcji na poprawny format UUID przed zwróceniem
  return results.map(progress => ({
    ...progress,
    lessonId: ensureUuid(progress.lessonId)
  }));
}

export async function trackLessonAccess(userId: string, lessonId: string) {
  // Convert lessonId to a valid UUID
  const validLessonId = ensureUuid(lessonId);
  
  const existingProgress = await getUserLessonProgress(userId, lessonId);
  
  if (existingProgress) {
    // Aktualizuj istniejący rekord
    await db
      .update(userProgress)
      .set({
        lastAccessed: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.lessonId, validLessonId)
      ));
    
    return existingProgress;
  } else {
    // Utwórz nowy rekord
    const result = await db
      .insert(userProgress)
      .values({
        userId,
        lessonId: validLessonId,
        completed: false,
        lastAccessed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }
}

export async function markLessonAsCompleted(userId: string, lessonId: string) {
  // Convert lessonId to a valid UUID
  const validLessonId = ensureUuid(lessonId);
  
  const existingProgress = await getUserLessonProgress(userId, lessonId);
  
  if (existingProgress) {
    // Aktualizuj istniejący rekord
    const result = await db
      .update(userProgress)
      .set({
        completed: true,
        lastAccessed: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.lessonId, validLessonId)
      ))
      .returning();
      
    return result[0];
  } else {
    // Utwórz nowy rekord z oznaczeniem jako ukończone
    const result = await db
      .insert(userProgress)
      .values({
        userId,
        lessonId: validLessonId,
        completed: true,
        lastAccessed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }
}

export async function getUserCourseProgress(userId: string, totalLessons: number) {
  const progress = await getAllUserProgress(userId);
  
  const completedCount = progress.filter(p => p.completed).length;
  const percentComplete = Math.round((completedCount / totalLessons) * 100);
  
  return {
    totalLessons,
    completedLessons: completedCount,
    percentComplete,
    lessonProgress: progress,
  };
}

// Fetch prompt content by content_date (date string yyyy-mm-dd)
export async function getPromptByDate(contentDate: string) {
  const dateObj = new Date(contentDate);
  const result = await db
    .select()
    .from(prompts)
    .where(eq(prompts.content_date, dateObj))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// Helper function to convert numeric or string IDs to a valid UUID format
function ensureUuid(id: string): string {
  // Sprawdź, czy ID jest null lub undefined i zwróć bezpieczny format
  if (id === null || id === undefined) {
    console.warn('ensureUuid otrzymało null lub undefined jako ID');
    return '00000000-0000-0000-0000-000000000000';
  }
  
  // Dodaj logowanie
  console.log(`ensureUuid przetwarzanie: ${id}`);
  
  // Check if the ID is already a valid UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(id)) {
    console.log(`ensureUuid: ID już jest w formacie UUID: ${id}`);
    return id;
  }

  // If it's a simple number/string, convert it to a valid UUID format
  // We'll use a deterministic approach to always generate the same UUID for the same input
  const result = `00000000-0000-0000-0000-${id.padStart(12, '0')}`;
  console.log(`ensureUuid: Konwertowano ${id} na ${result}`);
  return result;
}

export async function getUserGuideProgress(userId: string, guideId: string, documentId: string) {
  // Convert IDs to valid UUIDs if they're not already
  const validGuideId = ensureUuid(guideId);
  const validDocumentId = ensureUuid(documentId);
  
  const result = await db.query.aiguidesProgress.findFirst({
    where: and(
      eq(aiguidesProgress.userId, userId),
      eq(aiguidesProgress.guideId, validGuideId),
      eq(aiguidesProgress.documentId, validDocumentId)
    )
  });
  return result || null;
}

/**
 * Fetch progress record for AI-Driven Operating Procedures document.
 */
export async function getUserAiOpProgress(userId: string, aiopId: string, documentId: string) {
  // Convert IDs to valid UUIDs if they're not already
  const validAiopId = ensureUuid(aiopId);
  const validDocumentId = ensureUuid(documentId);
  
  const result = await db.query.aiopProgress.findFirst({
    where: and(
      eq(aiopProgress.userId, userId),
      eq(aiopProgress.aiopId, validAiopId),
      eq(aiopProgress.documentId, validDocumentId)
    )
  });
  return result || null;
}

export async function getAiTools() {
  return await db.select().from(aiTools);
}

export async function getAiToolByName(name: string) {
  const result = await db
    .select()
    .from(aiTools)
    .where(eq(aiTools.name, name))
    .limit(1);

  return result[0];
}
