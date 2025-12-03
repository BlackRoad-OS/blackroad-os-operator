/**
 * BlackRoad Stripe Billing Worker
 * Manages subscriptions, usage metering, and billing queries
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  BILLING_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-Served-By': 'blackroad-stripe-billing'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // GET /subscription/:customer_id - Get subscription details
      if (path.match(/^\/subscription\/[\w]+$/) && request.method === 'GET') {
        const customerId = path.split('/').pop()!;
        const subscription = await getSubscription(env, customerId);
        return jsonResponse(subscription, 200, corsHeaders);
      }

      // POST /usage - Report usage for metered billing
      if (path === '/usage' && request.method === 'POST') {
        const body = await request.json() as {
          subscription_item_id: string;
          quantity: number;
          timestamp?: number;
          action?: string;
        };
        const result = await reportUsage(env, body);
        return jsonResponse(result, 200, corsHeaders);
      }

      // GET /invoices/:customer_id - Get customer invoices
      if (path.match(/^\/invoices\/[\w]+$/) && request.method === 'GET') {
        const customerId = path.split('/').pop()!;
        const invoices = await getInvoices(env, customerId);
        return jsonResponse(invoices, 200, corsHeaders);
      }

      // POST /cancel - Cancel subscription
      if (path === '/cancel' && request.method === 'POST') {
        const body = await request.json() as { subscription_id: string; immediately?: boolean };
        const result = await cancelSubscription(env, body);
        return jsonResponse(result, 200, corsHeaders);
      }

      // POST /upgrade - Upgrade/downgrade subscription
      if (path === '/upgrade' && request.method === 'POST') {
        const body = await request.json() as { subscription_id: string; new_price_id: string };
        const result = await changeSubscription(env, body);
        return jsonResponse(result, 200, corsHeaders);
      }

      // GET /usage-summary/:subscription_id - Get usage summary
      if (path.match(/^\/usage-summary\/[\w]+$/) && request.method === 'GET') {
        const subscriptionId = path.split('/').pop()!;
        const summary = await getUsageSummary(env, subscriptionId);
        return jsonResponse(summary, 200, corsHeaders);
      }

      // GET /health
      if (path === '/health') {
        return jsonResponse({
          status: 'healthy',
          service: 'blackroad-stripe-billing',
          timestamp: new Date().toISOString(),
          endpoints: [
            'GET /subscription/:customer_id',
            'POST /usage',
            'GET /invoices/:customer_id',
            'POST /cancel',
            'POST /upgrade',
            'GET /usage-summary/:subscription_id'
          ]
        }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error) {
      return jsonResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function getSubscription(env: Env, customerId: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=all&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    }
  );
  const data = await response.json() as { data: any[] };

  if (!data.data?.length) {
    return { success: false, error: 'No subscription found' };
  }

  const sub = data.data[0];
  return {
    success: true,
    subscription: {
      id: sub.id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      plan: sub.items?.data?.[0]?.price?.nickname || 'Unknown',
      amount: sub.items?.data?.[0]?.price?.unit_amount / 100
    }
  };
}

async function reportUsage(env: Env, params: {
  subscription_item_id: string;
  quantity: number;
  timestamp?: number;
  action?: string;
}) {
  const response = await fetch(
    `https://api.stripe.com/v1/subscription_items/${params.subscription_item_id}/usage_records`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        quantity: params.quantity.toString(),
        timestamp: (params.timestamp || Math.floor(Date.now() / 1000)).toString(),
        action: params.action || 'increment'
      }).toString()
    }
  );

  const data = await response.json();
  return {
    success: response.ok,
    usage_record: data
  };
}

async function getInvoices(env: Env, customerId: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/invoices?customer=${customerId}&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    }
  );

  const data = await response.json() as { data: any[] };

  return {
    success: true,
    invoices: data.data?.map((inv: any) => ({
      id: inv.id,
      number: inv.number,
      amount_due: inv.amount_due / 100,
      amount_paid: inv.amount_paid / 100,
      status: inv.status,
      created: inv.created,
      hosted_invoice_url: inv.hosted_invoice_url,
      pdf: inv.invoice_pdf
    })) || []
  };
}

async function cancelSubscription(env: Env, params: { subscription_id: string; immediately?: boolean }) {
  const endpoint = params.immediately
    ? `https://api.stripe.com/v1/subscriptions/${params.subscription_id}`
    : `https://api.stripe.com/v1/subscriptions/${params.subscription_id}`;

  const body = params.immediately
    ? {}
    : { cancel_at_period_end: 'true' };

  const response = await fetch(endpoint, {
    method: params.immediately ? 'DELETE' : 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body).toString()
  });

  const data = await response.json();
  return {
    success: response.ok,
    subscription: data,
    canceled_immediately: params.immediately
  };
}

async function changeSubscription(env: Env, params: { subscription_id: string; new_price_id: string }) {
  // First get the subscription to find the item ID
  const subResponse = await fetch(
    `https://api.stripe.com/v1/subscriptions/${params.subscription_id}`,
    {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    }
  );
  const subscription = await subResponse.json() as { items: { data: { id: string }[] } };
  const itemId = subscription.items?.data?.[0]?.id;

  if (!itemId) {
    return { success: false, error: 'Subscription item not found' };
  }

  // Update the subscription
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${params.subscription_id}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        [`items[0][id]`]: itemId,
        [`items[0][price]`]: params.new_price_id,
        'proration_behavior': 'create_prorations'
      }).toString()
    }
  );

  const data = await response.json();
  return {
    success: response.ok,
    subscription: data,
    upgraded_to: params.new_price_id
  };
}

async function getUsageSummary(env: Env, subscriptionId: string) {
  // Get subscription items first
  const subResponse = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    }
  );
  const subscription = await subResponse.json() as { items: { data: { id: string }[] } };
  const itemId = subscription.items?.data?.[0]?.id;

  if (!itemId) {
    return { success: false, error: 'Subscription item not found' };
  }

  const response = await fetch(
    `https://api.stripe.com/v1/subscription_items/${itemId}/usage_record_summaries?limit=12`,
    {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    }
  );

  const data = await response.json() as { data: any[] };
  return {
    success: true,
    subscription_id: subscriptionId,
    summaries: data.data || []
  };
}
