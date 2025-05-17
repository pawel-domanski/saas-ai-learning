import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { 
  getUserChallengeProgress, 
  startChallenge, 
  completeDay 
} from '@/lib/db/queries';

// GET /api/challenges/progress?challengeId=xxx
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get challenge ID from query params
    const searchParams = request.nextUrl.searchParams;
    const challengeId = searchParams.get('challengeId');
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }
    
    // Get progress for the specified challenge
    const progress = await getUserChallengeProgress(user.id, challengeId);
    
    // If no progress exists yet, return a default
    if (!progress) {
      return NextResponse.json({
        challengeId,
        startDate: null,
        lastCompletedDay: 0,
      });
    }
    
    return NextResponse.json({
      challengeId: progress.challengeId,
      startDate: progress.startDate,
      lastCompletedDay: progress.lastCompletedDay,
    });
  } catch (error) {
    console.error('Error fetching challenge progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/challenges/progress
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body - handle both JSON and form data
    let challengeId: string;
    let action: string;
    let day: number | null = null;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data
      const body = await request.json();
      challengeId = body.challengeId;
      action = body.action;
      day = body.day;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await request.formData();
      challengeId = formData.get('challengeId') as string;
      action = formData.get('action') as string;
      const dayValue = formData.get('day');
      if (dayValue) {
        day = parseInt(dayValue as string, 10);
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }
    
    // Handle different actions
    let progress;
    
    if (action === 'start') {
      // Start the challenge
      progress = await startChallenge(user.id, challengeId);
    } else if (action === 'complete') {
      // Complete a specific day
      if (typeof day !== 'number' || day < 1) {
        return NextResponse.json({ error: 'Valid day number is required' }, { status: 400 });
      }
      
      progress = await completeDay(user.id, challengeId, day);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // If it's a form submission, redirect back to the challenge page
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Use the absolute URL format required by Next.js
      const url = new URL(`/challenges/${challengeId}`, request.nextUrl.origin);
      return NextResponse.redirect(url);
    }
    
    // Otherwise return JSON
    return NextResponse.json({
      challengeId: progress.challengeId,
      startDate: progress.startDate,
      lastCompletedDay: progress.lastCompletedDay,
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 