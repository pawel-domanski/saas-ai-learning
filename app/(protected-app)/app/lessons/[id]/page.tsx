import fs from 'fs';
import path from 'path';
import { notFound, redirect } from 'next/navigation';
import { Markdown } from '@/components/ui/markdown';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, ArrowRight, BookType, Book } from 'lucide-react';
import { LessonHeader } from '@/app/(protected-app)/app/lessons/[id]/lesson-header';
import { cookies } from 'next/headers';
import SlideshowClient from './slideshow-client';
import { SaveLessonView } from './save-lesson-view';

// Get training plan data from the JSON file
async function getLessonPlan() {
  const filePath = path.join(process.cwd(), 'plan.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Get part/chapter names from part.json file
async function getPartNames() {
  const filePath = path.join(process.cwd(), 'part.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  
  // Transform the array into an object where the key is the part id
  const partMap: {[key: number]: string} = {};
  data.parts.forEach((part: {id: number, name: string}) => {
    partMap[part.id] = part.name;
  });
  
  return partMap;
}

export default async function LessonPage({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fix for searchParams - await before accessing properties
  const searchParamsResolved = await Promise.resolve(searchParams);
  const limitReached = searchParamsResolved?.limitReached === 'true';
  const successMessage = searchParamsResolved?.success === 'true';

  // Convert params.id to a number - use await to ensure params is fully available
  const { id } = await Promise.resolve(params);
  const lessonId = parseInt(id);
  
  if (isNaN(lessonId)) {
    return notFound();
  }

  // Get the current user
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Get the team and check subscription
  const team = await getTeamForUser(user.id);
  if (!team) {
    redirect('/dashboard');
  }

  // Check if subscription is active or in trial period
  const hasActiveSubscription = 
    team.subscriptionStatus === 'active' || 
    team.subscriptionStatus === 'trialing';
  
  if (!hasActiveSubscription) {
    redirect('/pricing?access=premium');
  }

  // Get the lesson plan and find the lesson
  const plan = await getLessonPlan();
  const lessons = plan.data;
  
  if (lessonId < 1 || lessonId > lessons.length) {
    return notFound();
  }
  
  const lesson = lessons[lessonId - 1];
  
  // Get lesson content directly from plan.json
  const content = lesson.content;
  if (!content) {
    return notFound();
  }
  
  // Get the course part number
  const part = lesson.part || 1;
  
  // Get course part names from part.json file
  const partNames = await getPartNames();
  const partName = partNames[part] || `Part ${part}`;

  // Get information about completed lessons from cookie
  const cookieStore = await cookies();
  const completedLessonsCookie = cookieStore.get('completedLessons')?.value;
  
  console.log('Server-side completedLessons cookie:', completedLessonsCookie);

  // Temporarily disable progress tracking functionality
  // Will be re-enabled once the user_progress table is created
  let isCompleted = false;
  let completedLessons = 0;
  let percentComplete = 0;
  let completedLessonIds: number[] = [];
  
  if (completedLessonsCookie) {
    try {
      // Make sure the cookie is properly parsed - decode URI component first
      const decodedCookie = decodeURIComponent(completedLessonsCookie);
      const parsed = JSON.parse(decodedCookie);
      console.log('Parsed completedLessonIds:', parsed);
      
      // Check if we have a new format with dates or just IDs
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'object' && parsed[0].hasOwnProperty('id')) {
          // New format with dates
          completedLessonIds = parsed.map(item => item.id);
        } else {
          // Old format - just lesson numbers
          completedLessonIds = parsed;
        }
        
        isCompleted = completedLessonIds.includes(lessonId);
        completedLessons = completedLessonIds.length;
        percentComplete = Math.round((completedLessons / lessons.length) * 100);
      }
    } catch (e) {
      console.error('Error parsing completedLessons cookie:', e);
    }
  }

  // Display placeholder progress instead of trying to access the non-existent table
  const isPreviousLessonCompleted = true; // Allow marking any lesson as completed for now
  const showNextLessonButton = isCompleted && lessonId < lessons.length;
  const hasNextLesson = lessonId < lessons.length;

  // Check if the user has access to this lesson
  let isAccessAllowed = false;
  let nextAvailableLessonId = 1; // The first lesson is always available

  // Pobierz wartość LESSON_START z procesu środowiskowego
  const lessonStartEnv = process.env.LESSON_START;
  const lessonStart = lessonStartEnv ? parseInt(lessonStartEnv, 10) : 1;
  console.log('LESSON_START value (lesson page):', lessonStart);

  // Lekcja jest dostępna, jeśli:
  // 1. Została już ukończona
  // 2. Jest jedną z pierwszych LESSON_START lekcji
  // 3. Jest pierwszą nieukończoną lekcją po LESSON_START
  
  // Sprawdź, czy lekcja jest automatycznie dostępna jako jedna z pierwszych
  const isInStarterLessons = lessonId <= lessonStart;
  
  // Znajdź pierwszą nieukończoną lekcję po LESSON_START
  for (let i = 0; i < lessons.length; i++) {
    const currentLessonId = i + 1;
    if (currentLessonId > lessonStart && !completedLessonIds.includes(currentLessonId)) {
      nextAvailableLessonId = currentLessonId;
      break;
    }
  }

  // Lekcja jest dostępna jeśli: jest już ukończona, jest w startowych lekcjach, 
  // lub jest następną lekcją do ukończenia po lekcjach startowych
  isAccessAllowed = isCompleted || isInStarterLessons || lessonId === nextAvailableLessonId;

  // Just read the cookie (don't set it)
  const lastViewedLessonId = cookieStore.get('lastViewedLessonId')?.value || '1';

  if (!isAccessAllowed) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H5a3 3 0 00-3 3v8a3 3 0 003 3h10a3 3 0 003-3v-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No access to this lesson</h2>
            <p className="text-gray-600 mb-6">
              You need to complete previous lessons before you can access this one.
            </p>
            <div className="flex justify-center">
              <Button asChild className="mr-4">
                <a href={`/app/lessons/${nextAvailableLessonId}`}>
                  Go to next available lesson
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/app">
                  Return to course home
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modified component fragment that displays completion message or button
  const completionSection = () => {
    // Check if the lesson is already completed
    if (isCompleted) {
      return (
        <div className="flex items-center text-teal-600 gap-2 bg-teal-50 px-4 py-2 rounded-lg">
          <Book size={20} />
          <span className="font-medium">Lesson completed</span>
        </div>
      );
    } 
    
    // Check if this is a starter lesson (within LESSON_START)
    // Starter lessons can be completed without daily limit restrictions
    if (limitReached && lessonId <= lessonStart) {
      return (
        <form action="/api/lessons/complete" method="POST">
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="partId" value={part} />
          <div className="flex flex-col items-center gap-2">
            <Button type="submit">
              Mark as completed
            </Button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              This is a starter lesson - you can complete it without daily limits.
            </p>
          </div>
        </form>
      );
    }
    
    // Check if the daily lesson limit has been reached (for lessons beyond LESSON_START)
    if (limitReached) {
      return (
        <div className="flex flex-col items-center text-amber-600 gap-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Daily limit reached</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            You can complete only one lesson per day.<br />
            Come back tomorrow to continue learning.
          </p>
        </div>
      );
    }
    
    // Otherwise show the button to complete the lesson
    return (
      <form action="/api/lessons/complete" method="POST">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="partId" value={part} />
        <Button type="submit">
          Mark as completed
        </Button>
      </form>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Component to save view info using client-side JS */}
      <SaveLessonView lessonId={lessonId} partId={part} />
      
      <div className="mb-4 text-sm font-medium flex items-center">
        <BookType className="mr-2 text-blue-600" size={16} />
        <span className="text-blue-600">{partName}</span>
      </div>
      
      <LessonHeader 
        lessonNumber={lessonId}
        title={lesson.subject}
        isCompleted={isCompleted}
        previousLessonId={lessonId > 1 ? lessonId - 1 : null}
        nextLessonId={lessonId < lessons.length ? lessonId + 1 : null}
      />

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        {lesson.lesson ? (
          <div>
            {/* Display main content first if available */}
            {content && <Markdown>{content}</Markdown>}
            
            {/* Display sub-lessons as slides */}
            {lesson.lesson.length > 0 && (
              <div>
                {/* Import the client component for the slideshow */}
                <SlideshowClient subLessons={lesson.lesson} />
              </div>
            )}
          </div>
        ) : (
          // Display normal content if no sub-lessons
          <Markdown>{content}</Markdown>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 flex items-center gap-2">
          <Book size={20} />
          <span>Congratulations! The lesson has been marked as completed.</span>
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        {/* Previous lesson button - always visible if we're not on the first lesson */}
        {lessonId > 1 ? (
          <Button asChild variant="outline" className="flex items-center gap-2">
            <a href={`/app/lessons/${lessonId - 1}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Previous lesson
            </a>
          </Button>
        ) : (
          <div></div>
        )}

        {/* Middle element - completion button or completion information */}
        <div className="flex flex-col items-center space-y-2">
          {completionSection()}
        </div>

        {/* Next lesson button - visible only if this lesson is completed and there is a next lesson */}
        {showNextLessonButton ? (
          <Button asChild className="flex items-center gap-2">
            <a href={`/app/lessons/${lessonId + 1}`}>
              Next lesson
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>
          </Button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
} 