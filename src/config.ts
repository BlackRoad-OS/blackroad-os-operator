import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkgJson = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) : { version: '0.0.0' };

type RequiredEnv = 'NODE_ENV' | 'DATABASE_URL' | 'CORE_API_URL' | 'PUBLIC_AGENTS_URL';

function getEnv(name: RequiredEnv, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

export interface RuntimeConfig {
  env: string;
  port: number;
  dbUrl: string;
  redisUrl?: string;
  coreApiUrl: string;
  publicAgentsUrl: string;
  logLevel: string;
  appVersion: string;
  gitCommit?: string;
  buildTime?: string;
}

export const config: RuntimeConfig = {
  env: getEnv('NODE_ENV', 'development'),
  port: Number(process.env.PORT ?? 3000),
  dbUrl: getEnv('DATABASE_URL'),
  redisUrl: getOptionalEnv('REDIS_URL'),
  coreApiUrl: getEnv('CORE_API_URL'),
  publicAgentsUrl: getEnv('PUBLIC_AGENTS_URL'),
  logLevel: getOptionalEnv('LOG_LEVEL') ?? 'info',
  appVersion: process.env.APP_VERSION ?? pkgJson.version ?? '0.0.0',
  gitCommit: process.env.GIT_COMMIT ?? process.env.RAILWAY_GIT_COMMIT_SHA,
  buildTime: process.env.BUILD_TIME,
};

export const isRedisEnabled = Boolean(config.redisUrl);
