import { Metadata } from 'next';
import Link from 'next/link';
import CookieSettingsButton from '@/components/cookie-banner/CookieSettingsButton';
import { Shield, Eye, Megaphone, Sliders } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy - Focus your AI',
  description: 'Learn about how we use cookies and how you can manage your preferences.',
};

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files that are stored on your computer or mobile device when you visit 
                a website. They are widely used to make websites work, or work more efficiently, as well as 
                to provide information to website owners.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We use cookies to enhance your experience on our platform, analyze usage patterns, and provide 
                personalized content and advertising.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Necessary Cookies */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Strictly Necessary</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    These cookies are essential for the website to function properly and cannot be disabled.
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-4">
                    <li>Authentication and security</li>
                    <li>Session management</li>
                    <li>Basic website functionality</li>
                    <li>Cookie consent preferences</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-6 w-6 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Analytics</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Help us understand how visitors use our website to improve user experience.
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-4">
                    <li>PostHog analytics</li>
                    <li>Page views and user interactions</li>
                    <li>Feature usage statistics</li>
                    <li>Performance monitoring</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Megaphone className="h-6 w-6 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Marketing</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Used to deliver personalized advertisements and measure their effectiveness.
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-4">
                    <li>Targeted advertising</li>
                    <li>Conversion tracking</li>
                    <li>Remarketing campaigns</li>
                    <li>Social media integration</li>
                  </ul>
                </div>

                {/* Preferences Cookies */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Sliders className="h-6 w-6 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Preferences</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Remember your preferences and settings for a personalized experience.
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-4">
                    <li>Language preferences</li>
                    <li>Theme settings</li>
                    <li>User interface customization</li>
                    <li>Learning preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We also use third-party services that may set their own cookies:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PostHog Analytics</h3>
                <p className="text-gray-700 mb-2">
                  We use PostHog to analyze user behavior and improve our platform. PostHog may set cookies 
                  to track user sessions and interactions.
                </p>
                <p className="text-sm text-gray-600">
                  Learn more: <a href="https://posthog.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">PostHog Privacy Policy</a>
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stripe Payments</h3>
                <p className="text-gray-700 mb-2">
                  Stripe handles our payment processing and may set cookies for fraud prevention and security.
                </p>
                <p className="text-sm text-gray-600">
                  Learn more: <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have full control over which cookies we use. You can manage your preferences using our 
                cookie settings or through your browser settings.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cookie Settings</h3>
                <p className="text-gray-700 mb-4">
                  Use our cookie preference center to enable or disable specific categories of cookies:
                </p>
                <CookieSettingsButton variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Manage Cookie Preferences
                </CookieSettingsButton>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Settings</h3>
                <p className="text-gray-700 mb-3">
                  You can also control cookies through your browser settings:
                </p>
                <ul className="text-gray-700 list-disc pl-4 space-y-1">
                  <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                  <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Different cookies have different lifespans:
              </p>
              <ul className="text-gray-700 list-disc pl-6 space-y-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device until they expire or you delete them</li>
                <li><strong>Analytics Cookies:</strong> Typically expire after 2 years</li>
                <li><strong>Preference Cookies:</strong> Typically expire after 1 year</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Impact of Disabling Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Disabling certain cookies may affect your experience on our website:
              </p>
              <ul className="text-gray-700 list-disc pl-6 space-y-2">
                <li>Necessary cookies: The website may not function properly</li>
                <li>Analytics cookies: We cannot improve our services based on usage data</li>
                <li>Marketing cookies: You may see less relevant advertisements</li>
                <li>Preference cookies: Your settings and preferences will not be saved</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or 
                for other operational, legal, or regulatory reasons. When we make changes, we will update 
                the "Last updated" date at the top of this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@focusyourai.com" className="text-blue-600 hover:underline">
                    privacy@focusyourai.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Subject:</strong> Cookie Policy Inquiry
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 