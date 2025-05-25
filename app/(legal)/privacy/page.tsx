import { Metadata } from 'next';
import Link from 'next/link';
import CookieSettingsButton from '@/components/cookie-banner/CookieSettingsButton';

export const metadata: Metadata = {
  title: 'Privacy Policy - Focus your AI',
  description: 'Our privacy policy explains how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Focus your AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our website 
                and use our services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This policy complies with the EU General Data Protection Regulation (GDPR) and other applicable 
                data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may collect the following types of personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name and email address (when you create an account)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Profile information and preferences</li>
                <li>Communication history (support requests, feedback)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Usage Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We automatically collect certain information about your use of our services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Pages visited and features used</li>
                <li>Time spent on our platform</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Learning progress and quiz results</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Providing and maintaining our services</li>
                <li>Personalizing your learning experience</li>
                <li>Processing payments and managing subscriptions</li>
                <li>Communicating with you about your account</li>
                <li>Improving our platform and developing new features</li>
                <li>Analyzing usage patterns and performance</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience. We categorize 
                cookies as follows:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Strictly Necessary:</strong> Essential for basic website functionality</li>
                <li><strong>Analytics:</strong> Help us understand how you use our platform (PostHog)</li>
                <li><strong>Marketing:</strong> Used for personalized advertising and tracking</li>
                <li><strong>Preferences:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can manage your cookie preferences at any time using our cookie settings:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <CookieSettingsButton variant="outline" className="bg-white">
                  Manage Cookie Preferences
                </CookieSettingsButton>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Service Providers:</strong> Stripe (payments), PostHog (analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights (GDPR)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under GDPR, you have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Right of Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Transfer your data to another service</li>
                <li><strong>Right to Object:</strong> Object to certain types of processing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@focusyourai.com" className="text-blue-600 hover:underline">
                  privacy@focusyourai.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Secure payment processing through Stripe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your personal information only for as long as necessary to provide our services 
                and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Account information: Until account deletion</li>
                <li>Payment records: 7 years (tax and legal requirements)</li>
                <li>Analytics data: 2 years</li>
                <li>Support communications: 3 years</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for such transfers, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Adequacy decisions by the European Commission</li>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Certification schemes and codes of conduct</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for children under 16 years of age. We do not knowingly 
                collect personal information from children under 16. If you are a parent or guardian and 
                believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "Last updated" date. Significant 
                changes will be communicated via email or prominent notice on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@focusyourai.com" className="text-blue-600 hover:underline">
                    privacy@focusyourai.com
                  </a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Data Protection Officer:</strong>{' '}
                  <a href="mailto:dpo@focusyourai.com" className="text-blue-600 hover:underline">
                    dpo@focusyourai.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Postal Address:</strong> [Your Company Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 