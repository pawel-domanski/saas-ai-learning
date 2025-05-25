'use client';

import { useEffect, Suspense, useState } from 'react';
import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';
import { cookieConsent } from '@/lib/cookie-consent';

interface Props {
  children: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

function PosthogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canTrack, setCanTrack] = useState(false);

  // Monitor cookie consent changes
  useEffect(() => {
    const updateTrackingPermission = () => {
      const trackingAllowed = cookieConsent.canTrack();
      setCanTrack(trackingAllowed);
      
      if (!trackingAllowed && posthog.__loaded) {
        // If tracking is disabled, stop PostHog
        posthog.opt_out_capturing();
      } else if (trackingAllowed && posthog.__loaded) {
        // If tracking is enabled, resume PostHog
        posthog.opt_in_capturing();
      }
    };

    updateTrackingPermission();
    cookieConsent.addListener(updateTrackingPermission);

    return () => {
      cookieConsent.removeListener(updateTrackingPermission);
    };
  }, []);

  // Track pageviews on route change (only if tracking is allowed)
  useEffect(() => {
    if (canTrack && posthog.__loaded) {
      posthog.capture('$pageview');
    }
  }, [pathname, searchParams, canTrack]);

  return null;
}

export default function PosthogProvider({ children }: Props) {
  const [userIdentified, setUserIdentified] = useState(false);
  const [posthogInitialized, setPosthogInitialized] = useState(false);
  
  // Function to identify user with PostHog
  const identifyUser = async () => {
    if (!posthog.__loaded || userIdentified) return;
    
    try {
      const response = await fetch('/api/user');
      
      if (response.ok) {
        const user: User = await response.json();
        
        // Identify user with PostHog
        posthog.identify(user.id, {
          email: user.email,
          name: user.name,
          role: user.role,
          $set: {
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
        
        setUserIdentified(true);
        
        // Track user identification event (only if tracking allowed)
        if (cookieConsent.canTrack()) {
          posthog.capture('User Successfully Identified', {
            userId: user.id,
            email: user.email,
            name: user.name,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('❌ Error identifying user:', error);
    }
  };

  // Initialize PostHog immediately (regardless of consent)
  const initializePosthog = () => {
    if (posthogInitialized) return;

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
    
    if (apiKey) {
      try {
        posthog.init(apiKey, {
          api_host: host,
          capture_pageview: false, // We'll do this manually
          debug: false, // Disable debug mode for production
          opt_out_capturing_by_default: !cookieConsent.canTrack(), // Start with opt-out if no consent
          loaded: (ph) => {
            // Always send initialization event (for debugging)
            ph.capture('PostHog Analytics Initialized', {
              timestamp: new Date().toISOString(),
              pathname: typeof window !== 'undefined' ? window.location.pathname : '',
              hasConsent: cookieConsent.hasConsent(),
              canTrack: cookieConsent.canTrack()
            });
            
            setPosthogInitialized(true);
            
            // Set initial opt-out state based on consent
            if (!cookieConsent.canTrack()) {
              ph.opt_out_capturing();
            }
            
            // Try to identify user after PostHog loads
            setTimeout(identifyUser, 1000);
          },
          request_batching: false, // Send events immediately for testing
        });
      } catch (err) {
        console.error('❌ Error initializing PostHog:', err);
      }
    } else {
      console.warn('⚠️ PostHog API key not set - analytics will not be collected');
    }
  };

  // Initialize PostHog immediately (not waiting for consent)
  useEffect(() => {
    // Initialize PostHog immediately for cookie consent tracking
    initializePosthog();
    
    const handleConsentChange = () => {
      const canTrack = cookieConsent.canTrack();
      
      if (posthog.__loaded) {
        if (!canTrack) {
          posthog.opt_out_capturing();
        } else {
          posthog.opt_in_capturing();
        }
      }
    };

    // Listen for consent changes
    cookieConsent.addListener(handleConsentChange);

    return () => {
      cookieConsent.removeListener(handleConsentChange);
    };
  }, []);

  // Test manual event capture (only when consent is given)
  useEffect(() => {
    const testPostHog = () => {
      if (posthog.__loaded && cookieConsent.canTrack()) {
        posthog.capture('Analytics System Test', {
          test: true,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Test after 3 seconds (give time for initialization)
    const timer = setTimeout(testPostHog, 3000);
    return () => clearTimeout(timer);
  }, [posthogInitialized]);

  return (
    <>
      <Suspense fallback={null}>
        <PosthogTracker />
      </Suspense>
      {children}
    </>
  );
}  