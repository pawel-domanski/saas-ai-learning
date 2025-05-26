import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription
} from '@/lib/db/queries';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
});

export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/login/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,
    client_reference_id: user.id.toString(),
    allow_promotion_codes: true
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession(team: Team) {
  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(team.stripeProductId);
    if (!product.active) {
      throw new Error("Team's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the team's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        payment_method_update: {
          enabled: true
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('❌ Team not found for Stripe customer:', customerId);
    return;
  }

  console.log(`📅 Processing subscription change for team ${team.id}:`);
  console.log(`   Status: ${status}`);
  console.log(`   Subscription ID: ${subscriptionId}`);
  console.log(`   Cancel at period end: ${subscription.cancel_at_period_end}`);
  console.log(`   Current period end: ${new Date((subscription as any).current_period_end * 1000).toISOString()}`);

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    const productName = typeof plan?.product === 'string' 
      ? 'Unknown' 
      : (plan?.product as Stripe.Product)?.name || 'Unknown';
    
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: productName,
      subscriptionStatus: status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
    });
    
    console.log(`✅ Updated active subscription for team ${team.id}:`);
    console.log(`   Plan: ${productName}`);
    console.log(`   Status: ${status}`);
    console.log(`   Cancel at period end: ${subscription.cancel_at_period_end}`);
  } else if (status === 'past_due' || status === 'incomplete') {
    // These statuses still maintain the subscription data but with updated status
    const plan = subscription.items.data[0]?.plan;
    const productName = typeof plan?.product === 'string' 
      ? 'Unknown' 
      : (plan?.product as Stripe.Product)?.name || 'Unknown';
    
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: productName,
      subscriptionStatus: status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
    });
    
    console.log(`⚠️ Updated problematic subscription for team ${team.id}: status=${status}`);
  } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: undefined
    });
    
    console.log(`❌ Terminated subscription for team ${team.id}: status=${status}`);
  } else {
    // Unknown status - log and update anyway
    console.log(`🤔 Unknown subscription status for team ${team.id}: ${status}`);
    const plan = subscription.items.data[0]?.plan;
    const productName = typeof plan?.product === 'string' 
      ? 'Unknown' 
      : (plan?.product as Stripe.Product)?.name || 'Unknown';
    
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: productName,
      subscriptionStatus: status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
    });
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    currencySymbol: price.currency === 'usd' ? '$' : '€',
    interval: price.recurring?.interval,
    intervalCount: price.recurring?.interval_count || 1,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}
