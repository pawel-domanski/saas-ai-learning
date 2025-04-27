'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type EmojiRating = '😞' | '😐' | '🙂' | '😀' | '🤩';

const ratingLabels: Record<EmojiRating, string> = {
  '😞': 'Not engaging at all',
  '😐': 'Slightly engaging',
  '🙂': 'Moderately engaging',
  '😀': 'Very engaging',
  '🤩': 'Extremely engaging'
};

interface LessonRatingProps {
  lessonId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LessonRating({ lessonId, isOpen, onClose }: LessonRatingProps) {
  const [selectedRating, setSelectedRating] = useState<EmojiRating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingSubmit = async () => {
    if (!selectedRating) return;
    
    setIsSubmitting(true);
    try {
      // Here you would send the rating to your API
      await fetch('/api/lessons/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          rating: Object.keys(ratingLabels).indexOf(selectedRating) + 1, // Convert emoji to 1-5 rating
        }),
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Rate This Lesson</DialogTitle>
          <DialogDescription className="text-center">
            How engaging did you find the lesson content?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between py-6">
          {(Object.keys(ratingLabels) as EmojiRating[]).map((emoji) => (
            <div
              key={emoji}
              className={`flex flex-col items-center cursor-pointer transition-all ${
                selectedRating === emoji ? 'scale-125 text-blue-600' : 'hover:scale-110'
              }`}
              onClick={() => setSelectedRating(emoji)}
            >
              <div className="text-3xl">{emoji}</div>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleRatingSubmit}
            disabled={!selectedRating || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 