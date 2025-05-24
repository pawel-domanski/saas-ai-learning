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
      posthog.capture('$pageview');
      console.log('📊 PostHog pageview captured for:', pathname);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PosthogProvider({ children }: Props) {
  // Initialize PostHog once
  useEffect(() => {
    // Check if PostHog is already initialized
    if (!posthog.__loaded) {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
      
      console.log('PostHog environment variables:');
      console.log('- API Key available:', !!apiKey);
      console.log('- Host:', host);
      
      if (apiKey) {
        console.log('Initializing PostHog with API key');
        try {
          posthog.init(apiKey, {
            api_host: host,
            loaded: (ph) => {
              console.log('✅ PostHog successfully initialized:', ph.__loaded);
            },
            capture_pageview: false // We'll do this manually
          });
        } catch (err) {
          console.error('❌ Error initializing PostHog:', err);
        }
      } else {
        console.warn('⚠️ PostHog API key not set - analytics will not be collected');
      }
    } else {
      console.log('✅ PostHog already initialized');
    }
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