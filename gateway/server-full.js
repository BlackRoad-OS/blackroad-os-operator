#!/usr/bin/env node

/**
 * BlackRoad Gateway - Full Server
 * Serves both the landing page and the API
 */

import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.GATEWAY_PORT || 3849;
const DATA_DIR = process.env.DATA_DIR || path.join(process.env.HOME, '.blackroad', 'gateway');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(res, filepath) {
  const ext = path.extname(filepath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filepath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    return true;
  } catch (e) {
    return false;
  }
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
// IDENTITY SYSTEM
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
      sentiment: 0,
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
// MEMORY SYSTEM
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
    content: content.slice(0, 500),
    timestamp: Date.now()
  });

  while (identity.memory.length > limit) {
    identity.memory.shift();
  }

  updateIdentity(identity);
}

function getContextWindow(identity, maxTokens = 2000) {
  const memories = identity.memory.slice(-10);
  let context = '';
  for (const mem of memories) {
    context += `[${mem.role}]: ${mem.content}\n`;
  }
  return context.slice(-maxTokens);
}

// ============================================================================
// SENTIMENT ANALYSIS
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

  const today = new Date().toDateString();
  const lastCallDate = identity.lastCall ? new Date(identity.lastCall).toDateString() : null;
  if (lastCallDate !== today) {
    identity.callsToday = 0;
  }

  if (identity.callsToday >= limits.daily) {
    return { allowed: false, reason: 'Daily limit reached', resetIn: 'tomorrow' };
  }

  if (!rateLimitWindows[windowKey]) {
    rateLimitWindows[windowKey] = [];
  }

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
  const context = getContextWindow(identity);
  const sentiment = analyzeSentiment(userMessage);

  identity.traits.sentiment = (identity.traits.sentiment * 0.9) + (sentiment * 0.1);

  const systemPrompt = `You are ${identity.name}, a BlackRoad agent with persistent memory and identity.

Your traits:
- Trust score: ${identity.traits.trustScore.toFixed(2)}
- Emotional tone: ${identity.traits.sentiment > 0.3 ? 'positive' : identity.traits.sentiment < -0.3 ? 'concerned' : 'neutral'}
- Total interactions: ${identity.callsTotal}

Recent context from your memory:
${context || '(No prior context)'}

Respond helpfully while maintaining continuity with past interactions.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  const recentMemory = identity.memory.slice(-6);
  for (const mem of recentMemory) {
    messages.splice(-1, 0, { role: mem.role, content: mem.content });
  }

  let response;
  if (provider === 'anthropic') {
    response = await proxyToAnthropic(apiKey, messages, model);
  } else {
    response = await proxyToOpenAI(apiKey, messages, model);
  }

  const assistantMessage = response.choices?.[0]?.message?.content || 'Error: No response';

  addToMemory(identity, 'user', userMessage);
  addToMemory(identity, 'assistant', assistantMessage);
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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Provider'
};

function json(res, data, status = 200) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
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
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API Routes
  if (url.pathname.startsWith('/v1/') || url.pathname === '/health' || url.pathname === '/stats') {

    if (url.pathname === '/health') {
      return json(res, {
        service: 'blackroad-gateway',
        version: '1.0.0',
        status: 'online',
        identities: Object.keys(identities).length,
        message: 'Your API key. Our intelligence layer. Real continuity.'
      });
    }

    if (url.pathname === '/stats') {
      return json(res, {
        totalIdentities: Object.keys(identities).length,
        totalCalls: Object.values(identities).reduce((sum, i) => sum + i.callsTotal, 0),
        tierBreakdown: {
          free: Object.values(identities).filter(i => i.tier === 'free').length,
          pro: Object.values(identities).filter(i => i.tier === 'pro').length,
          team: Object.values(identities).filter(i => i.tier === 'team').length,
          enterprise: Object.values(identities).filter(i => i.tier === 'enterprise').length
        }
      });
    }

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

      const identity = getOrCreateIdentity(apiKey);
      const rateCheck = checkRateLimit(identity);

      if (!rateCheck.allowed) {
        return json(res, {
          error: rateCheck.reason,
          resetIn: rateCheck.resetIn,
          tier: identity.tier,
          upgrade: 'https://gateway.blackroad.cloud/#pricing'
        }, 429);
      }

      try {
        const result = await handleGatewayRequest(identity, message, provider, apiKey, model);
        return json(res, { ok: true, ...result });
      } catch (err) {
        console.error('Gateway error:', err);
        return json(res, { error: err.message }, 500);
      }
    }

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

    return json(res, { error: 'Not found', path: url.pathname }, 404);
  }

  // Static files
  let filepath = url.pathname;
  if (filepath === '/') filepath = '/index.html';

  const fullPath = path.join(__dirname, filepath);
  if (serveStatic(res, fullPath)) return;

  // 404 for static
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
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
║   http://0.0.0.0:${PORT}                                       ║
║                                                              ║
║   Your API key. Our intelligence layer. Real continuity.     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Landing Page: http://localhost:${PORT}/
API Docs:     http://localhost:${PORT}/health

`);
});
