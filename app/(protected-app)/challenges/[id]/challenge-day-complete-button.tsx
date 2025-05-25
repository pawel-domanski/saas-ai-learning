'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { trackChallengeEvent } from '@/lib/posthog-helpers';

interface ChallengeDayCompleteButtonProps {
  challengeId: string;
  challengeTitle: string;
  day: number;
  isCompleted: boolean;
}

export default function ChallengeDayCompleteButton({
  challengeId,
  challengeTitle,
  day,
  isCompleted
}: ChallengeDayCompleteButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

          try {
        // Track challenge day completion attempt
        trackChallengeEvent('challenge_day_completion_attempted', {
          challengeId,
          challengeTitle,
          day
        });

      // Submit the completion
      const formData = new FormData();
      formData.append('challengeId', challengeId);
      formData.append('day', day.toString());
      
      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        body: formData
      });

              if (response.ok) {
          // Track successful completion
          trackChallengeEvent('challenge_day_completed', {
            challengeId,
            challengeTitle,
            day
          });

        // Redirect will be handled by the API response
        window.location.reload();
      } else {
        throw new Error('Failed to complete challenge day');
      }
    } catch (error) {
      console.error('Error completing challenge day:', error);
      alert('Failed to complete challenge day. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return null; // Don't render button if already completed
  }

  return (
    <Button 
      onClick={handleComplete}
      disabled={isSubmitting}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isSubmitting ? 'Completing...' : 'Mark as Complete'}
    </Button>
  );
} 