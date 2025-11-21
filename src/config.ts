import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkgJson = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) : { version: '0.0.0' };

type RequiredEnv = 'CORE_API_URL' | 'AGENTS_API_URL';

type OptionalEnv =
  | 'NODE_ENV'
  | 'OPERATOR_PORT'
  | 'PORT'
  | 'QUEUE_POLL_INTERVAL_MS'
  | 'JOB_MAX_ATTEMPTS'
  | 'LOG_LEVEL'
  | 'APP_VERSION'
  | 'GIT_COMMIT'
  | 'BUILD_TIME'
  | 'DATABASE_URL'
  | 'REDIS_URL'
  | 'OS_ROOT'
  | 'SERVICE_BASE_URL';

function getEnv(name: RequiredEnv, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: OptionalEnv, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

function getNumberEnv(name: OptionalEnv, fallback: number): number {
  const raw = getOptionalEnv(name);
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${name}: ${raw}`);
  }
  return parsed;
}

export interface RuntimeConfig {
  env: string;
  operatorPort: number;
  coreApiUrl: string;
  agentsApiUrl: string;
  queuePollIntervalMs: number;
  jobMaxAttempts: number;
  logLevel: string;
  appVersion: string;
  gitCommit?: string;
  buildTime?: string;
  databaseUrl?: string;
  redisUrl?: string;
  osRoot?: string;
  serviceBaseUrl?: string;
}

export const config: RuntimeConfig = {
  env: getOptionalEnv('NODE_ENV', 'development') as string,
  operatorPort: getNumberEnv('OPERATOR_PORT', Number(getOptionalEnv('PORT', '8080'))),
  coreApiUrl: getEnv('CORE_API_URL', 'http://localhost:4000'),
  agentsApiUrl: getEnv('AGENTS_API_URL', 'http://localhost:4100'),
  queuePollIntervalMs: getNumberEnv('QUEUE_POLL_INTERVAL_MS', 1_000),
  jobMaxAttempts: getNumberEnv('JOB_MAX_ATTEMPTS', 3),
  logLevel: getOptionalEnv('LOG_LEVEL', 'info') as string,
  appVersion: getOptionalEnv('APP_VERSION', pkgJson.version) as string,
  gitCommit: getOptionalEnv('GIT_COMMIT') ?? process.env.RAILWAY_GIT_COMMIT_SHA,
  buildTime: getOptionalEnv('BUILD_TIME'),
  databaseUrl: getOptionalEnv('DATABASE_URL'),
  redisUrl: getOptionalEnv('REDIS_URL'),
  osRoot: getOptionalEnv('OS_ROOT', 'https://blackroad.systems'),
  serviceBaseUrl: getOptionalEnv('SERVICE_BASE_URL'),
};

export const isRedisEnabled = Boolean(config.redisUrl);
export const isDatabaseEnabled = Boolean(config.databaseUrl);
