/**
 * BlackRoad OS - 256-Step Verification Chain
 *
 * A hash chain authentication system that provides:
 * - 256 iterative hash steps for brute-force resistance
 * - One-way verification (can't reverse from token to password)
 * - Simple password-based auth without storing passwords
 *
 * Usage:
 *   const chain = generateChain("password", "unique-salt");
 *   const token = chain[255]; // Store this publicly
 *   const isValid = verify("password", "unique-salt", token);
 */

import { createHash } from 'crypto';

const STEPS = 256;
const ALGORITHM = 'sha256';

/**
 * Generate a 256-step hash chain from a password and salt
 */
export function generateChain(password: string, salt: string): string[] {
  const chain: string[] = [];
  let current = `${password}:${salt}`;

  for (let i = 0; i < STEPS; i++) {
    current = createHash(ALGORITHM).update(current).digest('hex');
    chain.push(current);
  }

  return chain;
}

/**
 * Get the final verification token (step 255)
 */
export function getToken(password: string, salt: string): string {
  const chain = generateChain(password, salt);
  return chain[STEPS - 1];
}

/**
 * Verify a password against a stored token
 */
export function verify(password: string, salt: string, storedToken: string): boolean {
  const computedToken = getToken(password, salt);
  return timingSafeEqual(computedToken, storedToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a cryptographically secure salt
 */
export function generateSalt(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  const randomBytes = require('crypto').randomBytes(length);
  for (let i = 0; i < length; i++) {
    salt += chars[randomBytes[i] % chars.length];
  }
  return salt;
}

/**
 * Verification record structure
 */
export interface VerificationRecord {
  id: string;
  salt: string;
  token: string;  // step[255]
  created_at: string;
  last_verified?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a new verification record
 */
export function createVerificationRecord(
  id: string,
  password: string,
  metadata?: Record<string, unknown>
): VerificationRecord {
  const salt = generateSalt();
  const token = getToken(password, salt);

  return {
    id,
    salt,
    token,
    created_at: new Date().toISOString(),
    metadata
  };
}

/**
 * Verify against a stored record
 */
export function verifyRecord(
  password: string,
  record: VerificationRecord
): boolean {
  return verify(password, record.salt, record.token);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'generate') {
    const password = args[1] || 'password';
    const salt = args[2] || generateSalt();
    const token = getToken(password, salt);

    console.log('=== 256-Step Verification Chain ===');
    console.log(`Salt: ${salt}`);
    console.log(`Token (step 255): ${token}`);
    console.log('\nTo verify:');
    console.log(`  npx ts-node chain.ts verify "${password}" "${salt}" "${token}"`);
  }
  else if (args[0] === 'verify') {
    const [, password, salt, token] = args;
    const isValid = verify(password, salt, token);
    console.log(`Verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    process.exit(isValid ? 0 : 1);
  }
  else {
    console.log('Usage:');
    console.log('  npx ts-node chain.ts generate [password] [salt]');
    console.log('  npx ts-node chain.ts verify <password> <salt> <token>');
  }
}

export default {
  generateChain,
  getToken,
  verify,
  generateSalt,
  createVerificationRecord,
  verifyRecord,
  STEPS,
  ALGORITHM
};
