import { DAY, HOUR, MINUTE } from '../utils/time';

export const SchedulerDefaults = {
  finance: {
    dailyDataSyncMs: DAY,
    weeklyLiquidityMs: 7 * DAY,
    monthlyCloseMs: 30 * DAY,
  },
  ops: {
    healthcheckMs: 5 * MINUTE,
  },
};

export const RetryDefaults = {
  short: 3,
  medium: 5,
  long: 7,
};

export const RegistryPaths = {
  agents: 'src/registry/agentsRegistry.yaml',
  orchestrators: 'src/registry/orchestratorsRegistry.yaml',
};
