/**
 * BlackRoad Telemetry Service
 * "All roads lead to BlackRoad"
 *
 * Collects HTTP call telemetry from all agents/services.
 * Identifies "new internet" hosts vs known big tech.
 * Includes billing/pricing for monetization.
 *
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

import { PRICING_TIERS, getTier, calculateOverage, generateAPIKey, isValidAPIKeyFormat, recommendTier, type PricingTier, type APIKey, type UsageRecord } from './billing';

export interface Env {
  TELEMETRY_KV: KVNamespace;
  STRIPE_SECRET_KEY?: string;
}

// Known "big tech" hosts - calls to these are expected
const KNOWN_GIANTS = new Set([
  // Google
  'google.com', 'googleapis.com', 'googleusercontent.com', 'gstatic.com',
  'youtube.com', 'ytimg.com', 'googlevideo.com', 'google-analytics.com',
  // OpenAI
  'openai.com', 'api.openai.com',
  // Anthropic
  'anthropic.com', 'api.anthropic.com',
  // Microsoft / Azure
  'microsoft.com', 'azure.com', 'windows.net', 'msn.com', 'bing.com',
  'live.com', 'office.com', 'github.com', 'githubusercontent.com',
  // Amazon
  'amazonaws.com', 'amazon.com', 'cloudfront.net', 'awsstatic.com',
  // Cloudflare
  'cloudflare.com', 'cloudflare-dns.com', 'workers.dev',
  // Meta
  'facebook.com', 'instagram.com', 'fbcdn.net', 'meta.com',
  // Apple
  'apple.com', 'icloud.com', 'mzstatic.com',
  // Stripe
  'stripe.com', 'stripe.network',
  // Vercel / Railway
  'vercel.app', 'vercel.com', 'railway.app',
  // HuggingFace
  'huggingface.co', 'hf.co',
  // BlackRoad (internal)
  'blackroad.io', 'blackroad.systems', 'blackroadai.com',
  'lucidia.earth', 'lucidia.studio', 'amundsonalexa.workers.dev',
]);

interface TelemetryEvent {
  service: string;
  url: string;
  host: string;
  method?: string;
  status: number;
  latency_ms: number;
  timestamp: number;
  is_new_internet: boolean;
  agent_did?: string;
  metadata?: Record<string, unknown>;
}

interface HostStats {
  host: string;
  first_seen: number;
  last_seen: number;
  call_count: number;
  services: string[];
  is_new_internet: boolean;
  avg_latency_ms: number;
}

function extractRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

function isNewInternet(host: string): boolean {
  const root = extractRootDomain(host.toLowerCase());
  return !KNOWN_GIANTS.has(root) && !KNOWN_GIANTS.has(host.toLowerCase());
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      // Health check
      if (path === '/health' || path === '/') {
        return Response.json({
          status: 'online',
          service: 'blackroad-telemetry',
          version: '1.0.0',
          owner: 'Alexa Louise Amundson',
          infrastructure: 'BlackRoad OS',
          timestamp: new Date().toISOString(),
          endpoints: {
            ingest: 'POST /v1/telemetry/http-call',
            recent: 'GET /v1/telemetry/recent?limit=100',
            hosts: 'GET /v1/telemetry/hosts',
            newInternet: 'GET /v1/telemetry/new-internet',
            stats: 'GET /v1/telemetry/stats',
          },
          message: 'All roads lead to BlackRoad.',
        }, { headers: corsHeaders() });
      }

      // Ingest telemetry event
      if (path === '/v1/telemetry/http-call' && request.method === 'POST') {
        const body = await request.json() as Partial<TelemetryEvent>;

        if (!body.service || !body.host) {
          return Response.json({ error: 'Missing required fields: service, host' }, {
            status: 400,
            headers: corsHeaders(),
          });
        }

        const event: TelemetryEvent = {
          service: body.service,
          url: body.url || `https://${body.host}/`,
          host: body.host,
          method: body.method || 'GET',
          status: body.status || 0,
          latency_ms: body.latency_ms || 0,
          timestamp: body.timestamp || Date.now(),
          is_new_internet: isNewInternet(body.host),
          agent_did: body.agent_did,
          metadata: body.metadata,
        };

        // Store event (keyed by timestamp for ordering)
        const eventKey = `event:${event.timestamp}:${Math.random().toString(36).slice(2, 8)}`;
        await env.TELEMETRY_KV.put(eventKey, JSON.stringify(event), {
          expirationTtl: 86400 * 7, // 7 days retention
        });

        // Update host stats
        const hostKey = `host:${event.host}`;
        const existingStats = await env.TELEMETRY_KV.get(hostKey, 'json') as HostStats | null;

        const stats: HostStats = existingStats || {
          host: event.host,
          first_seen: event.timestamp,
          last_seen: event.timestamp,
          call_count: 0,
          services: [],
          is_new_internet: event.is_new_internet,
          avg_latency_ms: 0,
        };

        stats.last_seen = event.timestamp;
        stats.call_count += 1;
        stats.avg_latency_ms = Math.round(
          (stats.avg_latency_ms * (stats.call_count - 1) + event.latency_ms) / stats.call_count
        );
        if (!stats.services.includes(event.service)) {
          stats.services.push(event.service);
        }

        await env.TELEMETRY_KV.put(hostKey, JSON.stringify(stats), {
          expirationTtl: 86400 * 30, // 30 days for host stats
        });

        // If new internet, add to new-internet index
        if (event.is_new_internet) {
          const newInternetKey = `new-internet:${event.host}`;
          await env.TELEMETRY_KV.put(newInternetKey, JSON.stringify({
            host: event.host,
            first_seen: stats.first_seen,
            last_seen: event.timestamp,
            call_count: stats.call_count,
          }), { expirationTtl: 86400 * 30 });
        }

        return Response.json({
          success: true,
          is_new_internet: event.is_new_internet,
          host: event.host,
          message: event.is_new_internet
            ? 'New internet host detected!'
            : 'Known host logged.',
        }, { headers: corsHeaders() });
      }

      // Get recent events
      if (path === '/v1/telemetry/recent' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const since = parseInt(url.searchParams.get('since') || '0');
        const newInternetOnly = url.searchParams.get('new_internet') === 'true';

        const events: TelemetryEvent[] = [];
        const list = await env.TELEMETRY_KV.list({ prefix: 'event:' });

        for (const key of list.keys.slice(-limit * 2)) {
          const event = await env.TELEMETRY_KV.get(key.name, 'json') as TelemetryEvent;
          if (event && event.timestamp > since) {
            if (!newInternetOnly || event.is_new_internet) {
              events.push(event);
            }
          }
          if (events.length >= limit) break;
        }

        return Response.json({
          events: events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit),
          count: events.length,
          timestamp: Date.now(),
        }, { headers: corsHeaders() });
      }

      // Get all tracked hosts
      if (path === '/v1/telemetry/hosts' && request.method === 'GET') {
        const hosts: HostStats[] = [];
        const list = await env.TELEMETRY_KV.list({ prefix: 'host:' });

        for (const key of list.keys) {
          const stats = await env.TELEMETRY_KV.get(key.name, 'json') as HostStats;
          if (stats) hosts.push(stats);
        }

        return Response.json({
          hosts: hosts.sort((a, b) => b.call_count - a.call_count),
          count: hosts.length,
          new_internet_count: hosts.filter(h => h.is_new_internet).length,
        }, { headers: corsHeaders() });
      }

      // Get new internet hosts only
      if (path === '/v1/telemetry/new-internet' && request.method === 'GET') {
        const hosts: Array<{ host: string; first_seen: number; last_seen: number; call_count: number }> = [];
        const list = await env.TELEMETRY_KV.list({ prefix: 'new-internet:' });

        for (const key of list.keys) {
          const data = await env.TELEMETRY_KV.get(key.name, 'json');
          if (data) hosts.push(data as typeof hosts[0]);
        }

        return Response.json({
          title: 'New Internet Radar',
          description: 'Hosts outside the known big tech ecosystem',
          hosts: hosts.sort((a, b) => b.last_seen - a.last_seen),
          count: hosts.length,
          message: hosts.length > 0
            ? `${hosts.length} new internet hosts detected`
            : 'No new internet hosts yet. All traffic to known giants.',
        }, { headers: corsHeaders() });
      }

      // Get overall stats
      if (path === '/v1/telemetry/stats' && request.method === 'GET') {
        const eventList = await env.TELEMETRY_KV.list({ prefix: 'event:' });
        const hostList = await env.TELEMETRY_KV.list({ prefix: 'host:' });
        const newInternetList = await env.TELEMETRY_KV.list({ prefix: 'new-internet:' });

        return Response.json({
          total_events: eventList.keys.length,
          unique_hosts: hostList.keys.length,
          new_internet_hosts: newInternetList.keys.length,
          known_giants_count: KNOWN_GIANTS.size,
          timestamp: Date.now(),
          owner: 'Alexa Louise Amundson',
          message: 'Queen of the New Internet sees all.',
        }, { headers: corsHeaders() });
      }

      // ============================================================
      // BILLING & PRICING ENDPOINTS
      // ============================================================

      // Get all pricing plans
      if (path === '/v1/billing/plans' && request.method === 'GET') {
        return Response.json({
          service: 'New Internet Radar',
          tagline: 'All roads lead to BlackRoad',
          plans: PRICING_TIERS,
          currency: 'USD',
          message: 'Join the new internet revolution.',
        }, { headers: corsHeaders() });
      }

      // Get recommended plan based on usage
      if (path === '/v1/billing/recommend' && request.method === 'POST') {
        const body = await request.json() as { expected_events_per_month?: number; agent_count?: number };
        const expectedEvents = body.expected_events_per_month || (body.agent_count || 1) * 5000;
        const recommended = recommendTier(expectedEvents);

        return Response.json({
          expected_events: expectedEvents,
          recommended_plan: recommended,
          all_plans: PRICING_TIERS,
          message: `Based on ${expectedEvents.toLocaleString()} expected events/month`,
        }, { headers: corsHeaders() });
      }

      // Generate API key (requires org_id)
      if (path === '/v1/billing/keys' && request.method === 'POST') {
        const body = await request.json() as { org_id: string; name?: string };

        if (!body.org_id) {
          return Response.json({ error: 'Missing org_id' }, { status: 400, headers: corsHeaders() });
        }

        const apiKey: APIKey = {
          key: generateAPIKey(),
          org_id: body.org_id,
          name: body.name || 'Default Key',
          created_at: Date.now(),
          events_count: 0,
          enabled: true,
        };

        // Store the key
        await env.TELEMETRY_KV.put(`apikey:${apiKey.key}`, JSON.stringify(apiKey), {
          expirationTtl: 86400 * 365, // 1 year
        });

        // Add to org's key list
        const orgKeysKey = `org-keys:${body.org_id}`;
        const existingKeys = await env.TELEMETRY_KV.get(orgKeysKey, 'json') as string[] || [];
        existingKeys.push(apiKey.key);
        await env.TELEMETRY_KV.put(orgKeysKey, JSON.stringify(existingKeys));

        return Response.json({
          success: true,
          api_key: apiKey.key,
          name: apiKey.name,
          message: 'API key created. Store it securely - it cannot be retrieved later.',
        }, { headers: corsHeaders() });
      }

      // Get usage for an org
      if (path === '/v1/billing/usage' && request.method === 'GET') {
        const orgId = url.searchParams.get('org_id');

        if (!orgId) {
          return Response.json({ error: 'Missing org_id parameter' }, { status: 400, headers: corsHeaders() });
        }

        // Get org's usage record
        const usageKey = `usage:${orgId}`;
        const usage = await env.TELEMETRY_KV.get(usageKey, 'json') as UsageRecord | null;

        if (!usage) {
          return Response.json({
            org_id: orgId,
            tier: 'free',
            events_used: 0,
            events_limit: 10000,
            percentage_used: 0,
            overage: { events: 0, cost: 0 },
            message: 'No usage recorded yet.',
          }, { headers: corsHeaders() });
        }

        const tier = getTier(usage.tier) || PRICING_TIERS[0];
        const overage = calculateOverage(tier, usage.events_used);

        return Response.json({
          org_id: orgId,
          tier: usage.tier,
          tier_name: tier.name,
          events_used: usage.events_used,
          events_limit: tier.events_included,
          percentage_used: Math.round((usage.events_used / tier.events_included) * 100),
          overage,
          period_start: usage.period_start,
          period_end: usage.period_end,
        }, { headers: corsHeaders() });
      }

      // Calculate invoice preview
      if (path === '/v1/billing/invoice-preview' && request.method === 'GET') {
        const orgId = url.searchParams.get('org_id');

        if (!orgId) {
          return Response.json({ error: 'Missing org_id parameter' }, { status: 400, headers: corsHeaders() });
        }

        const usageKey = `usage:${orgId}`;
        const usage = await env.TELEMETRY_KV.get(usageKey, 'json') as UsageRecord | null;

        if (!usage) {
          return Response.json({
            org_id: orgId,
            tier: 'free',
            base_charge: 0,
            overage_charge: 0,
            total: 0,
            currency: 'USD',
          }, { headers: corsHeaders() });
        }

        const tier = getTier(usage.tier) || PRICING_TIERS[0];
        const overage = calculateOverage(tier, usage.events_used);

        return Response.json({
          org_id: orgId,
          tier: usage.tier,
          tier_name: tier.name,
          base_charge: tier.price_monthly,
          overage_events: overage.overage,
          overage_charge: overage.cost,
          total: tier.price_monthly + overage.cost,
          currency: 'USD',
          period_start: usage.period_start,
          period_end: usage.period_end,
        }, { headers: corsHeaders() });
      }

      // 404 for unknown routes
      return Response.json({
        error: 'Not found',
        available_endpoints: [
          'GET /',
          'GET /health',
          'POST /v1/telemetry/http-call',
          'GET /v1/telemetry/recent',
          'GET /v1/telemetry/hosts',
          'GET /v1/telemetry/new-internet',
          'GET /v1/telemetry/stats',
          'GET /v1/billing/plans',
          'POST /v1/billing/recommend',
          'POST /v1/billing/keys',
          'GET /v1/billing/usage?org_id=xxx',
          'GET /v1/billing/invoice-preview?org_id=xxx',
        ],
      }, { status: 404, headers: corsHeaders() });

    } catch (error) {
      return Response.json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500, headers: corsHeaders() });
    }
  },
};
