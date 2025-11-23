import { config } from 'dotenv';

export interface OperatorConfig {
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  financeEnabled: boolean;
  operatorEnv: 'dev' | 'staging' | 'prod';
  dbUrl?: string;
}

let loaded = false;

export function loadEnv(): void {
  if (!loaded) {
    config();
    loaded = true;
  }
}

export function getOperatorConfig(): OperatorConfig {
  loadEnv();
  const port = Number(process.env.PORT ?? 8080);
  const logLevel = (process.env.LOG_LEVEL as OperatorConfig['logLevel']) ?? 'info';
  const financeEnabled = (process.env.FINANCE_ENABLED ?? 'true').toLowerCase() !== 'false';
  const operatorEnv = (process.env.OPERATOR_ENV as OperatorConfig['operatorEnv']) ?? 'dev';
  const dbUrl = process.env.DB_URL;

  return {
    port,
    logLevel,
    financeEnabled,
    operatorEnv,
    dbUrl,
  };
}
