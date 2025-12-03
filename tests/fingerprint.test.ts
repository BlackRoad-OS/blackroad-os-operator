import { describe, expect, it } from 'vitest';

import { fingerprintPayload } from '../src/utils/fingerprint.js';

describe('fingerprintPayload', () => {
  it('generates deterministic fingerprints for equivalent objects', () => {
    const first = fingerprintPayload({ name: 'service', version: 1, features: ['api', 'hash'] });
    const second = fingerprintPayload({ version: 1, features: ['api', 'hash'], name: 'service' });

    expect(first.normalized).toBe(second.normalized);
    expect(first.sha256).toBe(second.sha256);
    expect(first.sha2048).toBe(second.sha2048);
  });

  it('includes salt to allow rotations', () => {
    const baseline = fingerprintPayload('cadillac');
    const rotated = fingerprintPayload('cadillac', { salt: 'rotation-1' });

    expect(baseline.sha256).not.toBe(rotated.sha256);
    expect(rotated.algorithm.rounds).toBe(4);
  });

  it('returns expected digest sizes', () => {
    const result = fingerprintPayload({ api: 'service', immutable: true });

    expect(result.sha256).toHaveLength(64);
    expect(result.sha2048).toHaveLength(512);
  });
});
