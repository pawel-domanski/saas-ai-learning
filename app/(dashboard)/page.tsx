import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, Database, Sparkles, Shield, Zap } from 'lucide-react';
import { Terminal } from './terminal';

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center lg:text-left lg:col-span-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:leading-tight">
                Build Your SaaS
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Faster Than Ever</span>
              </h1>
              <p className="mt-5 text-xl text-gray-600 leading-relaxed">
                Launch your SaaS product in record time with our powerful,
                ready-to-use platform. Packed with modern technologies and
                essential integrations.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-4">
                <a
                  href="https://vercel.com/templates/next.js/next-js-saas-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 rounded-full shadow-md hover:shadow-lg transition-all duration-200 px-8"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-gray-300 hover:border-gray-400 shadow-sm"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-100">
                <Terminal />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-md -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Powerful Features</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build and scale your SaaS product
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-blue-100 to-teal-100 text-teal-600 mb-6">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Next.js and React
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Leverage the power of modern web technologies for optimal
                performance and developer experience.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-blue-100 to-teal-100 text-teal-600 mb-6">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Postgres and Drizzle ORM
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Robust database solution with an intuitive ORM for efficient
                data management and scalability.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-blue-100 to-teal-100 text-teal-600 mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Secure Authentication
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Built-in authentication system with secure sessions,
                roles, and permission management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-gradient-to-br from-blue-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ready to launch your SaaS?
              </h2>
              <p className="mt-4 text-lg text-blue-50 max-w-3xl">
                Our platform provides everything you need to get your SaaS up
                and running quickly. Don't waste time on boilerplate - focus on
                what makes your product unique.
              </p>
              <div className="mt-10 flex gap-4">
                <Button
                  size="lg"
                  className="bg-white text-teal-600 hover:bg-teal-50 rounded-full shadow-md"
                >
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  className="bg-teal-500 text-white hover:bg-teal-400 rounded-full shadow-md font-medium border border-teal-400"
                >
                  View Pricing
                </Button>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-teal-500/20">
                    <div className="text-3xl font-bold mb-1">1000+</div>
                    <div className="text-teal-50">Happy Users</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-teal-500/20">
                    <div className="text-3xl font-bold mb-1">24/7</div>
                    <div className="text-teal-50">Support</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-teal-500/20">
                    <div className="text-3xl font-bold mb-1">99.9%</div>
                    <div className="text-teal-50">Uptime</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-teal-500/20">
                    <div className="text-3xl font-bold mb-1">14-day</div>
                    <div className="text-teal-50">Free Trial</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
