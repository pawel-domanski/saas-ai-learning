'use client';

import { useState, useEffect } from 'react';
import { cookieConsent } from '@/lib/cookie-consent';
import { trackCookieConsent } from '@/lib/posthog-helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Settings, Shield, Eye, Megaphone, Sliders } from 'lucide-react';
import CookieSettingsModal from './CookieSettingsModal';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if consent has been given
    const hasConsent = cookieConsent.hasConsent();
    setIsVisible(!hasConsent);

    // Listen for consent changes
    const handleConsentChange = () => {
      setIsVisible(!cookieConsent.hasConsent());
    };

    cookieConsent.addListener(handleConsentChange);

    return () => {
      cookieConsent.removeListener(handleConsentChange);
    };
  }, []);

  const handleAcceptAll = async () => {
    cookieConsent.acceptAll();
    await trackCookieConsent('accepted', cookieConsent.getConsent()?.categories || {});
    setIsVisible(false);
  };

  const handleRejectAll = async () => {
    cookieConsent.rejectAll();
    await trackCookieConsent('rejected', cookieConsent.getConsent()?.categories || {});
    setIsVisible(false);
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setIsVisible(!cookieConsent.hasConsent());
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <Card className="max-w-6xl mx-auto p-6 shadow-xl bg-white">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  We value your privacy
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 lg:mb-0">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or learn more about our cookie policy.
              </p>
              
              {/* Cookie categories preview */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <Shield className="h-3 w-3" />
                  Necessary
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <Eye className="h-3 w-3" />
                  Analytics
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <Megaphone className="h-3 w-3" />
                  Marketing
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <Sliders className="h-3 w-3" />
                  Preferences
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row min-w-fit">
              <Button
                onClick={handleCustomize}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Settings className="h-4 w-4" />
                Customize
              </Button>
              <Button
                onClick={handleRejectAll}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                Reject All
              </Button>
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                Accept All
              </Button>
            </div>
          </div>

          {/* Additional links */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
            <a href="/privacy" className="hover:text-blue-600 underline">
              Privacy Policy
            </a>
            <a href="/cookies" className="hover:text-blue-600 underline">
              Cookie Policy
            </a>
            <a href="/terms" className="hover:text-blue-600 underline">
              Terms of Service
            </a>
          </div>
        </Card>
      </div>

      {/* Settings Modal */}
      <CookieSettingsModal
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />
    </>
  );
} 