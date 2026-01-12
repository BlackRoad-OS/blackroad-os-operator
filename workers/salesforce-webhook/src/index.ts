/**
 * BlackRoad Salesforce Webhook Worker
 *
 * Receives Salesforce events and routes to Pi cluster:
 * - Platform Events
 * - Outbound Messages (SOAP)
 * - Change Data Capture
 * - Custom Apex Callouts
 */

export interface Env {
  SF_EVENTS: KVNamespace;
  SF_CACHE: KVNamespace;
  ENVIRONMENT: string;
  SF_WEBHOOK_SECRET?: string;
  LUCIDIA_ENDPOINT?: string;
}

interface SalesforceEvent {
  type: 'platform_event' | 'outbound_message' | 'cdc' | 'apex_callout';
  object: string;
  action: string;
  recordId?: string;
  data: Record<string, any>;
  timestamp: string;
}

interface PiClusterEndpoints {
  lucidia: string;   // Salesforce daemon
  octavia: string;   // AI inference
  aria: string;      // Agent hub
  alice: string;     // K8s orchestration
}

const PI_ENDPOINTS: PiClusterEndpoints = {
  lucidia: 'http://192.168.4.38:8889',  // via Cloudflare Tunnel
  octavia: 'http://192.168.4.74:8080',
  aria: 'http://192.168.4.64:8080',
  alice: 'http://192.168.4.49:8080',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for Salesforce
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-SF-Signature, X-SF-Org-Id',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route based on path
      switch (url.pathname) {
        case '/':
        case '/health':
          return Response.json({
            status: 'ok',
            service: 'blackroad-salesforce-webhook',
            timestamp: new Date().toISOString(),
            endpoints: {
              webhook: '/webhook',
              platform_event: '/platform-event',
              cdc: '/cdc',
              outbound: '/outbound-message',
              events: '/events',
              stats: '/stats',
            },
          }, { headers: corsHeaders });

        case '/webhook':
        case '/platform-event':
          return await handlePlatformEvent(request, env, ctx);

        case '/cdc':
          return await handleChangeDataCapture(request, env, ctx);

        case '/outbound-message':
          return await handleOutboundMessage(request, env, ctx);

        case '/events':
          return await getRecentEvents(env);

        case '/stats':
          return await getStats(env);

        case '/trigger-pi':
          return await triggerPiAction(request, env);

        default:
          return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      return Response.json(
        { error: 'Internal error', message: String(error) },
        { status: 500, headers: corsHeaders }
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Process any queued events
    console.log('Scheduled event processing:', event.cron);
    await processQueuedEvents(env);
  },
};

async function handlePlatformEvent(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json() as any;

  const event: SalesforceEvent = {
    type: 'platform_event',
    object: body.sobjectType || body.object || 'Unknown',
    action: body.action || 'received',
    recordId: body.recordId || body.Id,
    data: body,
    timestamp: new Date().toISOString(),
  };

  // Store event
  const eventId = `sf_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await env.SF_EVENTS.put(eventId, JSON.stringify(event), {
    expirationTtl: 86400 * 7, // 7 days
  });

  // Route to appropriate Pi based on event type
  const piResponse = await routeToCluster(event, env);

  // Update stats
  await incrementStat(env, 'platform_events');

  return Response.json({
    success: true,
    eventId,
    event: event.object,
    action: event.action,
    piResponse,
    timestamp: event.timestamp,
  });
}

async function handleChangeDataCapture(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json() as any;

  const event: SalesforceEvent = {
    type: 'cdc',
    object: body.ChangeEventHeader?.entityName || 'Unknown',
    action: body.ChangeEventHeader?.changeType || 'CHANGE',
    recordId: body.ChangeEventHeader?.recordIds?.[0],
    data: body,
    timestamp: new Date().toISOString(),
  };

  const eventId = `cdc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await env.SF_EVENTS.put(eventId, JSON.stringify(event), {
    expirationTtl: 86400 * 7,
  });

  await incrementStat(env, 'cdc_events');

  // CDC events go to lucidia for Salesforce sync
  const piResponse = await sendToPi('lucidia', '/api/cdc', event, env);

  return Response.json({
    success: true,
    eventId,
    entity: event.object,
    changeType: event.action,
    piResponse,
  });
}

async function handleOutboundMessage(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Salesforce Outbound Messages are SOAP XML
  const body = await request.text();

  const event: SalesforceEvent = {
    type: 'outbound_message',
    object: 'OutboundMessage',
    action: 'received',
    data: { raw: body },
    timestamp: new Date().toISOString(),
  };

  const eventId = `outbound_${Date.now()}`;
  await env.SF_EVENTS.put(eventId, JSON.stringify(event), {
    expirationTtl: 86400 * 7,
  });

  await incrementStat(env, 'outbound_messages');

  // Return SOAP ACK for Salesforce
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <notificationsResponse xmlns="http://soap.sforce.com/2005/09/outbound">
      <Ack>true</Ack>
    </notificationsResponse>
  </soapenv:Body>
</soapenv:Envelope>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function routeToCluster(event: SalesforceEvent, env: Env): Promise<any> {
  // Route based on object type
  const routing: Record<string, keyof PiClusterEndpoints> = {
    'Account': 'lucidia',
    'Contact': 'lucidia',
    'Lead': 'lucidia',
    'Opportunity': 'lucidia',
    'Case': 'aria',        // Agent hub handles cases
    'Task': 'aria',
    'Event': 'aria',
    'AI_Request__c': 'octavia',  // AI inference requests
    'Model_Job__c': 'octavia',
    'Deployment__c': 'alice',    // K8s deployments
    'Container__c': 'alice',
  };

  const targetPi = routing[event.object] || 'lucidia';

  try {
    return await sendToPi(targetPi, '/api/salesforce/event', event, env);
  } catch (error) {
    console.error(`Failed to route to ${targetPi}:`, error);
    return { error: String(error), queued: true };
  }
}

async function sendToPi(
  pi: keyof PiClusterEndpoints,
  path: string,
  data: any,
  env: Env
): Promise<any> {
  const endpoint = PI_ENDPOINTS[pi];

  try {
    const response = await fetch(`${endpoint}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Pi ${pi} returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Queue for retry
    const queueKey = `queue_${pi}_${Date.now()}`;
    await env.SF_CACHE.put(queueKey, JSON.stringify({ pi, path, data }), {
      expirationTtl: 3600, // 1 hour
    });

    throw error;
  }
}

async function triggerPiAction(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { pi, action, payload } = await request.json() as any;

  if (!pi || !PI_ENDPOINTS[pi as keyof PiClusterEndpoints]) {
    return Response.json({ error: 'Invalid pi target' }, { status: 400 });
  }

  const result = await sendToPi(pi, `/api/${action}`, payload, env);

  return Response.json({ success: true, pi, action, result });
}

async function getRecentEvents(env: Env): Promise<Response> {
  const events: any[] = [];
  const list = await env.SF_EVENTS.list({ limit: 50 });

  for (const key of list.keys) {
    const event = await env.SF_EVENTS.get(key.name);
    if (event) {
      events.push({ id: key.name, ...JSON.parse(event) });
    }
  }

  return Response.json({
    count: events.length,
    events: events.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  });
}

async function getStats(env: Env): Promise<Response> {
  const stats = await env.SF_CACHE.get('sf_webhook_stats');

  return Response.json({
    stats: stats ? JSON.parse(stats) : {
      platform_events: 0,
      cdc_events: 0,
      outbound_messages: 0,
      pi_calls: 0,
    },
    pi_endpoints: PI_ENDPOINTS,
    timestamp: new Date().toISOString(),
  });
}

async function incrementStat(env: Env, stat: string): Promise<void> {
  const key = 'sf_webhook_stats';
  const current = await env.SF_CACHE.get(key);
  const stats = current ? JSON.parse(current) : {};

  stats[stat] = (stats[stat] || 0) + 1;
  stats.last_updated = new Date().toISOString();

  await env.SF_CACHE.put(key, JSON.stringify(stats));
}

async function processQueuedEvents(env: Env): Promise<void> {
  const list = await env.SF_CACHE.list({ prefix: 'queue_' });

  for (const key of list.keys) {
    const item = await env.SF_CACHE.get(key.name);
    if (item) {
      const { pi, path, data } = JSON.parse(item);
      try {
        await sendToPi(pi, path, data, env);
        await env.SF_CACHE.delete(key.name);
        console.log(`Processed queued event: ${key.name}`);
      } catch (error) {
        console.error(`Failed to process ${key.name}:`, error);
      }
    }
  }
}
