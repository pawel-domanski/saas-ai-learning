'use client';

import { useEffect } from 'react';
import { saveViewAction } from './actions';
import { trackLessonEvent } from '@/lib/posthog-helpers';

interface SaveLessonViewProps {
  lessonId: string;
  partId: string;
}

export function SaveLessonView({ lessonId, partId }: SaveLessonViewProps) {
  useEffect(() => {
    // Call the server action when the component mounts
    saveViewAction(lessonId, partId);
    
    // Track the view in PostHog
    trackLessonEvent('lesson_viewed', {
      lessonId,
      lessonTitle: '', // Could be passed as prop if needed
      partId
    });
  }, [lessonId, partId]);

  // This component doesn't render anything, it just saves the view
  return null;
} 