'use client';

import { useState, useEffect } from 'react';
import { LessonRating } from './lesson-rating';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface LessonRatingTriggerProps {
  lessonId: string;
  trigger: boolean;
  showAlways?: boolean;
}

export default function LessonRatingTrigger({ lessonId, trigger, showAlways = false }: LessonRatingTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Delay opening the rating dialog until after confetti animation completes
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 7000); // 7 seconds delay matches confetti duration
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  // Check if user has already rated this lesson
  useEffect(() => {
    const checkIfRated = async () => {
      try {
        const response = await fetch(`/api/lessons/rate?lessonId=${lessonId}`);
        if (response.ok) {
          const data = await response.json();
          setHasRated(data.hasRated || false);
        }
      } catch (error) {
        console.error('Error checking rating status:', error);
      }
    };

    if (showAlways) {
      checkIfRated();
    }
  }, [lessonId, showAlways]);

  const handleClose = () => {
    setIsOpen(false);
    // Refresh rating status after closing
    if (showAlways) {
      setTimeout(() => {
        setHasRated(true);
      }, 500);
    }
  };

  const handleOpenRating = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Show a button to rate the lesson if showAlways is true */}
      {showAlways && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleOpenRating}
            className={`${hasRated ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white shadow-lg rounded-full p-3`}
            title={hasRated ? "You've rated this lesson" : "Rate this lesson"}
          >
            <Star className={`h-5 w-5 ${hasRated ? 'fill-current' : ''}`} />
          </Button>
        </div>
      )}
      
      <LessonRating lessonId={lessonId} isOpen={isOpen} onClose={handleClose} />
    </>
  );
} 