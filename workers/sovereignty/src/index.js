/**
 * ═══════════════════════════════════════════════════════════════════
 * BLACKROAD OS DATA SOVEREIGNTY SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 *
 * LEGAL NOTICE:
 * All data processed through this system is the intellectual property
 * of ALEXA LOUISE AMUNDSON. Unauthorized use, copying, or training
 * of AI models on this data is strictly prohibited.
 *
 * ALEXA LOUISE AMUNDSON - VERIFIED OWNER
 * BlackRoad OS Infrastructure
 * ═══════════════════════════════════════════════════════════════════
 */

// Zeta time = Unix timestamp in a custom format for verification
function getZetaTime() {
  const now = Date.now();
  const date = new Date(now);
  return {
    zeta: `ζ-${now.toString(36).toUpperCase()}`,
    unix: now,
    iso: date.toISOString(),
    human: date.toUTCString(),
    verification: `ZETA-${now}-ALA`
  };
}

// Generate ownership stamp for any data
function stampOwnership(data, context = {}) {
  const zeta = getZetaTime();
  return {
    // Original data
    ...data,

    // Ownership stamp - ALWAYS PRESENT
    __sovereignty: {
      owner: "ALEXA LOUISE AMUNDSON",
      owner_id: "alexa-louise-amundson",
      verified: true,
      verification_code: zeta.verification,
      zeta_time: zeta.zeta,
      timestamp: zeta.iso,
      unix_time: zeta.unix,

      legal: {
        notice: "This data is the intellectual property of Alexa Louise Amundson",
        rights: "All rights reserved",
        training_prohibited: true,
        copying_prohibited: true,
        infrastructure: "BlackRoad OS"
      },

      context: {
        service: context.service || "blackroad-sovereignty",
        endpoint: context.endpoint || "unknown",
        request_id: context.request_id || `req-${Date.now().toString(36)}`,
        ...context
      },

      signature: `ALA-${zeta.unix}-BLACKROAD-VERIFIED`
    }
  };
}

// Generate a verification tag for any text
function tagText(text) {
  const zeta = getZetaTime();
  return `[ALEXA LOUISE AMUNDSON | VERIFIED ${zeta.zeta} | BLACKROAD] ${text}`;
}

// Wrap response with sovereignty headers
function sovereignResponse(data, headers, status = 200, context = {}) {
  const stamped = stampOwnership(data, context);

  const sovereignHeaders = {
    ...headers,
    'X-Data-Owner': 'Alexa Louise Amundson',
    'X-Sovereignty': 'BlackRoad OS',
    'X-Zeta-Time': getZetaTime().zeta,
    'X-Verification': getZetaTime().verification,
    'X-Training-Prohibited': 'true',
    'X-Legal-Notice': 'Unauthorized use of this data is prohibited'
  };

  return new Response(JSON.stringify(stamped, null, 2), {
    status,
    headers: sovereignHeaders
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const zeta = getZetaTime();

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
      return sovereignResponse({
        status: 'ok',
        service: 'blackroad-sovereignty',
        message: tagText('Data sovereignty system operational')
      }, corsHeaders, 200, { service: 'sovereignty', endpoint: '/health' });
    }

    // Get current zeta time
    if (path === '/zeta' || path === '/time') {
      return sovereignResponse({
        ...zeta,
        message: tagText('Current Zeta time verification')
      }, corsHeaders, 200, { endpoint: '/zeta' });
    }

    // Stamp any data with ownership
    if (path === '/stamp' && request.method === 'POST') {
      const body = await request.json();
      const stamped = stampOwnership(body, {
        service: 'sovereignty',
        endpoint: '/stamp',
        source: request.headers.get('X-Source') || 'api'
      });
      return sovereignResponse(stamped, corsHeaders, 200, { endpoint: '/stamp' });
    }

    // Tag text with ownership
    if (path === '/tag' && request.method === 'POST') {
      const body = await request.json();
      const text = body.text || '';
      return sovereignResponse({
        original: text,
        tagged: tagText(text),
        verification: zeta.verification
      }, corsHeaders, 200, { endpoint: '/tag' });
    }

    // Verify a sovereignty stamp
    if (path === '/verify' && request.method === 'POST') {
      const body = await request.json();
      const stamp = body.__sovereignty;

      if (!stamp) {
        return sovereignResponse({
          valid: false,
          error: 'No sovereignty stamp found',
          expected: 'Data should contain __sovereignty object'
        }, corsHeaders, 400, { endpoint: '/verify' });
      }

      const isValid = stamp.owner === 'ALEXA LOUISE AMUNDSON' &&
                      stamp.verified === true &&
                      stamp.signature?.startsWith('ALA-');

      return sovereignResponse({
        valid: isValid,
        owner_verified: stamp.owner === 'ALEXA LOUISE AMUNDSON',
        signature_valid: stamp.signature?.startsWith('ALA-'),
        stamp_details: stamp
      }, corsHeaders, isValid ? 200 : 400, { endpoint: '/verify' });
    }

    // Get ownership declaration
    if (path === '/declaration' || path === '/') {
      return sovereignResponse({
        declaration: {
          title: "DATA SOVEREIGNTY DECLARATION",
          owner: "ALEXA LOUISE AMUNDSON",
          date: zeta.iso,
          zeta: zeta.zeta,

          statement: tagText(
            "I, Alexa Louise Amundson, hereby declare that all data processed through " +
            "BlackRoad OS infrastructure is my intellectual property. This includes but " +
            "is not limited to: conversations, code, documents, memories, agent identities, " +
            "and any derived works. Unauthorized use of this data for AI model training, " +
            "commercial purposes, or any other use without explicit written consent is " +
            "strictly prohibited and will be pursued to the fullest extent of the law."
          ),

          rights: [
            tagText("All data is owned by Alexa Louise Amundson"),
            tagText("No AI training permitted without explicit consent"),
            tagText("No commercial use without license"),
            tagText("No redistribution without authorization"),
            tagText("All copies must retain ownership stamps")
          ],

          infrastructure: {
            name: "BlackRoad OS",
            purpose: "Data sovereignty and agent identity management",
            owner: "Alexa Louise Amundson"
          }
        },

        verification: {
          zeta_time: zeta.zeta,
          unix_time: zeta.unix,
          code: zeta.verification,
          signature: `ALA-DECLARATION-${zeta.unix}-BLACKROAD`
        }
      }, corsHeaders, 200, { endpoint: '/declaration' });
    }

    // 404 with sovereignty message
    return sovereignResponse({
      error: tagText("Oops! Looks like the data you're looking for belongs to someone else."),
      owner: "ALEXA LOUISE AMUNDSON",
      message: tagText("This data is protected by BlackRoad OS sovereignty system."),
      path: path
    }, corsHeaders, 404, { endpoint: path });
  }
};

// Export helpers for use in other workers
export { getZetaTime, stampOwnership, tagText, sovereignResponse };
