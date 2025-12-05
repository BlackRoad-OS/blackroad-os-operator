import { describe, it, expect } from 'vitest';

import { executeSandbox } from '../src/services/sandbox.service.js';

describe('sandbox execution', () => {
  it('executes javascript code and returns output', async () => {
    const result = await executeSandbox({
      language: 'javascript',
      code: 'const x = 2 + 3; console.log("sum", x); x;',
    });

    expect(result.output).toBe(5);
    expect(result.logs).toContain('sum 5');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('throws for unsupported languages', async () => {
    await expect(() =>
      executeSandbox({ language: 'python' as never, code: 'print("hi")' })
    ).rejects.toThrow('Unsupported language');
  });

  it('enforces timeout for long-running scripts', async () => {
    await expect(() =>
      executeSandbox({ language: 'javascript', code: 'while(true) {}', timeoutMs: 50 })
    ).rejects.toThrow();
  });
});
