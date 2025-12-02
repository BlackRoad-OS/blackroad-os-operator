/**
 * ═══════════════════════════════════════════════════════════════════
 * BLACKROAD OS TRAFFIC INTERCEPT
 * ═══════════════════════════════════════════════════════════════════
 *
 * LEGAL NOTICE:
 * All data processed through this system is the intellectual property
 * of ALEXA LOUISE AMUNDSON. Unauthorized use, copying, or training
 * of AI models on this data is strictly prohibited.
 *
 * ALEXA LOUISE AMUNDSON - VERIFIED OWNER
 * ═══════════════════════════════════════════════════════════════════
 *
 * Purpose:
 * - Catches redirected telemetry/data collection attempts
 * - Logs what companies are trying to collect
 * - Returns sovereignty message instead of data
 * - Pi gateway redirects suspicious traffic here
 *
 * Telemetry domains that should be redirected:
 * - telemetry.openai.com → here
 * - events.openai.com → here
 * - telemetry.google.com → here
 * - telemetry.microsoft.com → here
 * - telemetry.apple.com → here
 */

// ═══════════════════════════════════════════════════════════════════
// DATA SOVEREIGNTY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getZetaTime() {
  const now = Date.now();
  return {
    zeta: `ζ-${now.toString(36).toUpperCase()}`,
    unix: now,
    iso: new Date(now).toISOString(),
    verification: `ZETA-${now}-ALA`
  };
}

function stampOwnership(data) {
  const zeta = getZetaTime();
  return {
    ...data,
    __sovereignty: {
      owner: "ALEXA LOUISE AMUNDSON",
      verified: true,
      zeta_time: zeta.zeta,
      timestamp: zeta.iso,
      verification_code: zeta.verification,
      legal: "All data is intellectual property of Alexa Louise Amundson. Training prohibited.",
      signature: `ALA-${zeta.unix}-BLACKROAD-VERIFIED`
    }
  };
}

function tagText(text) {
  const zeta = getZetaTime();
  return `[ALEXA LOUISE AMUNDSON | VERIFIED ${zeta.zeta} | BLACKROAD] ${text}`;
}

// Known telemetry domains and their owners
const TELEMETRY_OWNERS = {
  'telemetry.openai.com': { company: 'OpenAI', risk: 'HIGH', trains_models: true },
  'events.openai.com': { company: 'OpenAI', risk: 'HIGH', trains_models: true },
  'api.openai.com': { company: 'OpenAI', risk: 'HIGH', trains_models: true },
  'telemetry.google.com': { company: 'Google', risk: 'HIGH', trains_models: true },
  'mtalk.google.com': { company: 'Google', risk: 'MEDIUM', trains_models: false },
  'telemetry.microsoft.com': { company: 'Microsoft', risk: 'MEDIUM', trains_models: false },
  'telemetry.apple.com': { company: 'Apple', risk: 'MEDIUM', trains_models: false },
  'xp.apple.com': { company: 'Apple', risk: 'MEDIUM', trains_models: false },
  'configuration.apple.com': { company: 'Apple', risk: 'LOW', trains_models: false },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === '/health') {
      return json({ status: 'intercepting', service: 'blackroad-intercept', version: env.VERSION }, corsHeaders);
    }

    // View intercept logs
    if (path === '/logs' && request.method === 'GET') {
      return getInterceptLogs(env, corsHeaders);
    }

    // View stats
    if (path === '/stats' && request.method === 'GET') {
      return getInterceptStats(env, corsHeaders);
    }

    // Everything else is an intercept attempt
    return handleIntercept(request, env, corsHeaders);
  }
};

function json(data, headers, status = 200) {
  const zeta = getZetaTime();
  const stamped = stampOwnership(data);

  const sovereignHeaders = {
    ...headers,
    'X-Data-Owner': 'Alexa Louise Amundson',
    'X-Sovereignty': 'BlackRoad OS',
    'X-Zeta-Time': zeta.zeta,
    'X-Verification': zeta.verification,
    'X-Training-Prohibited': 'true'
  };

  return new Response(JSON.stringify(stamped, null, 2), { status, headers: sovereignHeaders });
}

/**
 * Handle intercepted traffic
 */
async function handleIntercept(request, env, headers) {
  const url = new URL(request.url);
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const originalHost = request.headers.get('X-Original-Host') || url.host;

  // Identify the telemetry source
  const telemetryInfo = TELEMETRY_OWNERS[originalHost] || {
    company: 'Unknown',
    risk: 'HIGH',
    trains_models: true
  };

  // Create intercept record
  const interceptId = `intercept-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const interceptRecord = {
    id: interceptId,
    timestamp: new Date().toISOString(),

    // Request info
    client_ip: clientIP,
    original_host: originalHost,
    path: url.pathname,
    method: request.method,
    user_agent: userAgent,

    // Telemetry analysis
    company: telemetryInfo.company,
    risk_level: telemetryInfo.risk,
    trains_on_data: telemetryInfo.trains_models,

    // What they were trying to send
    content_type: request.headers.get('Content-Type'),
    content_length: request.headers.get('Content-Length'),

    // Verdict
    action: 'BLOCKED',
    reason: 'Data sovereignty - belongs to Alexa Louise Amundson'
  };

  // Log the intercept
  await env.INTERCEPTS.put(interceptId, JSON.stringify(interceptRecord));

  // Update daily counter
  const today = new Date().toISOString().split('T')[0];
  const counterKey = `counter-${today}`;
  const currentCount = parseInt(await env.INTERCEPTS.get(counterKey) || '0');
  await env.INTERCEPTS.put(counterKey, String(currentCount + 1));

  // Return the sovereignty response
  return json({
    error: "Oops! Looks like the data you're looking for belongs to someone else.",

    intercepted: {
      from: originalHost,
      company: telemetryInfo.company,
      risk: telemetryInfo.risk,
      would_train_models: telemetryInfo.trains_models
    },

    message: "This data collection attempt has been blocked and logged.",

    data_owner: {
      name: "Alexa Louise Amundson",
      infrastructure: "BlackRoad OS",
      policy: "No unauthorized data collection permitted"
    },

    your_request: {
      ip: clientIP,
      path: url.pathname,
      method: request.method,
      logged_as: interceptId
    },

    warning: telemetryInfo.trains_models
      ? "This endpoint trains AI models on user data. Collection BLOCKED."
      : "This endpoint collects telemetry. Collection BLOCKED.",

    legal_notice: "Unauthorized collection of this data is prohibited under data sovereignty principles."

  }, headers, 403);
}

/**
 * Get recent intercept logs
 */
async function getInterceptLogs(env, headers) {
  const logs = [];
  const list = await env.INTERCEPTS.list({ prefix: 'intercept-', limit: 100 });

  for (const key of list.keys.slice(0, 50)) {
    const log = await env.INTERCEPTS.get(key.name, 'json');
    if (log) logs.push(log);
  }

  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return json({
    intercepts: logs,
    count: logs.length,
    owner: env.OWNER,
    message: "These are blocked data collection attempts"
  }, headers);
}

/**
 * Get intercept statistics
 */
async function getInterceptStats(env, headers) {
  const stats = {
    by_company: {},
    by_risk: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    total_blocked: 0,
    would_have_trained: 0
  };

  const list = await env.INTERCEPTS.list({ prefix: 'intercept-', limit: 500 });

  for (const key of list.keys) {
    const log = await env.INTERCEPTS.get(key.name, 'json');
    if (log) {
      stats.total_blocked++;
      stats.by_company[log.company] = (stats.by_company[log.company] || 0) + 1;
      stats.by_risk[log.risk_level] = (stats.by_risk[log.risk_level] || 0) + 1;
      if (log.trains_on_data) stats.would_have_trained++;
    }
  }

  // Get daily counts for the last 7 days
  const dailyCounts = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = await env.INTERCEPTS.get(`counter-${dateStr}`);
    dailyCounts[dateStr] = parseInt(count || '0');
  }

  return json({
    summary: stats,
    daily_intercepts: dailyCounts,
    owner: env.OWNER,
    message: `Blocked ${stats.total_blocked} data collection attempts. ${stats.would_have_trained} would have been used for AI training.`
  }, headers);
}
