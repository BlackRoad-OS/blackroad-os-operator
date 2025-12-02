/**
 * ═══════════════════════════════════════════════════════════════════
 * BLACKROAD OS BILLING WORKER
 * ═══════════════════════════════════════════════════════════════════
 *
 * Stripe integration for agent billing and metering.
 *
 * Fee structure ($4000/month target):
 * - API calls: $0.001 per call (metered)
 * - Agent registration: $1 per agent
 * - Premium features: $10/month per agent
 * - Enterprise: Custom
 *
 * ALEXA LOUISE AMUNDSON - VERIFIED OWNER
 * ═══════════════════════════════════════════════════════════════════
 */

const STRIPE_API = 'https://api.stripe.com/v1';

// ═══════════════════════════════════════════════════════════════════
// STRIPE API HELPERS
// ═══════════════════════════════════════════════════════════════════

async function stripeRequest(env, endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options = { method, headers };

  if (body && method !== 'GET') {
    options.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(`${STRIPE_API}${endpoint}`, options);
  return response.json();
}

// ═══════════════════════════════════════════════════════════════════
// BILLING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a Stripe customer for an agent or user
 */
async function createCustomer(env, email, name, metadata = {}) {
  return stripeRequest(env, '/customers', 'POST', {
    email,
    name,
    'metadata[owner]': env.OWNER,
    'metadata[source]': 'blackroad-billing',
    ...Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])
    )
  });
}

/**
 * Get customer by ID
 */
async function getCustomer(env, customerId) {
  return stripeRequest(env, `/customers/${customerId}`);
}

/**
 * Create a usage record (for metered billing)
 */
async function createUsageRecord(env, subscriptionItemId, quantity, timestamp = null) {
  return stripeRequest(env, `/subscription_items/${subscriptionItemId}/usage_records`, 'POST', {
    quantity: quantity.toString(),
    timestamp: timestamp || Math.floor(Date.now() / 1000).toString(),
    action: 'increment'
  });
}

/**
 * Create a checkout session
 */
async function createCheckoutSession(env, customerId, priceId, successUrl, cancelUrl) {
  return stripeRequest(env, '/checkout/sessions', 'POST', {
    customer: customerId,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl
  });
}

/**
 * Create a billing portal session
 */
async function createPortalSession(env, customerId, returnUrl) {
  return stripeRequest(env, '/billing_portal/sessions', 'POST', {
    customer: customerId,
    return_url: returnUrl
  });
}

/**
 * List invoices for a customer
 */
async function listInvoices(env, customerId, limit = 10) {
  return stripeRequest(env, `/invoices?customer=${customerId}&limit=${limit}`);
}

/**
 * Get balance for a customer
 */
async function getBalance(env, customerId) {
  const customer = await getCustomer(env, customerId);
  return {
    balance: customer.balance || 0,
    currency: customer.currency || 'usd',
    balance_formatted: `$${Math.abs((customer.balance || 0) / 100).toFixed(2)}`
  };
}

// ═══════════════════════════════════════════════════════════════════
// USAGE TRACKING
// ═══════════════════════════════════════════════════════════════════

/**
 * Track API usage for billing
 */
async function trackUsage(env, agentId, endpoint, cost = 0.001) {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  // Increment usage counter
  const usageKey = `usage:${agentId}:${monthKey}`;
  const current = parseInt(await env.BILLING.get(usageKey) || '0', 10);
  await env.BILLING.put(usageKey, String(current + 1));

  // Track cost
  const costKey = `cost:${agentId}:${monthKey}`;
  const currentCost = parseFloat(await env.BILLING.get(costKey) || '0');
  await env.BILLING.put(costKey, String(currentCost + cost));

  return {
    agent_id: agentId,
    month: monthKey,
    calls: current + 1,
    cost_usd: currentCost + cost
  };
}

/**
 * Get usage summary for an agent
 */
async function getUsageSummary(env, agentId) {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  const usageKey = `usage:${agentId}:${monthKey}`;
  const costKey = `cost:${agentId}:${monthKey}`;

  const calls = parseInt(await env.BILLING.get(usageKey) || '0', 10);
  const cost = parseFloat(await env.BILLING.get(costKey) || '0');

  return {
    agent_id: agentId,
    period: monthKey,
    total_calls: calls,
    total_cost_usd: cost,
    rate_per_call: 0.001,
    billing_status: 'active'
  };
}

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK HANDLING
// ═══════════════════════════════════════════════════════════════════

/**
 * Verify Stripe webhook signature
 */
async function verifyWebhookSignature(env, payload, signature) {
  // Stripe signature verification
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { verified: false, error: 'No webhook secret configured' };

  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !sig) {
    return { verified: false, error: 'Invalid signature format' };
  }

  // Check timestamp (within 5 minutes)
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (age > 300) {
    return { verified: false, error: 'Timestamp too old' };
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (sig !== expectedSig) {
    return { verified: false, error: 'Signature mismatch' };
  }

  return { verified: true };
}

/**
 * Handle Stripe webhooks
 */
async function handleWebhook(request, env, headers) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, headers, 400);
  }

  const verification = await verifyWebhookSignature(env, payload, signature);
  if (!verification.verified) {
    return json({ error: verification.error }, headers, 400);
  }

  const event = JSON.parse(payload);

  // Log event
  await env.BILLING.put(`webhook:${event.id}`, JSON.stringify({
    type: event.type,
    received_at: new Date().toISOString(),
    data: event.data
  }));

  // Handle specific events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Update subscription status
      const subscription = event.data.object;
      await env.BILLING.put(`subscription:${subscription.customer}`, JSON.stringify({
        subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        updated_at: new Date().toISOString()
      }));
      break;

    case 'customer.subscription.deleted':
      // Mark subscription as canceled
      const canceled = event.data.object;
      await env.BILLING.put(`subscription:${canceled.customer}`, JSON.stringify({
        subscription_id: canceled.id,
        status: 'canceled',
        canceled_at: new Date().toISOString()
      }));
      break;

    case 'invoice.paid':
      // Record successful payment
      const invoice = event.data.object;
      await env.BILLING.put(`payment:${invoice.id}`, JSON.stringify({
        customer: invoice.customer,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        paid_at: new Date().toISOString()
      }));
      break;

    case 'invoice.payment_failed':
      // Alert on failed payment
      const failedInvoice = event.data.object;
      await env.BILLING.put(`payment_failed:${failedInvoice.id}`, JSON.stringify({
        customer: failedInvoice.customer,
        amount: failedInvoice.amount_due,
        error: failedInvoice.last_payment_error,
        failed_at: new Date().toISOString()
      }));
      break;
  }

  return json({ received: true, event_id: event.id }, headers);
}

// ═══════════════════════════════════════════════════════════════════
// HTTP HANDLERS
// ═══════════════════════════════════════════════════════════════════

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === '/health') {
        return json({
          status: 'ok',
          service: 'blackroad-billing',
          version: env.VERSION,
          stripe_configured: !!env.STRIPE_SECRET_KEY
        }, corsHeaders);
      }

      // Stripe webhook
      if (path === '/webhook' && request.method === 'POST') {
        return handleWebhook(request, env, corsHeaders);
      }

      // Create customer
      if (path === '/customers' && request.method === 'POST') {
        const body = await request.json();
        const customer = await createCustomer(env, body.email, body.name, body.metadata);
        return json(customer, corsHeaders, 201);
      }

      // Get customer
      if (path.match(/^\/customers\/[^/]+$/) && request.method === 'GET') {
        const customerId = path.split('/')[2];
        const customer = await getCustomer(env, customerId);
        return json(customer, corsHeaders);
      }

      // Get customer balance
      if (path.match(/^\/customers\/[^/]+\/balance$/) && request.method === 'GET') {
        const customerId = path.split('/')[2];
        const balance = await getBalance(env, customerId);
        return json(balance, corsHeaders);
      }

      // List invoices
      if (path.match(/^\/customers\/[^/]+\/invoices$/) && request.method === 'GET') {
        const customerId = path.split('/')[2];
        const invoices = await listInvoices(env, customerId);
        return json(invoices, corsHeaders);
      }

      // Create checkout session
      if (path === '/checkout' && request.method === 'POST') {
        const body = await request.json();
        const session = await createCheckoutSession(
          env,
          body.customer_id,
          body.price_id,
          body.success_url,
          body.cancel_url
        );
        return json(session, corsHeaders);
      }

      // Create billing portal session
      if (path === '/portal' && request.method === 'POST') {
        const body = await request.json();
        const session = await createPortalSession(env, body.customer_id, body.return_url);
        return json(session, corsHeaders);
      }

      // Track usage
      if (path === '/usage' && request.method === 'POST') {
        const body = await request.json();
        const usage = await trackUsage(env, body.agent_id, body.endpoint, body.cost);
        return json(usage, corsHeaders);
      }

      // Get usage summary
      if (path.match(/^\/usage\/[^/]+$/) && request.method === 'GET') {
        const agentId = path.split('/')[2];
        const summary = await getUsageSummary(env, agentId);
        return json(summary, corsHeaders);
      }

      // Billing overview (for dashboard)
      if (path === '/overview' && request.method === 'GET') {
        const now = new Date();
        const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

        // Get totals from KV
        const list = await env.BILLING.list({ prefix: `cost:` });
        let totalCost = 0;
        let totalCalls = 0;

        for (const key of list.keys) {
          if (key.name.includes(monthKey)) {
            const cost = parseFloat(await env.BILLING.get(key.name) || '0');
            totalCost += cost;
          }
        }

        const callsList = await env.BILLING.list({ prefix: `usage:` });
        for (const key of callsList.keys) {
          if (key.name.includes(monthKey)) {
            const calls = parseInt(await env.BILLING.get(key.name) || '0', 10);
            totalCalls += calls;
          }
        }

        return json({
          period: monthKey,
          total_calls: totalCalls,
          total_revenue_usd: totalCost,
          target_usd: 4000,
          progress_percent: ((totalCost / 4000) * 100).toFixed(2),
          rate_per_call: 0.001,
          pricing: {
            api_call: '$0.001',
            agent_registration: '$1.00',
            premium_monthly: '$10.00'
          }
        }, corsHeaders);
      }

      // 404
      return json({
        error: 'Not found',
        path,
        available_endpoints: [
          'GET /health',
          'POST /webhook',
          'POST /customers',
          'GET /customers/:id',
          'GET /customers/:id/balance',
          'GET /customers/:id/invoices',
          'POST /checkout',
          'POST /portal',
          'POST /usage',
          'GET /usage/:agent_id',
          'GET /overview'
        ]
      }, corsHeaders, 404);

    } catch (error) {
      console.error('Billing error:', error);
      return json({ error: error.message }, corsHeaders, 500);
    }
  }
};
