import { config } from 'dotenv';

let loaded = false;

export function loadEnv(): NodeJS.ProcessEnv {
  if (!loaded) {
    config();
    loaded = true;
  }

  return process.env;
}

export function getRuntimeConfig(): {
  apiUrl?: string;
  serviceBaseUrl?: string;
  osRoot?: string;
  host?: string;
  port?: string;
} {
  const env = loadEnv();

  return {
    apiUrl: env.API_URL ?? env.CORE_URL ?? env.CORE_API_URL,
    serviceBaseUrl: env.SERVICE_BASE_URL,
    osRoot: env.OS_ROOT,
    host: env.HOST,
    port: env.PORT,
  };
}
