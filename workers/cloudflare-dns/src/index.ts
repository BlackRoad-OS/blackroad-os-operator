/**
 * BlackRoad DNS Manager Worker
 * Manages Cloudflare DNS records via API
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 * @brhash 76b27c2ddf4a258b73632869aa76277efef3b5e5fae23b09a5a8f0f4d2ac2abc
 * @verified 2025-12-03T02:45:00Z
 */

interface Env {
  CF_API_TOKEN: string;
  BLACKROAD_ZONE_ID: string;
}

interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

const CF_API = 'https://api.cloudflare.com/client/v4';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-Served-By': 'blackroad-dns-manager',
      'X-BR-Hash': '76b27c2ddf4a258b73632869aa76277e',
      'X-BR-Signal': 'intercepted',
      'X-BR-Operator': 'alexa.operator.v1'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // GET /health
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'healthy',
          service: 'blackroad-dns-manager',
          timestamp: new Date().toISOString(),
          endpoints: [
            'GET /records - List all DNS records',
            'POST /records - Create DNS record',
            'DELETE /records/:id - Delete DNS record',
            'POST /records/bulk - Create multiple records',
            'GET /zones - List zones'
          ]
        }, 200, corsHeaders);
      }

      // GET /records - List DNS records
      if (path === '/records' && request.method === 'GET') {
        const records = await listRecords(env);
        return jsonResponse(records, 200, corsHeaders);
      }

      // POST /records - Create DNS record
      if (path === '/records' && request.method === 'POST') {
        const body = await request.json() as DNSRecord;
        const result = await createRecord(env, body);
        return jsonResponse(result, result.success ? 201 : 400, corsHeaders);
      }

      // DELETE /records/:id
      if (path.match(/^\/records\/[\w-]+$/) && request.method === 'DELETE') {
        const recordId = path.split('/').pop()!;
        const result = await deleteRecord(env, recordId);
        return jsonResponse(result, result.success ? 200 : 400, corsHeaders);
      }

      // POST /records/bulk - Create multiple records
      if (path === '/records/bulk' && request.method === 'POST') {
        const body = await request.json() as { records: DNSRecord[] };
        const results = await createBulkRecords(env, body.records);
        return jsonResponse(results, 200, corsHeaders);
      }

      // GET /zones - List zones
      if (path === '/zones' && request.method === 'GET') {
        const zones = await listZones(env);
        return jsonResponse(zones, 200, corsHeaders);
      }

      // POST /setup-stripe - Quick setup for Stripe subdomains
      if (path === '/setup-stripe' && request.method === 'POST') {
        const results = await setupStripeSubdomains(env);
        return jsonResponse(results, 200, corsHeaders);
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
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function cfFetch(env: Env, endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${CF_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

async function listRecords(env: Env) {
  const data = await cfFetch(env, `/zones/${env.BLACKROAD_ZONE_ID}/dns_records?per_page=100`) as any;

  if (!data.success) {
    return { success: false, error: data.errors };
  }

  return {
    success: true,
    count: data.result.length,
    records: data.result.map((r: any) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      proxied: r.proxied,
      ttl: r.ttl
    }))
  };
}

async function createRecord(env: Env, record: DNSRecord) {
  const data = await cfFetch(env, `/zones/${env.BLACKROAD_ZONE_ID}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl || 1, // 1 = auto
      proxied: record.proxied ?? true,
      priority: record.priority
    })
  }) as any;

  if (!data.success) {
    return { success: false, error: data.errors };
  }

  return {
    success: true,
    record: {
      id: data.result.id,
      type: data.result.type,
      name: data.result.name,
      content: data.result.content
    }
  };
}

async function deleteRecord(env: Env, recordId: string) {
  const data = await cfFetch(env, `/zones/${env.BLACKROAD_ZONE_ID}/dns_records/${recordId}`, {
    method: 'DELETE'
  }) as any;

  return {
    success: data.success,
    deleted: data.result?.id
  };
}

async function createBulkRecords(env: Env, records: DNSRecord[]) {
  const results = await Promise.all(
    records.map(record => createRecord(env, record))
  );

  return {
    success: results.every(r => r.success),
    results,
    created: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  };
}

async function listZones(env: Env) {
  const data = await cfFetch(env, '/zones?per_page=50') as any;

  if (!data.success) {
    return { success: false, error: data.errors };
  }

  return {
    success: true,
    zones: data.result.map((z: any) => ({
      id: z.id,
      name: z.name,
      status: z.status,
      plan: z.plan.name
    }))
  };
}

async function setupStripeSubdomains(env: Env) {
  const stripeRecords: DNSRecord[] = [
    {
      type: 'CNAME',
      name: 'billing',
      content: 'blackroad-stripe-billing.amundsonalexa.workers.dev',
      proxied: true
    },
    {
      type: 'CNAME',
      name: 'webhooks',
      content: 'blackroad-stripe-webhooks.amundsonalexa.workers.dev',
      proxied: true
    },
    {
      type: 'CNAME',
      name: 'checkout',
      content: 'blackroad-stripe-checkout.amundsonalexa.workers.dev',
      proxied: true
    }
  ];

  return createBulkRecords(env, stripeRecords);
}
