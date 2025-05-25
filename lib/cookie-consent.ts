export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

export interface CookieConsent {
  version: string;
  timestamp: number;
  categories: Record<string, boolean>;
  bannerDismissed: boolean;
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Strictly Necessary',
    description: 'These cookies are essential for the website to function properly. They include cookies for authentication, security, and basic functionality.',
    required: true,
    enabled: true,
  },
  {
    id: 'analytics',
    name: 'Analytics & Performance',
    description: 'These cookies help us understand how visitors use our website, allowing us to improve user experience and site performance.',
    required: false,
    enabled: false,
  },
  {
    id: 'marketing',
    name: 'Marketing & Advertising',
    description: 'These cookies are used to deliver personalized advertisements and measure their effectiveness.',
    required: false,
    enabled: false,
  },
  {
    id: 'preferences',
    name: 'Preferences & Functionality',
    description: 'These cookies remember your preferences and settings to provide a more personalized experience.',
    required: false,
    enabled: false,
  },
];

const CONSENT_VERSION = '1.0';
const CONSENT_KEY = 'cookie-consent';

export class CookieConsentManager {
  private static instance: CookieConsentManager;
  private consent: CookieConsent | null = null;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadConsent();
    }
  }

  static getInstance(): CookieConsentManager {
    if (!CookieConsentManager.instance) {
      CookieConsentManager.instance = new CookieConsentManager();
    }
    return CookieConsentManager.instance;
  }

  private loadConsent(): void {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const parsed: CookieConsent = JSON.parse(stored);
        // Check if the stored consent version matches current version
        if (parsed.version === CONSENT_VERSION) {
          this.consent = parsed;
        } else {
          // Version mismatch, reset consent
          this.resetConsent();
        }
      }
    } catch (error) {
      console.error('Error loading cookie consent:', error);
      this.resetConsent();
    }
  }

  private saveConsent(): void {
    if (!this.consent) return;
    
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(this.consent));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }

  private resetConsent(): void {
    this.consent = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      categories: COOKIE_CATEGORIES.reduce((acc, category) => {
        acc[category.id] = category.required;
        return acc;
      }, {} as Record<string, boolean>),
      bannerDismissed: false,
    };
  }



  public getConsent(): CookieConsent | null {
    return this.consent;
  }

  public hasConsent(): boolean {
    return this.consent !== null && this.consent.bannerDismissed;
  }

  public isCategoryEnabled(categoryId: string): boolean {
    if (!this.consent) return false;
    return this.consent.categories[categoryId] === true;
  }

  public setConsent(categories: Record<string, boolean>, dismissBanner: boolean = true): void {
    if (!this.consent) {
      this.resetConsent();
    }

    if (this.consent) {
      this.consent.categories = { ...categories };
      this.consent.bannerDismissed = dismissBanner;
      this.consent.timestamp = Date.now();
      this.saveConsent();
    }
  }

  public acceptAll(): void {
    const categories = COOKIE_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    this.setConsent(categories, true);
  }

  public rejectAll(): void {
    const categories = COOKIE_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = category.required;
      return acc;
    }, {} as Record<string, boolean>);
    
    this.setConsent(categories, true);
  }

  public updateCategory(categoryId: string, enabled: boolean): void {
    if (!this.consent) {
      this.resetConsent();
    }

    if (this.consent) {
      // Prevent disabling required categories
      const category = COOKIE_CATEGORIES.find(c => c.id === categoryId);
      if (category?.required) {
        enabled = true;
      }

      this.consent.categories[categoryId] = enabled;
      this.saveConsent();
    }
  }

  public openSettings(): void {
    if (this.consent) {
      this.consent.bannerDismissed = false;
      this.saveConsent();
    }
  }

  public addListener(callback: () => void): void {
    this.listeners.add(callback);
  }

  public removeListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // Helper method to check if analytics/tracking should be enabled
  public canTrack(): boolean {
    return this.hasConsent() && this.isCategoryEnabled('analytics');
  }

  // Helper method for marketing cookies
  public canUseMarketing(): boolean {
    return this.hasConsent() && this.isCategoryEnabled('marketing');
  }

  // Helper method for preference cookies
  public canUsePreferences(): boolean {
    return this.hasConsent() && this.isCategoryEnabled('preferences');
  }
}

// Export singleton instance
export const cookieConsent = CookieConsentManager.getInstance(); 