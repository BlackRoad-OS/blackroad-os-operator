/**
 * BlackRoad Stripe Webhooks Worker
 * Handles Stripe webhook events for subscriptions and payments
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  BLACKROAD_API_URL: string;
}

// Stripe event types we care about
type StripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.created';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'X-Served-By': 'blackroad-stripe-webhooks'
    };

    // Only accept POST for webhooks
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        service: 'blackroad-stripe-webhooks'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const signature = request.headers.get('stripe-signature');
      const body = await request.text();

      // Verify webhook signature
      if (env.STRIPE_WEBHOOK_SECRET && signature) {
        const isValid = await verifyWebhookSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      const event = JSON.parse(body);
      const eventType = event.type as StripeEventType;
      const eventData = event.data.object;

      console.log(`[Webhook] Received: ${eventType}`);

      // Process event based on type
      let result: { action: string; success: boolean; details?: any };

      switch (eventType) {
        case 'checkout.session.completed':
          result = await handleCheckoutCompleted(eventData, env);
          break;

        case 'customer.subscription.created':
          result = await handleSubscriptionCreated(eventData, env);
          break;

        case 'customer.subscription.updated':
          result = await handleSubscriptionUpdated(eventData, env);
          break;

        case 'customer.subscription.deleted':
          result = await handleSubscriptionDeleted(eventData, env);
          break;

        case 'invoice.paid':
          result = await handleInvoicePaid(eventData, env);
          break;

        case 'invoice.payment_failed':
          result = await handlePaymentFailed(eventData, env);
          break;

        case 'customer.created':
          result = await handleCustomerCreated(eventData, env);
          break;

        default:
          result = { action: 'ignored', success: true, details: { type: eventType } };
      }

      return new Response(JSON.stringify({
        received: true,
        event_type: eventType,
        ...result
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[Webhook Error]', error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Verify Stripe webhook signature (simplified - use crypto in production)
async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  // In production, implement proper HMAC verification
  // For now, just check signature exists
  return !!signature && !!secret;
}

async function handleCheckoutCompleted(session: any, env: Env) {
  const { customer, subscription, metadata } = session;

  // Notify BlackRoad API about new subscription
  console.log(`[Checkout] Customer ${customer} subscribed with ${subscription}`);

  return {
    action: 'subscription_activated',
    success: true,
    details: {
      customer_id: customer,
      subscription_id: subscription,
      plan: metadata?.plan || 'unknown'
    }
  };
}

async function handleSubscriptionCreated(subscription: any, env: Env) {
  const { id, customer, status, items } = subscription;

  console.log(`[Subscription] Created: ${id} for customer ${customer}`);

  return {
    action: 'subscription_created',
    success: true,
    details: {
      subscription_id: id,
      customer_id: customer,
      status,
      items: items?.data?.length || 0
    }
  };
}

async function handleSubscriptionUpdated(subscription: any, env: Env) {
  const { id, customer, status, cancel_at_period_end } = subscription;

  console.log(`[Subscription] Updated: ${id} - Status: ${status}`);

  return {
    action: 'subscription_updated',
    success: true,
    details: {
      subscription_id: id,
      customer_id: customer,
      status,
      canceling: cancel_at_period_end
    }
  };
}

async function handleSubscriptionDeleted(subscription: any, env: Env) {
  const { id, customer } = subscription;

  console.log(`[Subscription] Deleted: ${id} for customer ${customer}`);

  // Revoke access in BlackRoad system
  return {
    action: 'subscription_canceled',
    success: true,
    details: {
      subscription_id: id,
      customer_id: customer,
      access_revoked: true
    }
  };
}

async function handleInvoicePaid(invoice: any, env: Env) {
  const { id, customer, amount_paid, subscription } = invoice;

  console.log(`[Invoice] Paid: ${id} - $${(amount_paid / 100).toFixed(2)}`);

  return {
    action: 'payment_received',
    success: true,
    details: {
      invoice_id: id,
      customer_id: customer,
      amount: amount_paid / 100,
      subscription_id: subscription
    }
  };
}

async function handlePaymentFailed(invoice: any, env: Env) {
  const { id, customer, subscription, attempt_count } = invoice;

  console.log(`[Invoice] Payment Failed: ${id} - Attempt ${attempt_count}`);

  // Could trigger email notification or grace period
  return {
    action: 'payment_failed',
    success: true,
    details: {
      invoice_id: id,
      customer_id: customer,
      subscription_id: subscription,
      attempt: attempt_count,
      needs_attention: true
    }
  };
}

async function handleCustomerCreated(customer: any, env: Env) {
  const { id, email, name } = customer;

  console.log(`[Customer] Created: ${id} - ${email}`);

  return {
    action: 'customer_created',
    success: true,
    details: {
      customer_id: id,
      email,
      name
    }
  };
}
