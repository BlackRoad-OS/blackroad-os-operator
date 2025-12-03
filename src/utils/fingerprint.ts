import crypto from 'node:crypto';

type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

interface StableStringifyOptions {
  salt?: string;
}

export interface FingerprintResult {
  normalized: string;
  sha256: string;
  sha2048: string;
  algorithm: {
    base: 'sha256';
    expansion: 'sha512-cascade';
    rounds: number;
  };
}

function stableStringify(value: JsonLike): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item as JsonLike)).join(',')}]`;
  }

  const keys = Object.keys(value).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key] as JsonLike)}`);
  return `{${entries.join(',')}}`;
}

function deriveSha2048(seed: Buffer, salt?: string): string {
  const fragments: Buffer[] = [];
  for (let i = 0; i < 4; i += 1) {
    const hash = crypto.createHash('sha512');
    hash.update(Buffer.from([i]));
    if (salt) {
      hash.update(salt);
    }
    hash.update(seed);
    fragments.push(hash.digest());
  }

  return Buffer.concat(fragments).toString('hex');
}

export function fingerprintPayload(data: JsonLike, options?: StableStringifyOptions): FingerprintResult {
  const normalized = stableStringify(data);
  const saltedInput = options?.salt ? `${options.salt}:${normalized}` : normalized;
  const seed = crypto.createHash('sha256').update(saltedInput).digest();

  return {
    normalized,
    sha256: seed.toString('hex'),
    sha2048: deriveSha2048(seed, options?.salt),
    algorithm: {
      base: 'sha256',
      expansion: 'sha512-cascade',
      rounds: 4,
    },
  };
}
