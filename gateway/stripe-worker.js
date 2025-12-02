/**
 * BlackRoad Gateway - Stripe Integration Worker
 *
 * Handles:
 * - Checkout session creation
 * - Webhook processing for subscription events
 * - Customer portal access
 *
 * Deploy: npx wrangler deploy -c wrangler-stripe.toml
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Stripe-Signature',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Stripe API helper
async function stripeRequest(env, endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  if (body) {
    options.body = new URLSearchParams(body).toString();
  }

  const resp = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  return resp.json();
}

// ============================================================================
// PRODUCTS & PRICES (run once to set up)
// ============================================================================

async function setupStripeProducts(env) {
  // Create product
  const product = await stripeRequest(env, '/products', 'POST', {
    name: 'BlackRoad Gateway',
    description: 'AI Agent Gateway with persistent memory and identity',
  });

  // Create prices
  const proPriceMonthly = await stripeRequest(env, '/prices', 'POST', {
    product: product.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'gateway_pro_monthly',
  });

  const teamPriceMonthly = await stripeRequest(env, '/prices', 'POST', {
    product: product.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'gateway_team_monthly',
  });

  // Annual with discount
  const proPriceYearly = await stripeRequest(env, '/prices', 'POST', {
    product: product.id,
    unit_amount: 29000, // $290/year (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' },
    lookup_key: 'gateway_pro_yearly',
  });

  const teamPriceYearly = await stripeRequest(env, '/prices', 'POST', {
    product: product.id,
    unit_amount: 99000, // $990/year (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' },
    lookup_key: 'gateway_team_yearly',
  });

  return {
    product: product.id,
    prices: {
      pro_monthly: proPriceMonthly.id,
      pro_yearly: proPriceYearly.id,
      team_monthly: teamPriceMonthly.id,
      team_yearly: teamPriceYearly.id,
    }
  };
}

// ============================================================================
// CHECKOUT SESSION
// ============================================================================

async function createCheckoutSession(env, request) {
  const body = await request.json();
  const { priceId, apiKeyHash, successUrl, cancelUrl } = body;

  if (!priceId || !apiKeyHash) {
    return json({ error: 'Missing priceId or apiKeyHash' }, 400);
  }

  // Determine tier from price
  let tier = 'pro';
  if (priceId.includes('team')) tier = 'team';

  const session = await stripeRequest(env, '/checkout/sessions', 'POST', {
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': 1,
    success_url: successUrl || `${env.GATEWAY_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${env.GATEWAY_URL}/?canceled=true`,
    'metadata[apiKeyHash]': apiKeyHash,
    'metadata[tier]': tier,
    'subscription_data[metadata][apiKeyHash]': apiKeyHash,
    'subscription_data[metadata][tier]': tier,
  });

  return json({
    sessionId: session.id,
    url: session.url,
  });
}

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

async function createPortalSession(env, request) {
  const body = await request.json();
  const { customerId, returnUrl } = body;

  if (!customerId) {
    return json({ error: 'Missing customerId' }, 400);
  }

  const session = await stripeRequest(env, '/billing_portal/sessions', 'POST', {
    customer: customerId,
    return_url: returnUrl || env.GATEWAY_URL,
  });

  return json({ url: session.url });
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

async function verifyWebhookSignature(payload, signature, secret) {
  const encoder = new TextEncoder();

  // Parse signature header
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const sig = parts.v1;

  // Create signed payload
  const signedPayload = `${timestamp}.${payload}`;

  // Compute expected signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return sig === expectedSig;
}

async function handleWebhook(env, request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Verify signature in production
  if (env.STRIPE_WEBHOOK_SECRET && signature) {
    const isValid = await verifyWebhookSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return json({ error: 'Invalid signature' }, 400);
    }
  }

  const event = JSON.parse(payload);
  console.log(`Webhook received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const apiKeyHash = session.metadata?.apiKeyHash;
      const tier = session.metadata?.tier || 'pro';
      const customerId = session.customer;

      if (apiKeyHash) {
        // Update identity in gateway
        await updateGatewayIdentity(env, apiKeyHash, tier, customerId);
        console.log(`Upgraded ${apiKeyHash} to ${tier}`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const apiKeyHash = subscription.metadata?.apiKeyHash;
      const tier = subscription.metadata?.tier || 'pro';

      if (subscription.status === 'active' && apiKeyHash) {
        await updateGatewayIdentity(env, apiKeyHash, tier, subscription.customer);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const apiKeyHash = subscription.metadata?.apiKeyHash;

      if (apiKeyHash) {
        // Downgrade to free
        await updateGatewayIdentity(env, apiKeyHash, 'free', null);
        console.log(`Downgraded ${apiKeyHash} to free`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      // Get subscription to find apiKeyHash
      const subscription = await stripeRequest(env, `/subscriptions/${subscriptionId}`);
      const apiKeyHash = subscription.metadata?.apiKeyHash;

      if (apiKeyHash) {
        // Could send email notification, downgrade after grace period, etc.
        console.log(`Payment failed for ${apiKeyHash}`);
      }
      break;
    }
  }

  return json({ received: true });
}

// Update the gateway identity via KV
async function updateGatewayIdentity(env, apiKeyHash, tier, customerId) {
  // Get current identity
  let identity = await env.IDENTITIES.get(apiKeyHash, 'json');

  if (identity) {
    identity.tier = tier;
    if (customerId) identity.stripeCustomerId = customerId;
    identity.tierUpdated = Date.now();
    await env.IDENTITIES.put(apiKeyHash, JSON.stringify(identity));
  }
}

// ============================================================================
// GET PRICES
// ============================================================================

async function getPrices(env) {
  const prices = await stripeRequest(env, '/prices?active=true&expand[]=data.product');

  const formatted = prices.data
    .filter(p => p.lookup_key?.startsWith('gateway_'))
    .map(p => ({
      id: p.id,
      lookup_key: p.lookup_key,
      amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval,
      product: p.product?.name,
    }));

  return json({ prices: formatted });
}

// ============================================================================
// ROUTER
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        service: 'blackroad-gateway-billing',
        version: '1.0.0',
        status: 'online',
      });
    }

    // Get available prices
    if (url.pathname === '/prices' && request.method === 'GET') {
      return getPrices(env);
    }

    // Create checkout session
    if (url.pathname === '/checkout' && request.method === 'POST') {
      return createCheckoutSession(env, request);
    }

    // Customer portal
    if (url.pathname === '/portal' && request.method === 'POST') {
      return createPortalSession(env, request);
    }

    // Stripe webhook
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(env, request);
    }

    // Setup products (one-time, protect in production)
    if (url.pathname === '/setup' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.SETUP_SECRET}`) {
        return json({ error: 'Unauthorized' }, 401);
      }
      const result = await setupStripeProducts(env);
      return json(result);
    }

    return json({ error: 'Not found' }, 404);
  }
};
