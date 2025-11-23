import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SystemScheduler } from '../runtime/systemScheduler';
import { createLogger } from '../utils/logger';

let scheduler: SystemScheduler;

beforeEach(() => {
  vi.useFakeTimers();
  scheduler = new SystemScheduler(createLogger('error'));
});

afterEach(() => {
  scheduler.shutdown();
  vi.useRealTimers();
});

describe('SystemScheduler', () => {
  it('executes scheduled functions', async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    scheduler.schedule('test', 1000, spy);
    await vi.advanceTimersByTimeAsync(3000);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
