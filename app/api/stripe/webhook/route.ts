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
    console.log(`🎯 Stripe webhook received: ${event.type} (ID: ${event.id})`);
  } catch (err) {
    console.error('❌ Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.created':
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`📅 Processing subscription event: ${event.type} - Status: ${subscription.status}, Customer: ${subscription.customer}`);
      await handleSubscriptionChange(subscription);
      
      // Track subscription events with PostHog
      try {
        const customerId = subscription.customer as string;
        const team = await getTeamByStripeCustomerId(customerId);
        
        if (team) {
          // Initialize PostHog for server-side tracking
          const { PostHog } = require('posthog-node');
          const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
          });
          
          posthogClient.capture({
            distinctId: team.id,
            event: event.type === 'customer.subscription.updated' ? 'Subscription Updated' : 'Subscription Cancelled',
            properties: {
              teamId: team.id,
              subscriptionId: subscription.id,
              status: subscription.status,
              planName: team.planName,
              timestamp: new Date().toISOString(),
              source: 'server_side_stripe_webhook'
            }
          });
          
          await posthogClient.shutdown();
        }
      } catch (error) {
        console.error('❌ Error tracking subscription event:', error);
      }
      break;

    case 'invoice.payment_succeeded':
      // Handle subscription renewal
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`💰 Invoice payment succeeded: ${invoice.id}, Customer: ${invoice.customer}, Billing reason: ${invoice.billing_reason}`);
      
      // Use bracket notation to access subscription property to avoid TypeScript issues
      const subscriptionRef = (invoice as any).subscription;
      if (subscriptionRef && invoice.billing_reason === 'subscription_cycle') {
        console.log('🔄 Processing subscription renewal...');
        try {
          // Get subscription ID (handle both string and expanded object)
          const subscriptionId = typeof subscriptionRef === 'string' 
            ? subscriptionRef 
            : subscriptionRef.id;
          
          // Fetch the subscription to get updated data
          const renewedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          await handleSubscriptionChange(renewedSubscription);
          
          // Track renewal with PostHog
          const customerId = invoice.customer as string;
          const team = await getTeamByStripeCustomerId(customerId);
          
          if (team) {
            const { PostHog } = require('posthog-node');
            const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
              host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
            });
            
            posthogClient.capture({
              distinctId: team.id,
              event: 'Subscription Renewed Successfully',
              properties: {
                teamId: team.id,
                subscriptionId: renewedSubscription.id,
                invoiceId: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                planName: team.planName,
                timestamp: new Date().toISOString(),
                source: 'server_side_stripe_webhook'
              }
            });
            
            await posthogClient.shutdown();
          }
        } catch (error) {
          console.error('❌ Error handling subscription renewal:', error);
        }
      }
      break;

    case 'invoice.payment_failed':
      // Handle failed payments
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log(`❌ Invoice payment failed: ${failedInvoice.id}, Customer: ${failedInvoice.customer}`);
      
      // If it's a subscription invoice, we might need to handle the failed payment
      const failedSubscriptionRef = (failedInvoice as any).subscription;
      if (failedSubscriptionRef) {
        try {
          const subscriptionId = typeof failedSubscriptionRef === 'string' 
            ? failedSubscriptionRef 
            : failedSubscriptionRef.id;
          
          const failedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          console.log(`📋 Subscription status after failed payment: ${failedSubscription.status}`);
          
          // Update subscription status in our database
          await handleSubscriptionChange(failedSubscription);
        } catch (error) {
          console.error('❌ Error handling failed payment:', error);
        }
      }
      break;

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
