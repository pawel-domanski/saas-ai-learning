'use client';

import { useState, useEffect } from 'react';
import { cookieConsent, COOKIE_CATEGORIES, type CookieCategory } from '@/lib/cookie-consent';
import { trackCookieConsent } from '@/lib/posthog-helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Eye, Megaphone, Sliders, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'necessary':
      return <Shield className="h-5 w-5 text-blue-600" />;
    case 'analytics':
      return <Eye className="h-5 w-5 text-green-600" />;
    case 'marketing':
      return <Megaphone className="h-5 w-5 text-purple-600" />;
    case 'preferences':
      return <Sliders className="h-5 w-5 text-orange-600" />;
    default:
      return <Info className="h-5 w-5 text-gray-600" />;
  }
};

export default function CookieSettingsModal({ isOpen, onClose }: CookieSettingsModalProps) {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Load current preferences
      const consent = cookieConsent.getConsent();
      if (consent) {
        setPreferences(consent.categories);
      } else {
        // Set default preferences
        const defaultPrefs = COOKIE_CATEGORIES.reduce((acc, category) => {
          acc[category.id] = category.required;
          return acc;
        }, {} as Record<string, boolean>);
        setPreferences(defaultPrefs);
      }
    }
  }, [isOpen]);

  const handleToggle = (categoryId: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [categoryId]: enabled
    }));
  };

  const handleSave = async () => {
    cookieConsent.setConsent(preferences, true);
    await trackCookieConsent('customized', preferences);
    onClose();
  };

  const handleAcceptAll = async () => {
    const allEnabled = COOKIE_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    cookieConsent.setConsent(allEnabled, true);
    await trackCookieConsent('accepted', allEnabled);
    onClose();
  };

  const handleRejectAll = async () => {
    const onlyRequired = COOKIE_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = category.required;
      return acc;
    }, {} as Record<string, boolean>);
    
    cookieConsent.setConsent(onlyRequired, true);
    await trackCookieConsent('rejected', onlyRequired);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. You can enable or disable different types of cookies below.
            Note that disabling some types may impact your experience on our website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {COOKIE_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getCategoryIcon(category.id)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label 
                        htmlFor={category.id}
                        className="text-base font-medium text-gray-900"
                      >
                        {category.name}
                      </Label>
                      {category.required && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Additional details for each category */}
                    {category.id === 'necessary' && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Examples:</strong> Authentication, security, basic site functionality
                      </div>
                    )}
                    {category.id === 'analytics' && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Examples:</strong> PostHog analytics, page views, user interactions
                      </div>
                    )}
                    {category.id === 'marketing' && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Examples:</strong> Targeted ads, conversion tracking, remarketing
                      </div>
                    )}
                    {category.id === 'preferences' && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Examples:</strong> Language settings, theme preferences, personalization
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  id={category.id}
                  checked={preferences[category.id] || false}
                  onCheckedChange={(checked) => handleToggle(category.id, checked)}
                  disabled={category.required}
                  className="ml-4"
                />
              </div>
              {category.id !== COOKIE_CATEGORIES[COOKIE_CATEGORIES.length - 1].id && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">About Cookie Management</p>
              <p className="mt-1">
                You can change these preferences at any time by clicking the "Cookie Settings" 
                link in our footer. Some cookies are essential for basic website functionality 
                and cannot be disabled.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleRejectAll}
              className="flex-1 sm:flex-initial"
            >
              Reject All
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-initial"
            >
              Accept All
            </Button>
          </div>
          <Button 
            onClick={handleSave}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 