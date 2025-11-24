import { beforeEach, describe, expect, it, vi } from 'vitest';

const queueAdd = vi.hoisted(() => vi.fn());

vi.mock('../src/queues/index.js', () => ({
  getQueue: vi.fn(() => ({ add: queueAdd }))
}));

const scheduleMock = vi.hoisted(() =>
  vi.fn((expression: string, callback: () => Promise<void> | void) => ({
    start: vi.fn(),
    stop: vi.fn(),
    fireOnTick: callback
  }))
);

vi.mock('node-cron', () => ({
  __esModule: true,
  default: {
    schedule: scheduleMock
  },
  schedule: scheduleMock
}));

import { startHeartbeatScheduler } from '../src/schedulers/heartbeat.scheduler.js';

describe('heartbeat scheduler', () => {
  beforeEach(() => {
    queueAdd.mockClear();
    scheduleMock.mockClear();
  });

  it('registers cron task and enqueues heartbeat payloads', async () => {
    const task = startHeartbeatScheduler();

    expect(scheduleMock).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));

    await task.fireOnTick?.();

    expect(queueAdd).toHaveBeenCalledWith(
      'heartbeat',
      expect.objectContaining({ ts: expect.any(Number) })
    );
  });
});
