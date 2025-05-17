<<<<<<< HEAD
import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, userProgress, users, prompts, aiguidesProgress, aiopProgress, aiTools, challengeProgress } from './schema';
=======
import { desc, and, eq, isNull, gte } from 'drizzle-orm';
import { db, client } from './drizzle';
import { activityLogs, teamMembers, teams, aiTools } from './schema';
>>>>>>> a37cdfc8dcf78c376abf1313d41c73ac31df9c1e
import { getSession } from '@/lib/auth/session-server';
import { sql } from 'drizzle-orm';

export async function getUser() {
  const sessionData = await getSession();
  if (!sessionData) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  try {
    // Używamy raw SQL aby obsłużyć UUID
    // Użycie client.unsafe zapobiega automatycznemu parametryzowaniu zapytania,
    // co pozwala na bezpośrednie wstawienie wartości do zapytania
    const unsafeQuery = `
      SELECT * FROM users
      WHERE id = '${sessionData.user.id}'
      AND deleted_at IS NULL
      LIMIT 1
    `;
    const userResults = await client.unsafe(unsafeQuery);

    if (!userResults || userResults.length === 0) {
      return null;
    }

    // Mapowanie wyników SQL na format oczekiwany przez aplikację
    const user = {
      id: userResults[0].id,
      name: userResults[0].name,
      email: userResults[0].email,
      passwordHash: userResults[0].password_hash,
      birthDate: userResults[0].birth_date,
      birthTime: userResults[0].birth_time,
      birthCity: userResults[0].birth_city,
      birthCountry: userResults[0].birth_country,
      role: userResults[0].role,
      createdAt: userResults[0].created_at,
      updatedAt: userResults[0].updated_at,
      deletedAt: userResults[0].deleted_at
    };

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
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
<<<<<<< HEAD
  teamId: string,
=======
  teamId: number | string,
>>>>>>> a37cdfc8dcf78c376abf1313d41c73ac31df9c1e
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  // Używamy raw SQL aby obsłużyć UUID
  await client`
    UPDATE teams
    SET
      stripe_subscription_id = ${subscriptionData.stripeSubscriptionId},
      stripe_product_id = ${subscriptionData.stripeProductId},
      plan_name = ${subscriptionData.planName},
      subscription_status = ${subscriptionData.subscriptionStatus},
      updated_at = NOW()
    WHERE id = ${teamId}
  `;
}

<<<<<<< HEAD
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
=======
export async function getUserWithTeam(userId: number | string) {
  // Używamy raw SQL aby obsłużyć UUID
  const results = await client`
    SELECT 
      u.*,
      tm.team_id
    FROM users u
    LEFT JOIN team_members tm ON u.id = tm.user_id
    WHERE u.id = ${userId}
    LIMIT 1
  `;
>>>>>>> a37cdfc8dcf78c376abf1313d41c73ac31df9c1e

  if (results.length === 0) {
    return null;
  }

  return {
    user: {
      id: results[0].id,
      name: results[0].name,
      email: results[0].email,
      passwordHash: results[0].password_hash,
      birthDate: results[0].birth_date,
      birthTime: results[0].birth_time,
      birthCity: results[0].birth_city,
      birthCountry: results[0].birth_country,
      role: results[0].role,
      createdAt: results[0].created_at,
      updatedAt: results[0].updated_at,
      deletedAt: results[0].deleted_at
    },
    teamId: results[0].team_id
  };
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Używamy raw SQL aby obsłużyć UUID
  const results = await client`
    SELECT 
      al.id,
      al.action,
      al.timestamp,
      al.ip_address,
      u.name AS user_name
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.user_id = ${user.id}
    ORDER BY al.timestamp DESC
    LIMIT 10
  `;

  return results.map(row => ({
    id: row.id,
    action: row.action,
    timestamp: row.timestamp,
    ipAddress: row.ip_address,
    userName: row.user_name
  }));
}

<<<<<<< HEAD
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
=======
export async function getTeamForUser(userId: number | string) {
  try {
    // Najpierw pobierz ID teamu dla użytkownika
    const teamQuery = `
      SELECT tm.team_id
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.id = '${userId}'
      LIMIT 1
    `;
    
    const teamResult = await client.unsafe(teamQuery);
>>>>>>> a37cdfc8dcf78c376abf1313d41c73ac31df9c1e
    
    if (!teamResult || teamResult.length === 0) {
      return null;
    }
    
    const teamId = teamResult[0].team_id;
    
    // Następnie pobierz dane teamu
    const teamDataQuery = `
      SELECT * FROM teams
      WHERE id = '${teamId}'
    `;
    
    const teamData = await client.unsafe(teamDataQuery);
    
    if (!teamData || teamData.length === 0) {
      return null;
    }
    
    // Na końcu pobierz członków teamu
    const teamMembersQuery = `
      SELECT 
        tm.id,
        tm.user_id,
        tm.team_id,
        tm.role,
        tm.joined_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = '${teamId}'
    `;
    
    const teamMembers = await client.unsafe(teamMembersQuery);
    
    // Mapowanie danych do oczekiwanego formatu
    const formattedTeamMembers = teamMembers.map(member => ({
      id: member.id,
      userId: member.user_id,
      teamId: member.team_id,
      role: member.role,
      joinedAt: member.joined_at,
      user: {
        id: member.user_id,
        name: member.user_name,
        email: member.user_email
      }
    }));
    
    // Mapowanie wyników SQL na format oczekiwany przez aplikację
    const result = {
      id: teamData[0].id,
      name: teamData[0].name,
      createdAt: teamData[0].created_at,
      updatedAt: teamData[0].updated_at,
      stripeCustomerId: teamData[0].stripe_customer_id,
      stripeSubscriptionId: teamData[0].stripe_subscription_id,
      stripeProductId: teamData[0].stripe_product_id,
      planName: teamData[0].plan_name,
      subscriptionStatus: teamData[0].subscription_status,
      teamMembers: formattedTeamMembers
    };

    return result;
  } catch (error) {
    console.error('Error in getTeamForUser:', error);
    return null;
  }
}

<<<<<<< HEAD
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

=======
>>>>>>> a37cdfc8dcf78c376abf1313d41c73ac31df9c1e
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

/**
 * Get challenge progress for a specific user and challenge
 */
export async function getUserChallengeProgress(userId: string, challengeId: string) {
  // Convert challenge ID to valid UUID if needed
  const validChallengeId = ensureUuid(challengeId);
  
  const result = await db
    .select()
    .from(challengeProgress)
    .where(and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, validChallengeId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Start a challenge for a user, creating a progress record with day 0 completed
 */
export async function startChallenge(userId: string, challengeId: string) {
  // Convert challenge ID to valid UUID if needed
  const validChallengeId = ensureUuid(challengeId);
  
  // Check if user already has progress for this challenge
  const existingProgress = await getUserChallengeProgress(userId, challengeId);
  
  if (existingProgress) {
    // Return existing progress record
    return existingProgress;
  }
  
  // Create new progress record
  const now = new Date();
  const result = await db
    .insert(challengeProgress)
    .values({
      userId,
      challengeId: validChallengeId,
      startDate: now,
      lastCompletedDay: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  
  return result[0];
}

/**
 * Mark a challenge day as completed
 */
export async function completeDay(userId: string, challengeId: string, day: number) {
  // Convert challenge ID to valid UUID if needed
  const validChallengeId = ensureUuid(challengeId);
  
  // Get current progress
  const existingProgress = await getUserChallengeProgress(userId, challengeId);
  
  if (!existingProgress) {
    // Start the challenge if it's not started yet
    const newProgress = await startChallenge(userId, challengeId);
    
    // Only update if the day is greater than the current last completed day
    if (day > newProgress.lastCompletedDay) {
      const result = await db
        .update(challengeProgress)
        .set({
          lastCompletedDay: day,
          updatedAt: new Date(),
        })
        .where(and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, validChallengeId)
        ))
        .returning();
      
      return result[0];
    }
    
    return newProgress;
  }
  
  // Only update if the day is greater than the current last completed day
  if (day > existingProgress.lastCompletedDay) {
    const result = await db
      .update(challengeProgress)
      .set({
        lastCompletedDay: day,
        updatedAt: new Date(),
      })
      .where(and(
        eq(challengeProgress.userId, userId),
        eq(challengeProgress.challengeId, validChallengeId)
      ))
      .returning();
    
    return result[0];
  }
  
  return existingProgress;
}

/**
 * Get all challenges that a user has started
 */
export async function getUserChallenges(userId: string) {
  return await db
    .select()
    .from(challengeProgress)
    .where(eq(challengeProgress.userId, userId))
    .orderBy(challengeProgress.startDate);
}
