export const AgentDomains = {
  finance: 'finance',
  infra: 'infra',
  compliance: 'compliance',
  ops: 'ops',
  research: 'research',
} as const;

export type AgentDomain = (typeof AgentDomains)[keyof typeof AgentDomains];

export const OrchestratorNames = {
  finance: 'financeOrchestrator',
  infra: 'infraOrchestrator',
  compliance: 'complianceOrchestrator',
  ops: 'opsOrchestrator',
  research: 'researchOrchestrator',
} as const;

export type OrchestratorName = (typeof OrchestratorNames)[keyof typeof OrchestratorNames];

export const TaskTypes = {
  monthlyClose: 'monthly_close',
  weeklyLiquidity: 'weekly_liquidity',
  dailySync: 'daily_sync',
  heartbeat: 'heartbeat',
} as const;

export type TaskType = (typeof TaskTypes)[keyof typeof TaskTypes];
