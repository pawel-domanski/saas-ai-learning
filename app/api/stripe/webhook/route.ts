import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getTeamByStripeCustomerId } from '@/lib/db/queries';
import posthog from 'posthog-js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      
      // Track subscription events with PostHog
      try {
        const customerId = subscription.customer as string;
        const team = await getTeamByStripeCustomerId(customerId);
        
        if (team) {
          // Initialize PostHog for server-side tracking
          const PostHog = require('posthog-node').default;
          const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
          });
          
          console.log('🎯 Tracking subscription event:', event.type);
          
          posthogClient.capture({
            distinctId: team.id,
            event: event.type === 'customer.subscription.updated' ? 'subscription_updated' : 'subscription_cancelled',
            properties: {
              teamId: team.id,
              subscriptionId: subscription.id,
              status: subscription.status,
              planName: team.planName,
              timestamp: new Date().toISOString()
            }
          });
          
          await posthogClient.shutdown();
          console.log('✅ Subscription event sent to PostHog');
        }
      } catch (error) {
        console.error('❌ Error tracking subscription event:', error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
