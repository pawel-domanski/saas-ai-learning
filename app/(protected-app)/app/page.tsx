import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AppPage() {
  // Get the current user
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Get the team and check subscription
  const team = await getTeamForUser(user.id);
  if (!team) {
    redirect('/dashboard');
  }

  // Check if subscription is active or in trial period
  const hasActiveSubscription = 
    team.subscriptionStatus === 'active' || 
    team.subscriptionStatus === 'trialing';
  
  if (!hasActiveSubscription) {
    redirect('/pricing?access=premium');
  }

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto">
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden bg-white py-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-teal-500 px-6 py-6 rounded-t-2xl m-0">
          <CardTitle className="text-white font-semibold flex items-center">
            Premium App Features
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700">
            Welcome to the premium features area. You have access to this because you're a subscriber!
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-3 text-teal-600">Advanced Analytics</h2>
          <p className="text-gray-600">
            Access detailed analytics and insights about your account usage and performance.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-3 text-teal-600">Premium Support</h2>
          <p className="text-gray-600">
            Get priority support from our team with faster response times.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-3 text-teal-600">Advanced Customization</h2>
          <p className="text-gray-600">
            Customize your experience with advanced configuration options.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-3 text-teal-600">Early Access</h2>
          <p className="text-gray-600">
            Get early access to new features before they're available to everyone else.
          </p>
        </div>
      </div>
    </div>
  );
} 