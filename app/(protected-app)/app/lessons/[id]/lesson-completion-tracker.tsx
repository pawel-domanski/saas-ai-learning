'use client';

import { useEffect } from 'react';
import { trackLessonEvent } from '@/lib/posthog-helpers';

interface LessonCompletionTrackerProps {
  lessonId: string;
  lessonTitle: string;
  partId: string;
  isCompleted: boolean;
  successMessage: boolean;
}

export default function LessonCompletionTracker({
  lessonId,
  lessonTitle,
  partId,
  isCompleted,
  successMessage
}: LessonCompletionTrackerProps) {
  useEffect(() => {
    // Only track completion event if lesson was just completed (success=true in URL)
    if (successMessage && isCompleted) {
      trackLessonEvent('lesson_completed', {
        lessonId,
        lessonTitle,
        partId,
        completionMethod: 'mark_as_completed_button'
      });
    }
  }, [lessonId, lessonTitle, partId, isCompleted, successMessage]);

  return null; // This component doesn't render anything
} 