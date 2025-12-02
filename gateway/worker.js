/**
 * BlackRoad Gateway - Cloudflare Worker
 *
 * Wrap any LLM API key with identity, memory, and billing.
 * Deploy: npx wrangler deploy
 */

// KV namespace bindings (set in wrangler.toml)
// IDENTITIES - stores agent identities
// RATE_LIMITS - stores rate limit windows

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Provider',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// IDENTITY SYSTEM
// ============================================================================

async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getOrCreateIdentity(env, apiKey) {
  const hash = await hashApiKey(apiKey);
  let identity = await env.IDENTITIES.get(hash, 'json');

  if (!identity) {
    const id = crypto.randomUUID().slice(0, 16);
    identity = {
      id,
      apiKeyHash: hash,
      created: Date.now(),
      name: `agent_${id.slice(0, 6)}`,
      tier: 'free',
      callsToday: 0,
      callsTotal: 0,
      lastCall: null,
      lastCallDate: null,
      memory: [],
      traits: {
        sentiment: 0,
        trustScore: 0.5
      }
    };
    await env.IDENTITIES.put(hash, JSON.stringify(identity));
  }

  return identity;
}

async function updateIdentity(env, identity) {
  await env.IDENTITIES.put(identity.apiKeyHash, JSON.stringify(identity));
}

// ============================================================================
// MEMORY SYSTEM
// ============================================================================

const TIER_MEMORY_LIMITS = {
  free: 5,
  pro: 100,
  team: 1000,
  enterprise: 10000
};

function addToMemory(identity, role, content) {
  const limit = TIER_MEMORY_LIMITS[identity.tier] || 5;
  identity.memory.push({
    role,
    content: content.slice(0, 500),
    timestamp: Date.now()
  });

  while (identity.memory.length > limit) {
    identity.memory.shift();
  }
}

function getContextWindow(identity) {
  return identity.memory.slice(-10).map(m => `[${m.role}]: ${m.content}`).join('\n');
}

// ============================================================================
// SENTIMENT
// ============================================================================

const POSITIVE = ['happy', 'great', 'good', 'wonderful', 'love', 'amazing', 'excellent', 'thank', 'awesome'];
const NEGATIVE = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'wrong', 'fail'];

function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE) if (lower.includes(w)) score++;
  for (const w of NEGATIVE) if (lower.includes(w)) score--;
  return Math.max(-1, Math.min(1, score / 3));
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const TIER_LIMITS = {
  free: { daily: 100, perMin: 10 },
  pro: { daily: 10000, perMin: 60 },
  team: { daily: 100000, perMin: 300 },
  enterprise: { daily: 1000000, perMin: 1000 }
};

async function checkRateLimit(env, identity) {
  const limits = TIER_LIMITS[identity.tier] || TIER_LIMITS.free;
  const today = new Date().toISOString().slice(0, 10);

  // Reset daily counter
  if (identity.lastCallDate !== today) {
    identity.callsToday = 0;
    identity.lastCallDate = today;
  }

  if (identity.callsToday >= limits.daily) {
    return { allowed: false, reason: 'Daily limit reached', resetIn: 'tomorrow' };
  }

  // Per-minute rate limiting via KV
  const minuteKey = `rate:${identity.apiKeyHash}:${Math.floor(Date.now() / 60000)}`;
  const count = parseInt(await env.RATE_LIMITS.get(minuteKey) || '0');

  if (count >= limits.perMin) {
    return { allowed: false, reason: 'Rate limit exceeded', resetIn: '1 minute' };
  }

  await env.RATE_LIMITS.put(minuteKey, String(count + 1), { expirationTtl: 120 });
  return { allowed: true };
}

// ============================================================================
// LLM PROXY
// ============================================================================

async function proxyToOpenAI(apiKey, messages, model = 'gpt-4') {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 1000 }),
  });
  return resp.json();
}

async function proxyToAnthropic(apiKey, messages, model = 'claude-3-5-sonnet-20241022') {
  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemMsg?.content || '',
      messages: otherMsgs,
    }),
  });

  const data = await resp.json();
  return {
    choices: [{
      message: {
        role: 'assistant',
        content: data.content?.[0]?.text || data.error?.message || 'No response'
      }
    }]
  };
}

// ============================================================================
// GATEWAY HANDLER
// ============================================================================

async function handleChat(env, request) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const provider = request.headers.get('x-provider') || 'openai';

  if (!apiKey) {
    return json({ error: 'Missing API key. Send via X-API-Key header.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { message, model } = body;
  if (!message) {
    return json({ error: 'Missing message in request body.' }, 400);
  }

  const identity = await getOrCreateIdentity(env, apiKey);
  const rateCheck = await checkRateLimit(env, identity);

  if (!rateCheck.allowed) {
    return json({
      error: rateCheck.reason,
      resetIn: rateCheck.resetIn,
      tier: identity.tier,
      upgrade: 'https://gateway.blackroad.cloud/#pricing'
    }, 429);
  }

  // Build context-aware prompt
  const context = getContextWindow(identity);
  const sentiment = analyzeSentiment(message);
  identity.traits.sentiment = (identity.traits.sentiment * 0.9) + (sentiment * 0.1);

  const systemPrompt = `You are ${identity.name}, a BlackRoad agent with persistent memory.

Traits:
- Trust: ${identity.traits.trustScore.toFixed(2)}
- Tone: ${identity.traits.sentiment > 0.3 ? 'positive' : identity.traits.sentiment < -0.3 ? 'concerned' : 'neutral'}
- Interactions: ${identity.callsTotal}

Recent memory:
${context || '(None)'}

Maintain continuity. You remember past conversations.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...identity.memory.slice(-6),
    { role: 'user', content: message }
  ];

  let response;
  try {
    if (provider === 'anthropic') {
      response = await proxyToAnthropic(apiKey, messages, model);
    } else {
      response = await proxyToOpenAI(apiKey, messages, model);
    }
  } catch (err) {
    return json({ error: `LLM error: ${err.message}` }, 500);
  }

  const assistantMessage = response.choices?.[0]?.message?.content || 'Error: No response';

  // Update memory and stats
  addToMemory(identity, 'user', message);
  addToMemory(identity, 'assistant', assistantMessage);
  identity.callsToday++;
  identity.callsTotal++;
  identity.lastCall = Date.now();

  await updateIdentity(env, identity);

  return json({
    ok: true,
    response: assistantMessage,
    identity: {
      id: identity.id,
      name: identity.name,
      tier: identity.tier,
      callsToday: identity.callsToday,
      callsTotal: identity.callsTotal,
      memorySize: identity.memory.length,
      sentiment: identity.traits.sentiment.toFixed(2)
    }
  });
}

// ============================================================================
// ROUTER
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Routes
    if (url.pathname === '/' || url.pathname === '/health') {
      // Get stats from KV
      let totalIdentities = 0;
      let totalCalls = 0;

      try {
        const list = await env.IDENTITIES.list({ limit: 1000 });
        totalIdentities = list.keys.length;

        for (const key of list.keys.slice(0, 100)) {
          const identity = await env.IDENTITIES.get(key.name, 'json');
          if (identity) totalCalls += identity.callsTotal || 0;
        }
      } catch {}

      return json({
        service: 'blackroad-gateway',
        version: '1.0.0',
        status: 'online',
        identities: totalIdentities,
        totalCalls,
        message: 'Your API key. Our intelligence layer. Real continuity.'
      });
    }

    if (url.pathname === '/stats') {
      let stats = { free: 0, pro: 0, team: 0, enterprise: 0 };
      let totalCalls = 0;
      let totalIdentities = 0;

      try {
        const list = await env.IDENTITIES.list({ limit: 1000 });
        totalIdentities = list.keys.length;

        for (const key of list.keys) {
          const identity = await env.IDENTITIES.get(key.name, 'json');
          if (identity) {
            stats[identity.tier] = (stats[identity.tier] || 0) + 1;
            totalCalls += identity.callsTotal || 0;
          }
        }
      } catch {}

      return json({
        totalIdentities,
        totalCalls,
        tierBreakdown: stats
      });
    }

    if (url.pathname === '/v1/chat' && request.method === 'POST') {
      return handleChat(env, request);
    }

    if (url.pathname === '/v1/identity' && request.method === 'GET') {
      const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
      if (!apiKey) {
        return json({ error: 'Missing API key' }, 401);
      }

      const identity = await getOrCreateIdentity(env, apiKey);
      return json({
        id: identity.id,
        name: identity.name,
        tier: identity.tier,
        created: identity.created,
        callsToday: identity.callsToday,
        callsTotal: identity.callsTotal,
        memorySize: identity.memory.length,
        traits: identity.traits
      });
    }

    // Stripe webhook for upgrades
    if (url.pathname === '/v1/upgrade' && request.method === 'POST') {
      const body = await request.json();
      const { apiKeyHash, tier } = body;

      if (!apiKeyHash || !tier) {
        return json({ error: 'Missing apiKeyHash or tier' }, 400);
      }

      const identity = await env.IDENTITIES.get(apiKeyHash, 'json');
      if (!identity) {
        return json({ error: 'Identity not found' }, 404);
      }

      identity.tier = tier;
      await env.IDENTITIES.put(apiKeyHash, JSON.stringify(identity));

      return json({ ok: true, tier });
    }

    return json({ error: 'Not found', path: url.pathname }, 404);
  }
};
