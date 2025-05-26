import { NextRequest, NextResponse } from 'next/server';
import { getTeamByStripeCustomerId } from '@/lib/db/queries';

// Debug endpoint to check webhook configuration
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Stripe Webhook Debug Endpoint',
    timestamp: new Date().toISOString(),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'CONFIGURED' : 'MISSING',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'CONFIGURED' : 'MISSING',
    endpoints: {
      webhook: '/api/stripe/webhook',
      checkout: '/api/stripe/checkout'
    }
  });
}

// Store recent webhook events for debugging
let recentEvents: any[] = [];

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  
  console.log('🔍 Webhook Debug - Received event');
  console.log('📋 Payload length:', payload.length);
  console.log('🔑 Signature present:', !!signature);
  console.log('🔧 Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);
  
  try {
    // Try to parse the event without verification for debugging
    const eventData = JSON.parse(payload);
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      eventType: eventData.type,
      eventId: eventData.id,
      hasSignature: !!signature,
      webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      payloadSize: payload.length,
      status: 'received'
    };
    
    // Add special handling for subscription events
    if (eventData.type?.includes('subscription') || eventData.type?.includes('invoice')) {
      try {
        const customerId = eventData.data?.object?.customer;
        if (customerId) {
          const team = await getTeamByStripeCustomerId(customerId);
          debugInfo.teamFound = !!team;
          debugInfo.teamId = team?.id;
          debugInfo.customerId = customerId;
        }
      } catch (error: any) {
        debugInfo.teamLookupError = error.message;
      }
    }
    
    // Store recent events (keep last 10)
    recentEvents.unshift(debugInfo);
    if (recentEvents.length > 10) {
      recentEvents = recentEvents.slice(0, 10);
    }
    
    console.log('🎯 Event debug info:', debugInfo);
    
    return NextResponse.json({ 
      received: true, 
      debug: debugInfo,
      recentEvents: recentEvents.length
    });
    
  } catch (error) {
    console.error('❌ Webhook debug error:', error);
    
    const errorInfo: any = {
      timestamp: new Date().toISOString(),
      error: (error as any).message,
      hasSignature: !!signature,
      webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      payloadSize: payload.length,
      status: 'error'
    };
    
    recentEvents.unshift(errorInfo);
    if (recentEvents.length > 10) {
      recentEvents = recentEvents.slice(0, 10);
    }
    
    return NextResponse.json({ 
      error: true, 
      debug: errorInfo,
      recentEvents: recentEvents.length
    });
  }
} 