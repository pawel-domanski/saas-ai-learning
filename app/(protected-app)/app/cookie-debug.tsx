'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// Interface for completed lesson
interface CompletedLesson {
  id: number;
  completedAt: string;
}

export function CookieDebug() {
  const [cookies, setCookies] = useState<string>('');
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [canCompleteToday, setCanCompleteToday] = useState<boolean>(true);
  const [lastCompletedDate, setLastCompletedDate] = useState<string>('');
  const [nextAvailableTime, setNextAvailableTime] = useState<string>('');

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Check if a specific cookie exists
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const completedLessonsCookie = getCookie('completedLessons');
    console.log('Client-side completedLessons cookie (main page):', completedLessonsCookie);
    
    if (completedLessonsCookie) {
      try {
        const parsed = JSON.parse(completedLessonsCookie);
        console.log('Parsed client-side completedLessons:', parsed);
        
        // Check if we have the new format with dates or old with just IDs
        if (Array.isArray(parsed) && parsed.length > 0) {
          let completedLessonsArray: CompletedLesson[] = [];
          
          if (typeof parsed[0] === 'object' && parsed[0].hasOwnProperty('id')) {
            // New format with dates
            completedLessonsArray = parsed;
            setCompletedLessonIds(completedLessonsArray.map(lesson => lesson.id));
          } else {
            // Old format - just IDs
            setCompletedLessonIds(parsed);
            completedLessonsArray = parsed.map((id: number) => ({
              id,
              completedAt: new Date().toISOString()
            }));
          }
          
          // Check if we can complete a lesson today
          if (completedLessonsArray.length > 0) {
            // Sort by completion date (newest first)
            const sortedLessons = [...completedLessonsArray].sort((a, b) => 
              new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            );
            
            const lastCompleted = sortedLessons[0];
            const lastCompletedDate = new Date(lastCompleted.completedAt);
            setLastCompletedDate(lastCompletedDate.toLocaleString());
            
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            
            const lastDate = new Date(lastCompletedDate);
            lastDate.setHours(0, 0, 0, 0); // Start of completion day
            
            // Check if the last lesson was completed today
            if (lastDate.getTime() === today.getTime()) {
              setCanCompleteToday(false);
              
              // Calculate time until next day
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              const hoursLeft = Math.round((tomorrow.getTime() - new Date().getTime()) / (1000 * 60 * 60));
              setNextAvailableTime(`about ${hoursLeft} hours`);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing client-side completedLessons:', e);
      }
    }
  }, []);

  // Function to reset cookie
  const resetCompletedLessonsCookie = () => {
    // Save empty cookie
    document.cookie = 'completedLessons=[]; path=/; max-age=0; SameSite=Strict';
    
    // Refresh displayed cookies
    setCookies(document.cookie);
    setCompletedLessonIds([]);
    setCanCompleteToday(true);
    setLastCompletedDate('');
    console.log('Reset completedLessons cookie');
    
    // Refresh page to see changes
    window.location.reload();
  };

  // Function to manually add a lesson to completed
  const addLessonToCookie = (lessonId: number) => {
    if (!canCompleteToday) {
      alert(`Daily limit reached. Next lesson will be available in ${nextAvailableTime}.`);
      return;
    }

    // Get current cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const completedLessonsCookie = getCookie('completedLessons');
    let completedLessons: CompletedLesson[] = [];
    
    if (completedLessonsCookie) {
      try {
        const parsed = JSON.parse(completedLessonsCookie);
        
        // Check if we have the new format with dates or old with just IDs
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].hasOwnProperty('id')) {
            // New format with dates
            completedLessons = parsed;
          } else {
            // Old format - convert
            completedLessons = parsed.map((id: number) => ({
              id,
              completedAt: new Date().toISOString()
            }));
          }
        }
      } catch (e) {
        completedLessons = [];
      }
    }
    
    // Add lesson if not already there
    const alreadyCompleted = completedLessons.some(lesson => lesson.id === lessonId);
    
    if (!alreadyCompleted) {
      completedLessons.push({
        id: lessonId,
        completedAt: new Date().toISOString()
      });
    }
    
    // Save cookie
    const value = JSON.stringify(completedLessons);
    document.cookie = `completedLessons=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`;
    
    // Refresh displayed cookies
    setCookies(document.cookie);
    setCompletedLessonIds(completedLessons.map(lesson => lesson.id));
    setCanCompleteToday(false); // After adding a lesson, you can't add another one today
    console.log('Updated completedLessons cookie:', value);
    
    // Refresh page to see changes
    window.location.reload();
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-sm font-bold mb-2">Cookie debug:</h3>
      <pre className="text-xs overflow-auto max-h-32 mb-4">{cookies}</pre>
      
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Daily limit status:</div>
        <div className={`text-sm ${canCompleteToday ? 'text-green-600' : 'text-amber-600'}`}>
          {canCompleteToday 
            ? 'You can complete a lesson today.' 
            : `Daily limit reached. Next lesson available in ${nextAvailableTime}.`}
        </div>
        {lastCompletedDate && (
          <div className="text-xs text-gray-500 mt-1">
            Last completed lesson: {lastCompletedDate}
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <Button 
          onClick={resetCompletedLessonsCookie} 
          variant="destructive" 
          size="sm" 
          className="mb-2 mr-2"
        >
          Reset all completed lessons
        </Button>
        
        <div className="text-xs text-gray-500 mb-4">
          This is a temporary solution for testing. Click to clear the list of completed lessons.
        </div>
        
        <div className="grid grid-cols-5 gap-2 mt-4">
          {[1, 2, 3, 4, 5].map((lessonId) => (
            <Button 
              key={lessonId}
              onClick={() => addLessonToCookie(lessonId)} 
              variant={completedLessonIds.includes(lessonId) ? "default" : "outline"} 
              size="sm"
              disabled={!canCompleteToday || completedLessonIds.includes(lessonId)}
            >
              Lesson {lessonId} {completedLessonIds.includes(lessonId) ? "✓" : ""}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 