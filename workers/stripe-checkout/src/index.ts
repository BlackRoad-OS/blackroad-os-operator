/**
 * BlackRoad Stripe Checkout Worker
 * Creates checkout sessions for BlackRoad OS subscriptions
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  SUCCESS_URL: string;
  CANCEL_URL: string;
}

// BlackRoad OS Pricing Plans
const PLANS = {
  starter: {
    name: 'BlackRoad Starter',
    price_id: 'price_starter', // Replace with actual Stripe price ID
    amount: 999, // $9.99
    features: ['5 API calls/day', 'Basic Cece access', 'Community support']
  },
  pro: {
    name: 'BlackRoad Pro',
    price_id: 'price_pro',
    amount: 2999, // $29.99
    features: ['Unlimited API calls', 'Full Cece access', 'Priority support', 'Custom agents']
  },
  enterprise: {
    name: 'BlackRoad Enterprise',
    price_id: 'price_enterprise',
    amount: 9999, // $99.99
    features: ['Everything in Pro', 'Dedicated infrastructure', 'SLA guarantee', 'Custom integrations']
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Served-By': 'blackroad-stripe-checkout'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Root path - service info
      if (url.pathname === '/' || url.pathname === '') {
        return new Response(JSON.stringify({
          service: 'blackroad-stripe-checkout',
          status: 'online',
          version: '1.0.0',
          owner: 'Alexa Louise Amundson',
          description: 'Stripe Checkout Session Creator',
          endpoints: ['/plans', '/create-checkout', '/create-portal', '/health'],
          plans: Object.keys(PLANS)
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /plans - List available plans
      if (url.pathname === '/plans' && request.method === 'GET') {
        return new Response(JSON.stringify({
          success: true,
          plans: PLANS,
          publishable_key: env.STRIPE_PUBLISHABLE_KEY
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /create-checkout - Create Stripe checkout session
      if (url.pathname === '/create-checkout' && request.method === 'POST') {
        const body = await request.json() as { plan: string; email?: string; metadata?: Record<string, string> };
        const { plan, email, metadata } = body;

        if (!plan || !PLANS[plan as keyof typeof PLANS]) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid plan. Choose: starter, pro, or enterprise'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS];

        // Create Stripe Checkout Session
        const session = await createCheckoutSession(env, {
          price_id: selectedPlan.price_id,
          email,
          metadata: {
            plan,
            ...metadata
          },
          success_url: env.SUCCESS_URL || 'https://blackroad.io/success',
          cancel_url: env.CANCEL_URL || 'https://blackroad.io/cancel'
        });

        return new Response(JSON.stringify({
          success: true,
          session_id: session.id,
          checkout_url: session.url
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /create-portal - Create customer portal session
      if (url.pathname === '/create-portal' && request.method === 'POST') {
        const body = await request.json() as { customer_id: string };
        const { customer_id } = body;

        if (!customer_id) {
          return new Response(JSON.stringify({
            success: false,
            error: 'customer_id required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const portal = await createPortalSession(env, customer_id);

        return new Response(JSON.stringify({
          success: true,
          portal_url: portal.url
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'blackroad-stripe-checkout',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: 'Not found',
        endpoints: ['/plans', '/create-checkout', '/create-portal', '/health']
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function createCheckoutSession(env: Env, options: {
  price_id: string;
  email?: string;
  metadata?: Record<string, string>;
  success_url: string;
  cancel_url: string;
}) {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'mode': 'subscription',
      'line_items[0][price]': options.price_id,
      'line_items[0][quantity]': '1',
      'success_url': options.success_url,
      'cancel_url': options.cancel_url,
      ...(options.email ? { 'customer_email': options.email } : {}),
      ...Object.entries(options.metadata || {}).reduce((acc, [k, v]) => {
        acc[`metadata[${k}]`] = v;
        return acc;
      }, {} as Record<string, string>)
    }).toString()
  });

  return response.json();
}

async function createPortalSession(env: Env, customer_id: string) {
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'customer': customer_id,
      'return_url': 'https://blackroad.io/dashboard'
    }).toString()
  });

  return response.json();
}
