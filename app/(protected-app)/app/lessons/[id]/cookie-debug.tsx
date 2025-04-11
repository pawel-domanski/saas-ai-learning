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
  const [lessonId, setLessonId] = useState<string>('');
  const [canCompleteToday, setCanCompleteToday] = useState<boolean>(true);
  const [lastCompletedDate, setLastCompletedDate] = useState<string>('');
  const [nextAvailableTime, setNextAvailableTime] = useState<string>('');
  const [cookieValue, setCookieValue] = useState<string>('');
  const [lessonStart, setLessonStart] = useState<number>(0);

  useEffect(() => {
    // Fetch LESSON_START from environment
    fetch('/api/env/lesson-start')
      .then(res => res.json())
      .then(data => {
        setLessonStart(data.lessonStart || 0);
        console.log('Client-side LESSON_START (lesson page):', data.lessonStart);
      })
      .catch(err => {
        console.error('Error fetching LESSON_START:', err);
      });
      
    // Get all cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Get lesson ID from URL
    const path = window.location.pathname;
    const matches = path.match(/\/lessons\/(\d+)/);
    if (matches && matches[1]) {
      setLessonId(matches[1]);
    }

    // Check if a specific cookie exists
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const completedLessonsCookie = getCookie('completedLessons');
    console.log('Client-side completedLessons cookie (lesson page):', completedLessonsCookie);
    
    // Save cookie value to component state to make it accessible outside useEffect
    setCookieValue(completedLessonsCookie || '');
    
    if (completedLessonsCookie) {
      try {
        // Decode URI component before parsing JSON
        const decodedCookie = decodeURIComponent(completedLessonsCookie);
        const parsed = JSON.parse(decodedCookie);
        console.log('Parsed client-side completedLessons:', parsed);
        
        // Check if we have the new format with dates or old with just IDs
        if (Array.isArray(parsed) && parsed.length > 0) {
          let completedLessonsArray: CompletedLesson[] = [];
          
          if (typeof parsed[0] === 'object' && parsed[0].hasOwnProperty('id')) {
            // New format with dates
            completedLessonsArray = parsed;
          } else {
            // Old format - convert
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

  // Function to manually set cookie
  const setCompletedLessonsCookie = () => {
    if (!lessonId) return;
    
    const currentLessonId = parseInt(lessonId);
    
    // If the lesson ID is less than or equal to LESSON_START, we don't apply the daily limit
    // Otherwise, check if a lesson can be completed today
    if (currentLessonId > lessonStart && !canCompleteToday) {
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
        // Decode URI component before parsing JSON
        const decodedCookie = decodeURIComponent(completedLessonsCookie);
        const parsed = JSON.parse(decodedCookie);
        
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
    
    // Add current lesson if not already there
    const alreadyCompleted = completedLessons.some(lesson => lesson.id === currentLessonId);
    
    if (!alreadyCompleted) {
      completedLessons.push({
        id: currentLessonId,
        completedAt: new Date().toISOString()
      });
    }
    
    // Save cookie
    const value = JSON.stringify(completedLessons);
    // No need to encode - the browser will handle this automatically
    document.cookie = `completedLessons=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`;
    
    // Refresh displayed cookies
    setCookies(document.cookie);
    console.log('Manually set completedLessons cookie:', value);
    
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
            : parseInt(lessonId) <= lessonStart 
              ? 'This is a starter lesson - you can complete it without daily limits.'
              : `Daily limit reached. Next lesson available in ${nextAvailableTime}.`}
        </div>
        {lastCompletedDate && (
          <div className="text-xs text-gray-500 mt-1 mb-2">
            Last completed lesson: {lastCompletedDate}
          </div>
        )}
        <div className="text-xs bg-amber-50 p-2 rounded border border-amber-200 mt-2">
          <div className="font-medium">Cookie usage in new format (with dates):</div>
          <div>Cookie content: {cookieValue || 'none'}</div>
          <div>Current lesson ID: {lessonId}</div>
        </div>
      </div>
      
      <Button 
        onClick={setCompletedLessonsCookie} 
        variant="outline" 
        size="sm" 
        className="mb-2"
        disabled={!canCompleteToday}
      >
        Manually set cookie for lesson {lessonId}
      </Button>
      <div className="text-xs text-gray-500">
        This is a temporary solution for testing. Click to manually mark this lesson as completed.
      </div>
    </div>
  );
} 