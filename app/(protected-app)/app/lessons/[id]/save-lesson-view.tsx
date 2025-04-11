'use client';

import { useEffect } from 'react';
import { saveViewAction } from './actions';

interface SaveLessonViewProps {
  lessonId: number;
  partId: number;
}

export function SaveLessonView({ lessonId, partId }: SaveLessonViewProps) {
  useEffect(() => {
    // Call the server action when the component mounts
    saveViewAction(lessonId, partId);
  }, [lessonId, partId]);

  // This component doesn't render anything, it just saves the view
  return null;
} 