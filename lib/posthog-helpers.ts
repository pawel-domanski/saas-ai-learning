import posthog from 'posthog-js';

/**
 * Helper function to capture events with automatic user identification
 * @param eventName - Name of the event to capture
 * @param properties - Event properties
 */
export const captureEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (!posthog.__loaded) {
    console.warn('PostHog not loaded - skipping event:', eventName);
    return;
  }

  try {
    // Get current user ID from PostHog
    const distinctId = posthog.get_distinct_id();
    
    console.log(`🎯 Tracking event: ${eventName}`, properties);
    
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      distinctId: distinctId
    });
    
    console.log(`✅ Event sent to PostHog: ${eventName}`);
  } catch (error) {
    console.error(`❌ Error sending event ${eventName}:`, error);
  }
};

/**
 * Helper function to identify user in PostHog
 * @param userId - User ID
 * @param userProperties - User properties
 */
export const identifyUser = (userId: string, userProperties: Record<string, any> = {}) => {
  if (!posthog.__loaded) {
    console.warn('PostHog not loaded - skipping user identification');
    return;
  }

  try {
    console.log('👤 Identifying user in PostHog:', userId);
    
    posthog.identify(userId, {
      ...userProperties,
      $set: userProperties
    });
    
    console.log('✅ User identified in PostHog:', userId);
  } catch (error) {
    console.error('❌ Error identifying user:', error);
  }
};

/**
 * Helper function to reset user identity (for logout)
 */
export const resetUser = () => {
  if (!posthog.__loaded) {
    console.warn('PostHog not loaded - skipping user reset');
    return;
  }

  try {
    console.log('🔄 Resetting PostHog user identity');
    posthog.reset();
    console.log('✅ PostHog user identity reset');
  } catch (error) {
    console.error('❌ Error resetting user identity:', error);
  }
};

/**
 * Helper function for tracking lesson events
 */
export const trackLessonEvent = (eventName: string, lessonData: {
  lessonId: string;
  lessonTitle: string;
  partId?: string;
  [key: string]: any;
}) => {
  captureEvent(eventName, {
    ...lessonData,
    category: 'lesson'
  });
};

/**
 * Helper function for tracking challenge events
 */
export const trackChallengeEvent = (eventName: string, challengeData: {
  challengeId: string;
  challengeTitle: string;
  day?: number;
  [key: string]: any;
}) => {
  captureEvent(eventName, {
    ...challengeData,
    category: 'challenge'
  });
};

/**
 * Helper function for tracking quiz events
 */
export const trackQuizEvent = (eventName: string, quizData: {
  sessionId?: string;
  questionId?: number;
  [key: string]: any;
}) => {
  captureEvent(eventName, {
    ...quizData,
    category: 'quiz'
  });
}; 