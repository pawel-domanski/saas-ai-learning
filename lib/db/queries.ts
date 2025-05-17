import { desc, and, eq, isNull, gte } from 'drizzle-orm';
import { db, client } from './drizzle';
import { activityLogs, teamMembers, teams, aiTools } from './schema';
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
  teamId: number | string,
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
