'use client';

import { useUser } from '@/lib/auth';
import { use } from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { useState } from 'react';

export function BirthDetailsAlert() {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) {
    return null;
  }

  // Check if any birth details are missing
  const isMissingBirthDetails = 
    !user.birthDate || 
    !user.birthTime || 
    !user.birthCity || 
    !user.birthCountry;

  if (!isMissingBirthDetails) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="flex p-2 rounded-lg bg-amber-100">
              <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            <p className="ml-3 font-medium text-amber-800">
              Please complete your birth details for a personalized astrological experience.
              <Link 
                href="/dashboard/general" 
                className="underline ml-1 font-semibold text-amber-700 hover:text-amber-600"
              >
                Complete your profile
              </Link>
            </p>
          </div>
          <button 
            type="button" 
            className="text-amber-500 hover:text-amber-600 focus:outline-none" 
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            title="Dismiss notification"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 