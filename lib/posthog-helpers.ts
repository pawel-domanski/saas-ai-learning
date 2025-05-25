import posthog from 'posthog-js';
import { cookieConsent } from './cookie-consent';

/**
 * Wait for PostHog to be fully loaded
 */
const waitForPostHog = (maxWaitTime = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkPostHog = () => {
      if (posthog.__loaded) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= maxWaitTime) {
        resolve(false);
        return;
      }
      
      setTimeout(checkPostHog, 100);
    };
    
    checkPostHog();
  });
};

/**
 * Helper function to capture events with automatic user identification
 * @param eventName - Name of the event to capture
 * @param properties - Event properties
 */
export const captureEvent = (eventName: string, properties: Record<string, any> = {}) => {
  // Check if tracking is allowed by cookie consent
  if (!cookieConsent.canTrack()) {
    return;
  }

  if (!posthog.__loaded) {
    return;
  }

  try {
    // Get current user ID from PostHog
    const distinctId = posthog.get_distinct_id();
    
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      distinctId: distinctId
    });
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
  // Check if tracking is allowed by cookie consent
  if (!cookieConsent.canTrack()) {
    return;
  }

  if (!posthog.__loaded) {
    return;
  }

  try {
    posthog.identify(userId, {
      ...userProperties,
      $set: userProperties
    });
  } catch (error) {
    console.error('❌ Error identifying user:', error);
  }
};

/**
 * Helper function to reset user identity (for logout)
 */
export const resetUser = () => {
  if (!posthog.__loaded) {
    return;
  }

  try {
    posthog.reset();
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

/**
 * Helper function for tracking cookie consent events
 */
export const trackCookieConsent = async (action: 'accepted' | 'rejected' | 'customized', categories: Record<string, boolean>) => {
  // Wait for PostHog to be ready
  const isReady = await waitForPostHog();
  
  if (!isReady) {
    console.warn('❌ PostHog not ready - skipping cookie consent event');
    return;
  }

  try {
    // Check current opt-out status
    const wasOptedOut = posthog.has_opted_out_capturing();
    
    // Temporarily enable capturing for this event
    if (wasOptedOut) {
      posthog.opt_in_capturing();
    }
    
    // Create descriptive event name
    let eventName = '';
    switch (action) {
      case 'accepted':
        eventName = 'Cookie Consent Accepted';
        break;
      case 'rejected':
        eventName = 'Cookie Consent Rejected';
        break;
      case 'customized':
        eventName = 'Cookie Consent Customized';
        break;
    }
    
    const eventData = {
      action,
      categories,
      timestamp: new Date().toISOString(),
      category: 'privacy',
      source: 'cookie_banner',
      analytics_enabled: categories.analytics || false,
      marketing_enabled: categories.marketing || false,
      preferences_enabled: categories.preferences || false
    };
    
    posthog.capture(eventName, eventData);
    
    // Restore opt-out state if it was opted out
    if (wasOptedOut) {
      posthog.opt_out_capturing();
    }
  } catch (error) {
    console.error('❌ Error sending cookie consent event:', error);
  }
}; 