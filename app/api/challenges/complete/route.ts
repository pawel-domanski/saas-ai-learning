import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { 
  getUserChallengeProgress, 
  completeDay 
} from '@/lib/db/queries';

// POST /api/challenges/complete
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body - handle both JSON and form data
    let challengeId: string;
    let day: number;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data
      const body = await request.json();
      challengeId = body.challengeId;
      day = body.day;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await request.formData();
      challengeId = formData.get('challengeId') as string;
      const dayValue = formData.get('day');
      if (dayValue) {
        day = parseInt(dayValue as string, 10);
      } else {
        return NextResponse.json({ error: 'Day is required' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }
    
    if (typeof day !== 'number' || day < 1) {
      return NextResponse.json({ error: 'Valid day number is required' }, { status: 400 });
    }
    
    // Get current progress to check day constraints
    const currentProgress = await getUserChallengeProgress(user.id, challengeId);
    
    // Calculate how many days should be available based on start date (using calendar days)
    if (currentProgress && currentProgress.startDate) {
      const startDate = new Date(currentProgress.startDate);
      const now = new Date();
      
      // Reset hours to compare just calendar days
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      // Calculate days between dates
      const diffTime = today.getTime() - startDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If challenge started today, diffDays will be 0
      // If challenge started yesterday, diffDays will be 1, etc.
      const calendarDaysElapsed = diffDays;
      
      // Available days is startDay (1) + calendar days elapsed
      const maxAvailableDays = calendarDaysElapsed + 1;
      
      console.log('API - Start day (midnight):', startDay);
      console.log('API - Today (midnight):', today);
      console.log('API - Calendar days elapsed:', calendarDaysElapsed);
      console.log('API - Max available days:', maxAvailableDays);
      
      // Check if trying to complete a future day that's not yet available
      if (day > maxAvailableDays) {
        return NextResponse.json({ 
          error: 'This day is not yet available. New challenges are unlocked daily.' 
        }, { status: 400 });
      }
      
      // Check if trying to complete multiple days on same calendar day
      if (day > currentProgress.lastCompletedDay + 1) {
        return NextResponse.json({ 
          error: 'Please complete challenges in order, one per day.' 
        }, { status: 400 });
      }
    }
    
    // Complete the day
    const progress = await completeDay(user.id, challengeId, day);
    
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
      dayCompletionDates: progress.dayCompletionDates || {},
    });
  } catch (error) {
    console.error('Error completing challenge day:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 