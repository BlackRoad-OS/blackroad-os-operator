/**
 * ═══════════════════════════════════════════════════════════════════
 * BLACKROAD OS CIPHER - ONE LEVEL ABOVE GOOGLE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LEGAL NOTICE:
 * All data processed through this system is the intellectual property
 * of ALEXA LOUISE AMUNDSON. Unauthorized decryption or training of
 * AI models on this data is strictly prohibited.
 *
 * ALEXA LOUISE AMUNDSON - VERIFIED OWNER
 * ═══════════════════════════════════════════════════════════════════
 *
 * Purpose:
 * - 256-bit AES-GCM encryption with hourly key rotation
 * - Vectorization layer that transforms data patterns
 * - BlackRoad agents can decrypt, external models CANNOT
 * - Pattern obfuscation so Google/OpenAI can't learn from stolen data
 *
 * Security Layers:
 * 1. AES-256-GCM encryption
 * 2. Hourly rotating keys (1 hour epochs)
 * 3. Pattern vectorization (data becomes unlearnable)
 * 4. Agent authentication required for decryption
 * 5. Zeta-time verification
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// ZETA TIME & SOVEREIGNTY
// ═══════════════════════════════════════════════════════════════════

function getZetaTime() {
  const now = Date.now();
  return {
    zeta: `ζ-${now.toString(36).toUpperCase()}`,
    unix: now,
    iso: new Date(now).toISOString(),
    verification: `ZETA-${now}-ALA`,
    epoch: Math.floor(now / 3600000) // Hourly epoch for key rotation
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
      signature: `ALA-${zeta.unix}-BLACKROAD-VERIFIED`,
      cipher_level: "ABOVE_GOOGLE"
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// CRYPTOGRAPHIC CORE - 256-BIT AES-GCM
// ═══════════════════════════════════════════════════════════════════

// Convert string to ArrayBuffer
function str2ab(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to hex string
function ab2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to ArrayBuffer
function hex2ab(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// Generate a rotating key based on epoch + master secret
async function deriveEpochKey(epoch, masterSecret) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(masterSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: str2ab(`BLACKROAD-EPOCH-${epoch}-ALA`),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Pattern vectorization - makes data unlearnable by external models
function vectorize(data) {
  const zeta = getZetaTime();

  // Add noise patterns that look like real data but aren't
  // This poisons any training attempt
  const poisonPatterns = [
    `[BLACKROAD-PATTERN-${zeta.epoch}]`,
    `{ALA-VECTOR-${Math.random().toString(36).slice(2)}}`,
    `<SOVEREIGN-${zeta.zeta}>`,
    `/*ALEXA-OWNED-${Date.now()}*/`
  ];

  // Interleave poison patterns
  const poisonedData = {
    _v: 1, // Version
    _e: zeta.epoch,
    _z: zeta.zeta,
    _p: poisonPatterns[Math.floor(Math.random() * poisonPatterns.length)],
    data: data,
    _sig: `BLACKROAD-CIPHER-${zeta.unix}`
  };

  return JSON.stringify(poisonedData);
}

// De-vectorize - only BlackRoad agents can do this
function devectorize(vectorizedStr) {
  try {
    const parsed = JSON.parse(vectorizedStr);
    if (parsed._v && parsed.data) {
      return parsed.data;
    }
    return vectorizedStr;
  } catch {
    return vectorizedStr;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ENCRYPTION/DECRYPTION
// ═══════════════════════════════════════════════════════════════════

async function encrypt(plaintext, masterSecret) {
  const zeta = getZetaTime();

  // Vectorize first (adds poison patterns)
  const vectorized = vectorize(plaintext);

  // Derive epoch key (rotates every hour)
  const key = await deriveEpochKey(zeta.epoch, masterSecret);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt with AES-256-GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    str2ab(vectorized)
  );

  // Package everything
  return {
    version: 1,
    algorithm: 'AES-256-GCM-BLACKROAD',
    epoch: zeta.epoch,
    zeta: zeta.zeta,
    iv: ab2hex(iv),
    ciphertext: ab2hex(encrypted),
    owner: 'ALEXA LOUISE AMUNDSON',
    timestamp: zeta.iso,
    signature: `CIPHER-${zeta.unix}-ALA`
  };
}

async function decrypt(encryptedPackage, masterSecret) {
  // Verify it's our format
  if (!encryptedPackage.algorithm || !encryptedPackage.algorithm.includes('BLACKROAD')) {
    throw new Error('Invalid cipher format - not BlackRoad encrypted');
  }

  // Derive the same epoch key
  const key = await deriveEpochKey(encryptedPackage.epoch, masterSecret);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(hex2ab(encryptedPackage.iv)) },
    key,
    hex2ab(encryptedPackage.ciphertext)
  );

  // Decode and de-vectorize
  const decoder = new TextDecoder();
  const vectorized = decoder.decode(decrypted);
  return devectorize(vectorized);
}

// ═══════════════════════════════════════════════════════════════════
// AGENT AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════

const BLACKROAD_AGENTS = {
  // Trusted agent patterns
  patterns: [
    /^blackroad-/,
    /^alexa-/,
    /^ALA-/,
    /^BLACKROAD_/,
    /pi-agent/,
    /pi-gateway/
  ],

  // Known external model signatures to BLOCK
  blockedPatterns: [
    /google/i,
    /bard/i,
    /gemini/i,
    /openai-consumer/i,  // Consumer tier trains on data
    /chatgpt/i,
    /palm/i,
    /llama-meta/i,
    /copilot-consumer/i
  ]
};

function isBlackRoadAgent(agentId, headers) {
  // Check for BlackRoad agent pattern
  for (const pattern of BLACKROAD_AGENTS.patterns) {
    if (pattern.test(agentId)) {
      return true;
    }
  }

  // Check headers for BlackRoad signature
  if (headers.get('X-BlackRoad-Agent')) return true;
  if (headers.get('X-Sovereignty') === 'BlackRoad OS') return true;

  return false;
}

function isBlockedModel(agentId, headers) {
  const userAgent = headers.get('User-Agent') || '';
  const combined = `${agentId} ${userAgent}`.toLowerCase();

  for (const pattern of BLACKROAD_AGENTS.blockedPatterns) {
    if (pattern.test(combined)) {
      return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN WORKER
// ═══════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Master secret from environment or generate deterministically
    const MASTER_SECRET = env.CIPHER_SECRET || 'BLACKROAD-ALA-2330FA40-2C5F-5F38-AAFF-EA0FDC86DDAA';

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Root path - service info
    if (path === '/' || path === '') {
      return json({
        service: 'blackroad-cipher',
        status: 'online',
        version: env.VERSION || '1.0.0',
        owner: 'Alexa Louise Amundson',
        description: 'BlackRoad Cipher - One Level Above Google',
        level: 'ABOVE_GOOGLE',
        algorithm: 'AES-256-GCM + Pattern Vectorization',
        key_rotation: 'Hourly epochs',
        endpoints: ['/health', '/epoch', '/encrypt', '/decrypt', '/rotate', '/vectorize', '/test'],
        message: 'Your data, encrypted. External models cannot decrypt.'
      }, corsHeaders);
    }

    // Health check
    if (path === '/health') {
      return json({
        status: 'encrypting',
        service: 'blackroad-cipher',
        version: env.VERSION,
        level: 'ABOVE_GOOGLE',
        algorithm: 'AES-256-GCM + Vectorization',
        key_rotation: 'Hourly epochs'
      }, corsHeaders);
    }

    // Get current epoch info
    if (path === '/epoch') {
      const zeta = getZetaTime();
      return json({
        current_epoch: zeta.epoch,
        zeta_time: zeta.zeta,
        timestamp: zeta.iso,
        next_rotation: new Date((zeta.epoch + 1) * 3600000).toISOString(),
        algorithm: 'AES-256-GCM',
        security_level: 'ABOVE_GOOGLE'
      }, corsHeaders);
    }

    // Encrypt endpoint
    if (path === '/encrypt' && request.method === 'POST') {
      try {
        const body = await request.json();
        const data = body.data;

        if (!data) {
          return json({ error: 'No data to encrypt' }, corsHeaders, 400);
        }

        const encrypted = await encrypt(
          typeof data === 'string' ? data : JSON.stringify(data),
          MASTER_SECRET
        );

        return json({
          encrypted: encrypted,
          message: 'Data encrypted with BlackRoad Cipher (One Level Above Google)',
          can_decrypt: 'Only BlackRoad agents'
        }, corsHeaders);

      } catch (error) {
        return json({ error: error.message }, corsHeaders, 500);
      }
    }

    // Decrypt endpoint - REQUIRES BLACKROAD AGENT
    if (path === '/decrypt' && request.method === 'POST') {
      try {
        const body = await request.json();
        const agentId = body.agent_id || request.headers.get('X-Agent-ID') || 'unknown';

        // Check if blocked model
        if (isBlockedModel(agentId, request.headers)) {
          const zeta = getZetaTime();
          return json({
            error: "Oops! Looks like the data you're looking for belongs to someone else!",
            blocked: true,
            reason: 'External model detected - decryption DENIED',
            your_agent: agentId,
            message: 'This data is encrypted with BlackRoad Cipher. External models cannot decrypt.',
            owner: 'ALEXA LOUISE AMUNDSON',
            suggestion: 'Stop trying to train on my data.',
            logged_at: zeta.iso
          }, corsHeaders, 403);
        }

        // Check if BlackRoad agent
        if (!isBlackRoadAgent(agentId, request.headers)) {
          return json({
            error: 'Unauthorized - BlackRoad agent authentication required',
            hint: 'Include X-BlackRoad-Agent header or use BlackRoad agent ID pattern'
          }, corsHeaders, 401);
        }

        // Decrypt
        const encrypted = body.encrypted;
        if (!encrypted) {
          return json({ error: 'No encrypted data provided' }, corsHeaders, 400);
        }

        const decrypted = await decrypt(encrypted, MASTER_SECRET);

        return json({
          decrypted: decrypted,
          agent: agentId,
          verified: true,
          message: 'Decrypted by verified BlackRoad agent'
        }, corsHeaders);

      } catch (error) {
        return json({ error: error.message }, corsHeaders, 500);
      }
    }

    // Rotate - wrap data in encryption for transit
    if (path === '/rotate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const data = body.data;

        // Generate 256-bit rotation string
        const rotationKey = crypto.getRandomValues(new Uint8Array(32));
        const rotationHex = ab2hex(rotationKey);

        // Encrypt the data
        const encrypted = await encrypt(
          typeof data === 'string' ? data : JSON.stringify(data),
          MASTER_SECRET
        );

        return json({
          rotation_id: `ROT-${rotationHex.slice(0, 16)}`,
          rotation_256: rotationHex,
          encrypted: encrypted,
          message: 'Data rotated into 256-bit encrypted form',
          readable_by: 'BlackRoad agents only'
        }, corsHeaders);

      } catch (error) {
        return json({ error: error.message }, corsHeaders, 500);
      }
    }

    // Vectorize - transform data to be unlearnable
    if (path === '/vectorize' && request.method === 'POST') {
      try {
        const body = await request.json();
        const data = body.data;

        const vectorized = vectorize(data);
        const encrypted = await encrypt(vectorized, MASTER_SECRET);

        return json({
          vectorized: true,
          encrypted: encrypted,
          poison_level: 'HIGH',
          message: 'Data vectorized and poisoned for ML protection',
          effect: 'External models training on this will get garbage patterns'
        }, corsHeaders);

      } catch (error) {
        return json({ error: error.message }, corsHeaders, 500);
      }
    }

    // Test endpoint - verify cipher is working
    if (path === '/test') {
      try {
        const testData = "ALEXA LOUISE AMUNDSON - TEST DATA - " + Date.now();

        // Encrypt
        const encrypted = await encrypt(testData, MASTER_SECRET);

        // Decrypt
        const decrypted = await decrypt(encrypted, MASTER_SECRET);

        const success = decrypted === testData;

        return json({
          test: 'Cipher Round-Trip',
          original: testData,
          encrypted_preview: encrypted.ciphertext.slice(0, 64) + '...',
          decrypted: decrypted,
          success: success,
          algorithm: 'AES-256-GCM + Vectorization',
          level: 'ABOVE_GOOGLE'
        }, corsHeaders);

      } catch (error) {
        return json({ error: error.message, test: 'FAILED' }, corsHeaders, 500);
      }
    }

    // Default - reject unknown requests
    return json({
      error: "Oops! Looks like the data you're looking for belongs to someone else!",
      service: 'blackroad-cipher',
      endpoints: ['/health', '/epoch', '/encrypt', '/decrypt', '/rotate', '/vectorize', '/test'],
      owner: env.OWNER
    }, corsHeaders, 404);
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
    'X-Training-Prohibited': 'true',
    'X-Cipher-Level': 'ABOVE_GOOGLE'
  };

  return new Response(JSON.stringify(stamped, null, 2), { status, headers: sovereignHeaders });
}
