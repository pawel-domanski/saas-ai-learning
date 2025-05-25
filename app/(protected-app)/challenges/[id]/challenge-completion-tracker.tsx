'use client';

import { useEffect } from 'react';
import { trackChallengeEvent } from '@/lib/posthog-helpers';

interface ChallengeCompletionTrackerProps {
  challengeId: string;
  challengeTitle: string;
  day: number;
  isCompleted: boolean;
}

export default function ChallengeCompletionTracker({
  challengeId,
  challengeTitle,
  day,
  isCompleted
}: ChallengeCompletionTrackerProps) {
  useEffect(() => {
    // Track challenge start (when user first loads the challenge page)
    trackChallengeEvent('challenge_viewed', {
      challengeId,
      challengeTitle,
      currentDay: day
    });
  }, [challengeId, challengeTitle, day]);

  return null; // This component doesn't render anything
} 