'use client';

import { useEffect, Suspense } from 'react';
import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

function PosthogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageviews on route change
  useEffect(() => {
    if (posthog.__loaded) {
      console.log('🔄 PostHog tracking pageview for:', pathname);
      posthog.capture('$pageview');
      console.log('✅ PostHog pageview captured for:', pathname);
    } else {
      console.log('❌ PostHog not loaded, skipping pageview for:', pathname);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PosthogProvider({ children }: Props) {
  // Initialize PostHog once
  useEffect(() => {
    console.log('🚀 PostHog Provider useEffect triggered');
    
    // Check if PostHog is already initialized
    if (!posthog.__loaded) {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
      
      console.log('🔍 PostHog environment variables:');
      console.log('- API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
      console.log('- Host:', host);
      console.log('- Loaded status:', posthog.__loaded);
      
      if (apiKey) {
        console.log('⚙️ Initializing PostHog with API key');
        try {
          posthog.init(apiKey, {
            api_host: host,
            capture_pageview: false, // We'll do this manually
            debug: true, // Enable debug mode
            loaded: (ph) => {
              console.log('✅ PostHog successfully initialized:', ph.__loaded);
              console.log('🎯 PostHog instance:', ph);
              
              // Test event
              ph.capture('posthog_initialized', {
                timestamp: new Date().toISOString(),
                pathname: window.location.pathname
              });
              console.log('🧪 Test event sent: posthog_initialized');
            },
            request_batching: false, // Send events immediately for testing
          });
        } catch (err) {
          console.error('❌ Error initializing PostHog:', err);
        }
      } else {
        console.warn('⚠️ PostHog API key not set - analytics will not be collected');
        console.warn('⚠️ Expected: NEXT_PUBLIC_POSTHOG_API_KEY in environment variables');
      }
    } else {
      console.log('✅ PostHog already initialized:', posthog.__loaded);
    }
  }, []);

  // Test manual event capture
  useEffect(() => {
    const testPostHog = () => {
      if (posthog.__loaded) {
        console.log('🧪 Testing manual event capture...');
        posthog.capture('manual_test_event', {
          test: true,
          timestamp: new Date().toISOString()
        });
        console.log('🧪 Manual test event sent');
      } else {
        console.log('❌ PostHog not loaded for manual test');
      }
    };

    // Test after 2 seconds
    const timer = setTimeout(testPostHog, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PosthogTracker />
      </Suspense>
      {children}
    </>
  );
}  