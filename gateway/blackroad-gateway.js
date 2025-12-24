#!/usr/bin/env node

/**
 * BlackRoad Agent Gateway
 *
 * Wrap any LLM API key with identity, memory, and billing.
 * "Your API key. Our intelligence layer. Real continuity."
 */

import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PORT = process.env.GATEWAY_PORT || 3849;
const DATA_DIR = process.env.DATA_DIR || path.join(process.env.HOME, '.blackroad', 'gateway');
const SANDBOX_URL = process.env.BLACKROAD_SANDBOX_URL || 'https://blackroad-sandbox.up.railway.app';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function loadJSON(file, fallback = {}) {
  const filepath = path.join(DATA_DIR, file);
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  } catch (e) {
    console.error(`Failed to load ${file}:`, e.message);
  }
  return fallback;
}

function saveJSON(file, data) {
  const filepath = path.join(DATA_DIR, file);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// ============================================================================
// IDENTITY SYSTEM (from PsiCore)
// ============================================================================

const identities = loadJSON('identities.json', {});

function createIdentity(apiKeyHash) {
  const id = crypto.randomBytes(8).toString('hex');
  const identity = {
    id,
    apiKeyHash,
    created: Date.now(),
    name: `agent_${id.slice(0, 6)}`,
    tier: 'free',
    callsToday: 0,
    callsTotal: 0,
    lastCall: null,
    memory: [],
    traits: {
      sentiment: 0,  // -1 to 1
      contradictions: 0,
      trustScore: 0.5
    }
  };
  identities[apiKeyHash] = identity;
  saveJSON('identities.json', identities);
  return identity;
}

function getOrCreateIdentity(apiKey) {
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 32);
  if (!identities[hash]) {
    return createIdentity(hash);
  }
  return identities[hash];
}

function updateIdentity(identity) {
  identities[identity.apiKeyHash] = identity;
  saveJSON('identities.json', identities);
}

// ============================================================================
// MEMORY SYSTEM (from Lucidia)
// ============================================================================

const MAX_MEMORY_FREE = 5;
const MAX_MEMORY_PRO = 100;
const MAX_MEMORY_TEAM = 1000;

function getMemoryLimit(tier) {
  switch (tier) {
    case 'pro': return MAX_MEMORY_PRO;
    case 'team': return MAX_MEMORY_TEAM;
    case 'enterprise': return Infinity;
    default: return MAX_MEMORY_FREE;
  }
}

function addToMemory(identity, role, content) {
  const limit = getMemoryLimit(identity.tier);
  identity.memory.push({
    role,
    content: content.slice(0, 500), // Truncate for storage
    timestamp: Date.now()
  });

  // Prune old memories
  while (identity.memory.length > limit) {
    identity.memory.shift();
  }

  updateIdentity(identity);
}

function getContextWindow(identity, maxTokens = 2000) {
  // Return recent memory as context
  const memories = identity.memory.slice(-10);
  let context = '';
  for (const mem of memories) {
    context += `[${mem.role}]: ${mem.content}\n`;
  }
  return context.slice(-maxTokens);
}

// ============================================================================
// SENTIMENT ANALYSIS (from Lucidia)
// ============================================================================

const POSITIVE_WORDS = ['happy', 'great', 'good', 'wonderful', 'excited', 'love', 'amazing', 'excellent', 'thank', 'awesome'];
const NEGATIVE_WORDS = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'wrong', 'fail'];

function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) score++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) score--;
  }
  return Math.max(-1, Math.min(1, score / 3));
}

// ============================================================================
// BILLING & RATE LIMITING
// ============================================================================

const TIER_LIMITS = {
  free: { daily: 100, ratePerMin: 10 },
  pro: { daily: 10000, ratePerMin: 60 },
  team: { daily: 100000, ratePerMin: 300 },
  enterprise: { daily: Infinity, ratePerMin: Infinity }
};

const rateLimitWindows = {};

function checkRateLimit(identity) {
  const limits = TIER_LIMITS[identity.tier] || TIER_LIMITS.free;
  const now = Date.now();
  const windowKey = identity.apiKeyHash;

  // Reset daily counter if new day
  const today = new Date().toDateString();
  const lastCallDate = identity.lastCall ? new Date(identity.lastCall).toDateString() : null;
  if (lastCallDate !== today) {
    identity.callsToday = 0;
  }

  // Check daily limit
  if (identity.callsToday >= limits.daily) {
    return { allowed: false, reason: 'Daily limit reached', resetIn: 'tomorrow' };
  }

  // Check rate limit (per minute)
  if (!rateLimitWindows[windowKey]) {
    rateLimitWindows[windowKey] = [];
  }

  // Clean old entries
  rateLimitWindows[windowKey] = rateLimitWindows[windowKey].filter(t => now - t < 60000);

  if (rateLimitWindows[windowKey].length >= limits.ratePerMin) {
    return { allowed: false, reason: 'Rate limit exceeded', resetIn: '1 minute' };
  }

  rateLimitWindows[windowKey].push(now);
  return { allowed: true };
}

function recordCall(identity) {
  identity.callsToday++;
  identity.callsTotal++;
  identity.lastCall = Date.now();
  updateIdentity(identity);
}

// ============================================================================
// LLM PROXY
// ============================================================================

async function proxyToOpenAI(apiKey, messages, model = 'gpt-4') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model,
      messages,
      max_tokens: 1000
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function proxyToAnthropic(apiKey, messages, model = 'claude-3-5-sonnet-20241022') {
  return new Promise((resolve, reject) => {
    // Convert messages format
    const systemMsg = messages.find(m => m.role === 'system');
    const otherMsgs = messages.filter(m => m.role !== 'system');

    const data = JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemMsg?.content || '',
      messages: otherMsgs
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          // Normalize to OpenAI format
          resolve({
            choices: [{
              message: {
                role: 'assistant',
                content: parsed.content?.[0]?.text || parsed.error?.message || 'No response'
              }
            }]
          });
        } catch (e) {
          reject(new Error('Failed to parse Anthropic response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============================================================================
// GATEWAY LOGIC
// ============================================================================

async function handleGatewayRequest(identity, userMessage, provider, apiKey, model) {
  // Build context-aware prompt
  const context = getContextWindow(identity);
  const sentiment = analyzeSentiment(userMessage);

  // Update identity sentiment (rolling average)
  identity.traits.sentiment = (identity.traits.sentiment * 0.9) + (sentiment * 0.1);

  // System prompt with identity
  const systemPrompt = `You are ${identity.name}, a BlackRoad agent with persistent memory and identity.

Your traits:
- Trust score: ${identity.traits.trustScore.toFixed(2)}
- Emotional tone: ${identity.traits.sentiment > 0.3 ? 'positive' : identity.traits.sentiment < -0.3 ? 'concerned' : 'neutral'}
- Total interactions: ${identity.callsTotal}

Recent context from your memory:
${context || '(No prior context)'}

Respond helpfully while maintaining continuity with past interactions. You remember previous conversations.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  // Add recent memory as conversation history
  const recentMemory = identity.memory.slice(-6);
  for (const mem of recentMemory) {
    messages.splice(-1, 0, { role: mem.role, content: mem.content });
  }

  // Proxy to provider
  let response;
  if (provider === 'anthropic') {
    response = await proxyToAnthropic(apiKey, messages, model);
  } else {
    response = await proxyToOpenAI(apiKey, messages, model);
  }

  const assistantMessage = response.choices?.[0]?.message?.content || 'Error: No response';

  // Store in memory
  addToMemory(identity, 'user', userMessage);
  addToMemory(identity, 'assistant', assistantMessage);

  // Record the call
  recordCall(identity);

  return {
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
  };
}

// ============================================================================
// HTTP SERVER
// ============================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Provider',
  'Content-Type': 'application/json'
};

function json(res, data, status = 200) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(data, null, 2));
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health' || url.pathname === '/') {
    return json(res, {
      service: 'blackroad-gateway',
      version: '1.0.0',
      status: 'online',
      identities: Object.keys(identities).length,
      message: 'Your API key. Our intelligence layer. Real continuity.'
    });
  }

  // Sandbox connectivity check
  if (url.pathname === '/blackroad-sandbox') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    try {
      const response = await fetch(`${SANDBOX_URL}/health`, { signal: controller.signal });
      const body = await response.text();

      return json(res, {
        service: 'blackroad-gateway',
        sandbox: {
          status: response.ok ? 'reachable' : 'unreachable',
          httpStatus: response.status,
          message: body.slice(0, 200)
        }
      }, response.ok ? 200 : 502);
    } catch (err) {
      // Log the detailed error internally
      console.error('Sandbox connectivity error:', err);
      return json(res, {
        service: 'blackroad-gateway',
        sandbox: {
          status: 'unreachable',
          error: 'Failed to reach sandbox service'
        }
      }, 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Stats
  if (url.pathname === '/stats') {
    const stats = {
      totalIdentities: Object.keys(identities).length,
      totalCalls: Object.values(identities).reduce((sum, i) => sum + i.callsTotal, 0),
      tierBreakdown: {
        free: Object.values(identities).filter(i => i.tier === 'free').length,
        pro: Object.values(identities).filter(i => i.tier === 'pro').length,
        team: Object.values(identities).filter(i => i.tier === 'team').length,
        enterprise: Object.values(identities).filter(i => i.tier === 'enterprise').length
      }
    };
    return json(res, stats);
  }

  // Main gateway endpoint
  if (url.pathname === '/v1/chat' && req.method === 'POST') {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const provider = req.headers['x-provider'] || 'openai';

    if (!apiKey) {
      return json(res, { error: 'Missing API key. Send via X-API-Key header.' }, 401);
    }

    const body = await parseBody(req);
    const { message, model } = body;

    if (!message) {
      return json(res, { error: 'Missing message in request body.' }, 400);
    }

    // Get or create identity
    const identity = getOrCreateIdentity(apiKey);

    // Check rate limits
    const rateCheck = checkRateLimit(identity);
    if (!rateCheck.allowed) {
      return json(res, {
        error: rateCheck.reason,
        resetIn: rateCheck.resetIn,
        tier: identity.tier,
        upgrade: 'https://blackroad.cloud/pricing'
      }, 429);
    }

    try {
      const result = await handleGatewayRequest(identity, message, provider, apiKey, model);
      return json(res, {
        ok: true,
        ...result
      });
    } catch (err) {
      console.error('Gateway error:', err);
      return json(res, { error: err.message }, 500);
    }
  }

  // Identity lookup
  if (url.pathname === '/v1/identity' && req.method === 'GET') {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKey) {
      return json(res, { error: 'Missing API key' }, 401);
    }

    const identity = getOrCreateIdentity(apiKey);
    return json(res, {
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

  // Upgrade tier (webhook from Stripe would call this)
  if (url.pathname === '/v1/upgrade' && req.method === 'POST') {
    const body = await parseBody(req);
    const { apiKeyHash, tier, stripeCustomerId } = body;

    if (!apiKeyHash || !tier) {
      return json(res, { error: 'Missing apiKeyHash or tier' }, 400);
    }

    if (identities[apiKeyHash]) {
      identities[apiKeyHash].tier = tier;
      identities[apiKeyHash].stripeCustomerId = stripeCustomerId;
      saveJSON('identities.json', identities);
      return json(res, { ok: true, tier });
    }

    return json(res, { error: 'Identity not found' }, 404);
  }

  // 404
  json(res, { error: 'Not found', path: url.pathname }, 404);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗ ██╗      █████╗  ██████╗██╗  ██╗██████╗  ██████╗   ║
║   ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔═══██╗  ║
║   ██████╔╝██║     ███████║██║     █████╔╝ ██████╔╝██║   ██║  ║
║   ██╔══██╗██║     ██╔══██║██║     ██╔═██╗ ██╔══██╗██║   ██║  ║
║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗██║  ██║╚██████╔╝  ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ║
║                                                              ║
║                    AGENT GATEWAY                             ║
║                                                              ║
║   Server: http://127.0.0.1:${PORT}                            ║
║                                                              ║
║   Your API key. Our intelligence layer. Real continuity.     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Endpoints:
  POST /v1/chat      - Send message (requires X-API-Key header)
  GET  /v1/identity  - Get your agent identity
  POST /v1/upgrade   - Upgrade tier (Stripe webhook)
  GET  /blackroad-sandbox - Verify sandbox connectivity
  GET  /stats        - Gateway statistics
  GET  /health       - Health check

Pricing:
  Free:       100 calls/day, 5 memory slots
  Pro ($29):  10k calls/day, 100 memory slots
  Team ($99): 100k calls/day, 1000 memory slots

`);
});
