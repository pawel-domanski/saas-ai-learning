'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { cookieConsent } from '@/lib/cookie-consent';
import CookieSettingsModal from './CookieSettingsModal';

interface CookieSettingsButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export default function CookieSettingsButton({ 
  variant = 'ghost',
  size = 'sm',
  className = '',
  children
}: CookieSettingsButtonProps) {
  const [showSettings, setShowSettings] = useState(false);

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenSettings}
        className={`flex items-center gap-2 ${className}`}
      >
        <Settings className="h-4 w-4" />
        {children || 'Cookie Settings'}
      </Button>

      <CookieSettingsModal
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />
    </>
  );
} 