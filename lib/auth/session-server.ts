'use server';

import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { verifyToken, signToken, SessionData } from './session';

// Server-only functions that use cookies
export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

<<<<<<< HEAD
export async function setSession(user: NewUser & { id: string }) {
=======
export async function setSession(user: NewUser) {
  // Zachowujemy ID użytkownika w oryginalnym formacie (jako UUID)
  if (user.id === undefined || user.id === null) {
    console.error('Invalid user ID in setSession:', user.id);
    throw new Error(`Cannot set session: Invalid user ID: ${user.id}`);
  }
  
>>>>>>> a37cdfc8dcf78c376abf1313d41c73ac31df9c1e
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  const cookieStore = await cookies();
  cookieStore.set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// function to create session cookie
export async function createSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set('sid', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// function to clear session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('sid');
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('sid');
  return sessionCookie?.value || null;
} 