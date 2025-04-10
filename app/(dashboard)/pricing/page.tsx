import { checkoutAction } from '@/lib/payments/actions';
import { Check, AlertCircle } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import { cookies } from 'next/headers';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  // Check if the user was redirected from premium content
  const needsSubscription = searchParams.access === 'premium';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {needsSubscription && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 rounded-full bg-amber-100 p-1 mr-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h5 className="font-medium">Subscription Required</h5>
              <p className="text-sm mt-1">
                You need an active subscription to access premium features.
                Please choose a plan below to continue.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={basePlan?.name || 'Base'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'Unlimited Usage',
            'Unlimited Workspace Members',
            'Email Support',
          ]}
          priceId={basePrice?.id}
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Everything in Base, and:',
            'Early Access to New Features',
            '24/7 Support + Slack Access',
            'Premium App Features Access'
          ]}
          priceId={plusPrice?.id}
          highlighted={needsSubscription}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  highlighted = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`pt-6 rounded-xl ${highlighted ? 'ring-2 ring-purple-500 p-4 bg-white shadow-lg' : ''}`}>
      {highlighted && (
        <div className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
          Recommended
        </div>
      )}
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton highlighted={highlighted} />
      </form>
    </div>
  );
}
