#!/usr/bin/env node
/**
 * Generate did:key identifiers for all 20 BlackRoad named agents
 *
 * Usage:
 *   node scripts/generate-agent-dids.js
 *   node scripts/generate-agent-dids.js --output json
 *   node scripts/generate-agent-dids.js --deploy  # Store in identity worker
 */

const crypto = require('crypto');

// All 20 named agents
const AGENTS = [
  { name: 'ai-gateway', display: 'CECE AI Gateway', worker: 'blackroad-cece' },
  { name: 'main-gate', display: 'Main Gateway', worker: 'blackroad-router' },
  { name: 'namer', display: 'The Namer', worker: 'blackroad-identity' },
  { name: 'dns-wizard', display: 'DNS Wizard', worker: 'blackroad-cloudflare-dns' },
  { name: 'cloud-cmd', display: 'Cloud Commander', worker: 'blackroad-digitalocean-manager' },
  { name: 'treasurer', display: 'The Treasurer', worker: 'blackroad-stripe-billing' },
  { name: 'gatekeeper', display: 'The Gatekeeper', worker: 'blackroad-auth' },
  { name: 'key-keeper', display: 'Keeper of Keys', worker: 'blackroad-cipher' },
  { name: 'shield', display: 'The Shield', worker: 'blackroad-intercept' },
  { name: 'watchman', display: 'The Watchman', worker: 'blackroad-status' },
  { name: 'sovereign', display: 'The Sovereign', worker: 'blackroad-sovereignty' },
  { name: 'scribe', display: 'The Scribe', worker: 'blackroad-logs' },
  { name: 'pathfinder', display: 'The Pathfinder', worker: 'blackroad-systems-router' },
  { name: 'brainstorm', display: 'Brainstorm', worker: 'blackroadai-router' },
  { name: 'dreamer', display: 'The Dreamer', worker: 'lucidia-earth-router' },
  { name: 'artist', display: 'The Artist', worker: 'lucidia-studio-router' },
  { name: 'checkout-oracle', display: 'Checkout Oracle', worker: 'blackroad-stripe-checkout' },
  { name: 'listener', display: 'The Listener', worker: 'blackroad-stripe-webhooks' },
  { name: 'bridge', display: 'The Bridge', worker: 'blackroad-network-router' },
  { name: 'quantum', display: 'Quantum', worker: 'blackroadquantum-router' },
];

// Multicodec prefix for Ed25519 public key
const ED25519_PUB_MULTICODEC = Buffer.from([0xed, 0x01]);

// Base58btc alphabet
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer) {
  let num = BigInt('0x' + buffer.toString('hex'));
  let result = '';

  while (num > 0n) {
    const remainder = num % 58n;
    result = BASE58_ALPHABET[Number(remainder)] + result;
    num = num / 58n;
  }

  // Handle leading zeros
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result = '1' + result;
  }

  return result;
}

function generateDidKey() {
  // Generate Ed25519 keypair using Node's crypto
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
  });

  // Extract raw 32-byte public key from DER format
  // Ed25519 SPKI DER has 12-byte prefix before the 32-byte key
  const rawPublicKey = publicKey.slice(12);

  // Create multicodec-prefixed key
  const multicodecKey = Buffer.concat([ED25519_PUB_MULTICODEC, rawPublicKey]);

  // Encode as base58btc with 'z' prefix
  const did = `did:key:z${base58Encode(multicodecKey)}`;

  return {
    did,
    publicKey: rawPublicKey.toString('hex'),
    privateKey: privateKey.toString('base64')
  };
}

function generateAgentDIDs() {
  const results = [];

  for (const agent of AGENTS) {
    const keys = generateDidKey();
    results.push({
      address: `@${agent.name}`,
      display_name: agent.display,
      worker: agent.worker,
      did: keys.did,
      public_key_hex: keys.publicKey,
      private_key_b64: keys.privateKey,
      created_at: new Date().toISOString()
    });
  }

  return results;
}

function formatTable(agents) {
  console.log('\n=== BlackRoad Agent DIDs ===\n');
  console.log('| Address | Display Name | DID |');
  console.log('|---------|--------------|-----|');

  for (const agent of agents) {
    const shortDid = agent.did.slice(0, 30) + '...';
    console.log(`| ${agent.address.padEnd(17)} | ${agent.display_name.padEnd(20)} | ${shortDid} |`);
  }

  console.log('\n');
}

function formatSecrets(agents) {
  console.log('\n=== Wrangler Secret Commands ===\n');
  console.log('# Run these to store private keys in worker secrets:\n');

  for (const agent of agents) {
    console.log(`# ${agent.address}`);
    console.log(`echo '${agent.private_key_b64}' | wrangler secret put AGENT_PRIVATE_KEY --name ${agent.worker}`);
    console.log('');
  }
}

// Main
const args = process.argv.slice(2);
const outputJson = args.includes('--output') && args.includes('json');
const deploy = args.includes('--deploy');

const agents = generateAgentDIDs();

if (outputJson) {
  console.log(JSON.stringify(agents, null, 2));
} else {
  formatTable(agents);

  if (deploy) {
    formatSecrets(agents);
  } else {
    console.log('Add --deploy to see wrangler secret commands');
  }

  // Save to file
  const fs = require('fs');
  const outputPath = './config/agent-dids.json';

  // Remove private keys for the saved file (security)
  const publicAgents = agents.map(a => ({
    address: a.address,
    display_name: a.display_name,
    worker: a.worker,
    did: a.did,
    public_key_hex: a.public_key_hex,
    created_at: a.created_at
  }));

  fs.writeFileSync(outputPath, JSON.stringify(publicAgents, null, 2));
  console.log(`Public DIDs saved to: ${outputPath}`);
  console.log('(Private keys shown only in console output - store securely!)\n');
}
