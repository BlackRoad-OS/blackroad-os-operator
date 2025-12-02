/**
 * BRTM - BlackRoad Trade Mark / Truth Mark Protocol
 *
 * BRTM means both:
 *   1. BlackRoad Trade Mark - Verification of ownership/prior art
 *   2. BlackRoad Truth Mark - Verification of authenticity/validity
 *
 * The highest level of verification in intellectual property space.
 *
 * How it works:
 * 1. Any creation (trademark, patent, domain, code, idea) gets a PS-SHA-∞ anchor
 * 2. The anchor is timestamped and stored on RoadChain + Internet Archive
 * 3. When someone attempts to register IP, BRTM is checked first
 * 4. If BlackRoad has prior art with verified timestamp, it holds
 *
 * Legal basis:
 * - First-to-use (common law trademark)
 * - Prior art (patent law)
 * - WHOIS historical records (domain law)
 * - Copyright registration (automatic upon creation)
 *
 * "If BlackRoad has it verified, BlackRoad holds it."
 */

import { createHash } from 'crypto';

// =============================================================================
// BRTM TYPES
// =============================================================================

/**
 * Types of intellectual property that can be BRTM verified
 */
export type IPType =
  | 'trademark'      // Brand names, logos, slogans
  | 'patent'         // Inventions, processes, designs
  | 'domain'         // Domain names
  | 'copyright'      // Creative works, code, documentation
  | 'trade_secret'   // Confidential business information
  | 'design'         // Industrial designs
  | 'algorithm'      // Mathematical/computational methods
  | 'protocol'       // Standards, specifications
  | 'concept'        // Ideas, theories, frameworks
  | 'data'           // Datasets, databases
  | 'model'          // ML models, mathematical models
  | 'name'           // Personal/business names
  ;

/**
 * Verification level - how strongly we can prove ownership
 */
export type VerificationLevel =
  | 'BRTM-1'  // Self-attested (lowest)
  | 'BRTM-2'  // Timestamped on RoadChain
  | 'BRTM-3'  // Timestamped + Internet Archive
  | 'BRTM-4'  // Above + third-party attestation
  | 'BRTM-5'  // Above + legal registration (USPTO, etc.)
  ;

/**
 * A BRTM Record - the core data structure
 */
export interface BRTMRecord {
  // Unique identifier
  id: string;

  // PS-SHA-∞ anchor (cryptographic identity)
  anchor: {
    hash: string;
    predecessor: string;      // Previous hash in chain
    chain_position: number;   // Position in infinite chain
  };

  // What is being verified
  subject: {
    type: IPType;
    name: string;             // The mark/name/title
    description: string;      // Detailed description
    content_hash: string;     // Hash of the actual content
    categories: string[];     // Nice classes for trademarks, IPC for patents
  };

  // Who owns it
  owner: {
    name: string;
    email: string;
    wallet?: string;          // Crypto wallet for on-chain verification
    legal_entity?: string;    // Corporation, LLC, etc.
  };

  // When
  timestamps: {
    created_at: string;       // ISO timestamp
    first_use: string;        // First use in commerce (trademarks)
    anchored_at: string;      // When PS-SHA-∞ anchor was created
    archived_at?: string;     // When archived on Internet Archive
    registered_at?: string;   // When legally registered
  };

  // Evidence
  evidence: Evidence[];

  // Verification status
  verification: {
    level: VerificationLevel;
    roadchain_tx?: string;    // Transaction on RoadChain
    archive_url?: string;     // Internet Archive URL
    legal_reg_number?: string; // USPTO, WIPO, etc.
    attestations: Attestation[];
  };

  // Conflicts
  conflicts: Conflict[];

  // Status
  status: 'active' | 'pending' | 'disputed' | 'abandoned' | 'expired';
}

export interface Evidence {
  type: 'screenshot' | 'document' | 'code' | 'media' | 'witness' | 'archive' | 'blockchain';
  hash: string;
  url?: string;
  description: string;
  timestamp: string;
}

export interface Attestation {
  attester: string;           // Who is attesting
  timestamp: string;
  signature: string;          // Cryptographic signature
  statement: string;
}

export interface Conflict {
  claimant: string;
  claim_date: string;
  claim_type: string;
  resolution?: 'brtm_prevails' | 'claimant_prevails' | 'coexistence' | 'pending';
  notes?: string;
}

// =============================================================================
// PS-SHA-∞ ANCHORING
// =============================================================================

const ALGORITHM = 'sha256';

/**
 * Generate PS-SHA-∞ anchor for a BRTM record
 *
 * anchor[n] = hash(anchor[n-1] + content + timestamp + owner)
 */
export function generateAnchor(
  content: string,
  owner: string,
  predecessor: string = 'GENESIS'
): { hash: string; predecessor: string } {
  const data = `${predecessor}:${content}:${owner}:${Date.now()}`;
  const hash = createHash(ALGORITHM).update(data).digest('hex');

  return { hash, predecessor };
}

/**
 * Verify an anchor against claimed content
 */
export function verifyAnchor(
  claimed_hash: string,
  content: string,
  owner: string,
  predecessor: string,
  timestamp: number,
  tolerance_ms: number = 60000  // 1 minute tolerance
): boolean {
  // Try timestamps within tolerance
  for (let t = timestamp - tolerance_ms; t <= timestamp + tolerance_ms; t += 1000) {
    const data = `${predecessor}:${content}:${owner}:${t}`;
    const hash = createHash(ALGORITHM).update(data).digest('hex');
    if (hash === claimed_hash) return true;
  }
  return false;
}

// =============================================================================
// BRTM OPERATIONS
// =============================================================================

/**
 * Create a new BRTM record (BRTM-1: self-attested)
 */
export function createBRTMRecord(
  type: IPType,
  name: string,
  description: string,
  content: string,
  owner: { name: string; email: string; legal_entity?: string }
): BRTMRecord {
  const content_hash = createHash(ALGORITHM).update(content).digest('hex');
  const anchor = generateAnchor(`${type}:${name}:${content_hash}`, owner.email);

  const now = new Date().toISOString();

  return {
    id: `BRTM-${Date.now()}-${anchor.hash.slice(0, 8)}`,
    anchor: {
      hash: anchor.hash,
      predecessor: anchor.predecessor,
      chain_position: 1
    },
    subject: {
      type,
      name,
      description,
      content_hash,
      categories: []
    },
    owner,
    timestamps: {
      created_at: now,
      first_use: now,
      anchored_at: now
    },
    evidence: [],
    verification: {
      level: 'BRTM-1',
      attestations: []
    },
    conflicts: [],
    status: 'pending'
  };
}

/**
 * Upgrade to BRTM-2: Submit to RoadChain
 */
export async function upgradeToRoadChain(record: BRTMRecord): Promise<BRTMRecord> {
  // TODO: Implement actual RoadChain submission
  // For now, simulate the transaction

  const tx_hash = createHash(ALGORITHM)
    .update(`roadchain:${record.anchor.hash}:${Date.now()}`)
    .digest('hex');

  return {
    ...record,
    verification: {
      ...record.verification,
      level: 'BRTM-2',
      roadchain_tx: tx_hash
    },
    status: 'active'
  };
}

/**
 * Upgrade to BRTM-3: Archive on Internet Archive
 */
export async function upgradeToArchive(record: BRTMRecord): Promise<BRTMRecord> {
  // TODO: Implement actual Internet Archive submission via Wayback Machine API
  // https://web.archive.org/save/{url}

  const archive_id = `BRTM_${record.id}_${Date.now()}`;
  const archive_url = `https://web.archive.org/web/${new Date().toISOString().replace(/[-:]/g, '').slice(0, 14)}*/blackroad.io/brtm/${record.id}`;

  return {
    ...record,
    timestamps: {
      ...record.timestamps,
      archived_at: new Date().toISOString()
    },
    verification: {
      ...record.verification,
      level: 'BRTM-3',
      archive_url
    },
    evidence: [
      ...record.evidence,
      {
        type: 'archive',
        hash: createHash(ALGORITHM).update(archive_url).digest('hex'),
        url: archive_url,
        description: 'Internet Archive snapshot',
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Add third-party attestation for BRTM-4
 */
export function addAttestation(
  record: BRTMRecord,
  attester: string,
  signature: string,
  statement: string
): BRTMRecord {
  const attestation: Attestation = {
    attester,
    timestamp: new Date().toISOString(),
    signature,
    statement
  };

  const newLevel = record.verification.attestations.length >= 2 ? 'BRTM-4' : record.verification.level;

  return {
    ...record,
    verification: {
      ...record.verification,
      level: newLevel,
      attestations: [...record.verification.attestations, attestation]
    }
  };
}

/**
 * Record legal registration for BRTM-5
 */
export function recordLegalRegistration(
  record: BRTMRecord,
  registration_number: string,
  registration_date: string
): BRTMRecord {
  return {
    ...record,
    timestamps: {
      ...record.timestamps,
      registered_at: registration_date
    },
    verification: {
      ...record.verification,
      level: 'BRTM-5',
      legal_reg_number: registration_number
    }
  };
}

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * Check if a new claim conflicts with existing BRTM records
 */
export function checkConflict(
  new_claim: { type: IPType; name: string; content_hash?: string },
  existing_records: BRTMRecord[]
): {
  conflicts: BRTMRecord[];
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'blocking';
} {
  const conflicts: BRTMRecord[] = [];

  for (const record of existing_records) {
    if (record.status !== 'active') continue;

    // Exact name match
    if (record.subject.name.toLowerCase() === new_claim.name.toLowerCase()) {
      conflicts.push(record);
      continue;
    }

    // Similar name (would need fuzzy matching)
    const similarity = calculateSimilarity(record.subject.name, new_claim.name);
    if (similarity > 0.8) {
      conflicts.push(record);
      continue;
    }

    // Same content hash (exact content match)
    if (new_claim.content_hash && record.subject.content_hash === new_claim.content_hash) {
      conflicts.push(record);
    }
  }

  let risk_level: 'none' | 'low' | 'medium' | 'high' | 'blocking' = 'none';

  if (conflicts.length === 0) {
    risk_level = 'none';
  } else {
    const highest = conflicts.reduce((max, r) =>
      r.verification.level > max ? r.verification.level : max
    , 'BRTM-1');

    switch (highest) {
      case 'BRTM-1': risk_level = 'low'; break;
      case 'BRTM-2': risk_level = 'medium'; break;
      case 'BRTM-3': risk_level = 'high'; break;
      case 'BRTM-4':
      case 'BRTM-5': risk_level = 'blocking'; break;
    }
  }

  return { conflicts, risk_level };
}

/**
 * Simple string similarity (Jaccard on character bigrams)
 */
function calculateSimilarity(a: string, b: string): number {
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();

  const strA = a.toLowerCase();
  const strB = b.toLowerCase();

  for (let i = 0; i < strA.length - 1; i++) {
    bigramsA.add(strA.slice(i, i + 2));
  }
  for (let i = 0; i < strB.length - 1; i++) {
    bigramsB.add(strB.slice(i, i + 2));
  }

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// =============================================================================
// WEBHOOK FOR EXTERNAL REGISTRIES
// =============================================================================

/**
 * Webhook handler for when someone attempts to register IP
 *
 * This would be called by:
 * - Domain registrars (via partnership/API)
 * - Trademark offices (via official API when available)
 * - Patent offices
 * - NFT platforms
 */
export interface RegistryWebhook {
  source: 'uspto' | 'wipo' | 'icann' | 'nft_platform' | 'github' | 'other';
  claim_type: IPType;
  claimed_name: string;
  claimed_by: string;
  timestamp: string;
}

export async function handleRegistryWebhook(
  webhook: RegistryWebhook,
  brtm_database: BRTMRecord[]
): Promise<{
  action: 'allow' | 'block' | 'review';
  reason: string;
  conflicts: BRTMRecord[];
  brtm_evidence?: string;
}> {
  const { conflicts, risk_level } = checkConflict(
    { type: webhook.claim_type, name: webhook.claimed_name },
    brtm_database
  );

  if (conflicts.length === 0) {
    return {
      action: 'allow',
      reason: 'No BRTM conflicts found',
      conflicts: []
    };
  }

  const highest_record = conflicts.reduce((best, r) =>
    r.verification.level > best.verification.level ? r : best
  );

  if (risk_level === 'blocking') {
    return {
      action: 'block',
      reason: `BRTM-${highest_record.verification.level.slice(-1)} verified prior art exists`,
      conflicts,
      brtm_evidence: highest_record.verification.archive_url || highest_record.verification.roadchain_tx
    };
  }

  if (risk_level === 'high') {
    return {
      action: 'review',
      reason: 'Potential conflict with BRTM verified prior art',
      conflicts,
      brtm_evidence: highest_record.verification.archive_url
    };
  }

  return {
    action: 'review',
    reason: 'Minor conflict detected, manual review recommended',
    conflicts
  };
}

// =============================================================================
// BLACKROAD IP INVENTORY
// =============================================================================

/**
 * Pre-register BlackRoad's core IP
 */
export function createBlackRoadIPInventory(): BRTMRecord[] {
  const owner = {
    name: 'Alexa Amundson',
    email: 'amundsonalexa@gmail.com',
    legal_entity: 'BlackRoad OS, Inc.'
  };

  const records: BRTMRecord[] = [];

  // Trademarks
  const trademarks = [
    { name: 'BlackRoad', description: 'Operating system and AI platform' },
    { name: 'BlackRoad OS', description: 'Cloud-native agent orchestration platform' },
    { name: 'Lucidia', description: 'AI consciousness and reasoning engine' },
    { name: 'PS-SHA-∞', description: 'Persistent Spiral Secure Hashing to Infinity protocol' },
    { name: 'RoadChain', description: 'Decentralized verification ledger' },
    { name: 'BRTM', description: 'BlackRoad Trademark/Truth Mark verification protocol' },
    { name: 'The Road', description: 'Metaphor for the unified truth system' },
    { name: 'SIG Coordinates', description: 'Spatial-Identity-Graph positioning system' },
  ];

  for (const tm of trademarks) {
    records.push(createBRTMRecord('trademark', tm.name, tm.description, tm.description, owner));
  }

  // Domains (already owned)
  const domains = [
    'blackroad.io', 'blackroad.systems', 'blackroad.me', 'blackroad.network',
    'blackroadai.com', 'blackroadqi.com', 'blackroadquantum.com',
    'lucidia.earth', 'lucidia.studio', 'lucidiaqi.com', 'aliceqi.com'
  ];

  for (const domain of domains) {
    records.push(createBRTMRecord('domain', domain, `Domain name: ${domain}`, domain, owner));
  }

  // Algorithms/Protocols
  const algorithms = [
    { name: 'PS-SHA-∞ Hashing', description: 'Infinite cascade hash chain for identity verification' },
    { name: '256-Step Verification Chain', description: 'Hash ladder authentication system' },
    { name: 'Amundson Coherence Equations', description: 'dφ/dt = ω₀ + λC(x,y) - ηE_φ' },
    { name: 'Trinary Logic System', description: 'TRIT_VALUES = [-1, 0, 1] quantum-classical bridge' },
    { name: 'Numeric Undefined System', description: '1000+ error codes defining all undefined states' },
  ];

  for (const algo of algorithms) {
    records.push(createBRTMRecord('algorithm', algo.name, algo.description, algo.description, owner));
  }

  // Concepts
  const concepts = [
    { name: 'Amundson Language', description: 'Unified math/code/physics/language framework' },
    { name: 'Truth Hierarchy', description: 'GitHub → PS-SHA-∞ → Authorization → Review' },
    { name: 'Undefined is a Lie', description: 'Every undefined state has a numeric error code' },
    { name: 'Bugs are Signals', description: 'Errors reveal mismatches between model and reality' },
  ];

  for (const concept of concepts) {
    records.push(createBRTMRecord('concept', concept.name, concept.description, concept.description, owner));
  }

  return records;
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== BRTM - BlackRoad Trademark/Truth Mark Protocol ===\n');

  console.log('Verification Levels:');
  console.log('  BRTM-1: Self-attested (anchor created)');
  console.log('  BRTM-2: Timestamped on RoadChain');
  console.log('  BRTM-3: Archived on Internet Archive');
  console.log('  BRTM-4: Third-party attestations (3+)');
  console.log('  BRTM-5: Legal registration (USPTO, WIPO, etc.)');

  console.log('\nBlackRoad IP Inventory:');
  const inventory = createBlackRoadIPInventory();
  const byType = inventory.reduce((acc, r) => {
    acc[r.subject.type] = (acc[r.subject.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count} records`);
  }

  console.log(`\nTotal: ${inventory.length} BRTM records ready for verification`);
}

export default {
  createBRTMRecord,
  generateAnchor,
  verifyAnchor,
  upgradeToRoadChain,
  upgradeToArchive,
  addAttestation,
  recordLegalRegistration,
  checkConflict,
  handleRegistryWebhook,
  createBlackRoadIPInventory,
};
