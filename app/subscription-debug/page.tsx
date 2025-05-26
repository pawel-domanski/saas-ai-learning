import { getUser, getTeamForUser } from '@/lib/db/queries';
import { stripe } from '@/lib/payments/stripe';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function SubscriptionDebugPage() {
  const user = await getUser();
  if (!user) {
    redirect('/login/sign-in');
  }

  const team = await getTeamForUser(user.id);
  if (!team) {
    return <div>No team found</div>;
  }

  let stripeSubscription = null;
  let stripeCustomer = null;
  let error = null;

  // Try to fetch data from Stripe
  try {
    if (team.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(team.stripeCustomerId);
    }
    
    if (team.stripeSubscriptionId) {
      stripeSubscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId, {
        expand: ['items.data.price.product']
      });
    }
  } catch (err: any) {
    error = err.message;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'incomplete': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Subscription Debug</h1>
      
      {/* Database Data */}
      <Card>
        <CardHeader>
          <CardTitle>Database Subscription Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Team ID:</label>
              <p className="text-sm text-gray-600">{team.id}</p>
            </div>
            <div>
              <label className="font-semibold">Plan Name:</label>
              <p className="text-sm text-gray-600">{team.planName || 'None'}</p>
            </div>
            <div>
              <label className="font-semibold">Subscription Status:</label>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(team.subscriptionStatus || 'none')}>
                  {team.subscriptionStatus || 'none'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="font-semibold">Cancel at Period End:</label>
              <p className="text-sm text-gray-600">{team.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="font-semibold">Current Period End:</label>
              <p className="text-sm text-gray-600">
                {team.currentPeriodEnd ? new Date(team.currentPeriodEnd).toLocaleString() : 'None'}
              </p>
            </div>
            <div>
              <label className="font-semibold">Stripe Customer ID:</label>
              <p className="text-sm text-gray-600 font-mono">{team.stripeCustomerId || 'None'}</p>
            </div>
            <div>
              <label className="font-semibold">Stripe Subscription ID:</label>
              <p className="text-sm text-gray-600 font-mono">{team.stripeSubscriptionId || 'None'}</p>
            </div>
            <div>
              <label className="font-semibold">Stripe Product ID:</label>
              <p className="text-sm text-gray-600 font-mono">{team.stripeProductId || 'None'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Data */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Data</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded">
              Error fetching Stripe data: {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Data */}
              {stripeCustomer && (
                <div>
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <pre className="text-sm">{JSON.stringify(stripeCustomer, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Subscription Data */}
              {stripeSubscription && (
                <div>
                  <h3 className="font-semibold mb-2">Subscription</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="font-semibold">Status:</label>
                      <Badge className={getStatusColor(stripeSubscription.status)}>
                        {stripeSubscription.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="font-semibold">Cancel at Period End:</label>
                      <p>{stripeSubscription.cancel_at_period_end ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="font-semibold">Current Period Start:</label>
                      <p>{new Date((stripeSubscription as any).current_period_start * 1000).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="font-semibold">Current Period End:</label>
                      <p>{new Date((stripeSubscription as any).current_period_end * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <pre className="text-sm">{JSON.stringify(stripeSubscription, null, 2)}</pre>
                  </div>
                </div>
              )}

              {!stripeCustomer && !stripeSubscription && !error && (
                <p className="text-gray-600">No Stripe data available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Debug endpoint:</strong> <code>/api/stripe/webhook-debug</code></p>
            <p><strong>Main webhook:</strong> <code>/api/stripe/webhook</code></p>
            <p className="text-sm text-gray-600">
              Check server logs for webhook events and any errors in processing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 