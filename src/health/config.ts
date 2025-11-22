import { loadEnv } from '../env';

export type ServiceDefinition = {
  key: 'core' | 'web' | 'docs' | 'prism-console' | 'operator';
  envVar: 'CORE_URL' | 'WEB_URL' | 'DOCS_URL' | 'PRISM_CONSOLE_URL' | 'OPERATOR_URL';
  defaultUrl?: string;
};

const serviceDefinitions: ServiceDefinition[] = [
  { key: 'core', envVar: 'CORE_URL', defaultUrl: 'http://localhost:3000' },
  { key: 'web', envVar: 'WEB_URL', defaultUrl: 'http://localhost:3001' },
  { key: 'docs', envVar: 'DOCS_URL', defaultUrl: 'http://localhost:3002' },
  { key: 'prism-console', envVar: 'PRISM_CONSOLE_URL', defaultUrl: 'http://localhost:3003' },
  { key: 'operator', envVar: 'OPERATOR_URL' },
];

export function getServiceUrls() {
  const env = loadEnv();
  const port = env.PORT ?? '8080';

  return serviceDefinitions.reduce<Record<string, string | undefined>>((acc, definition) => {
    const defaultUrl =
      definition.key === 'operator'
        ? env[definition.envVar] ?? `http://localhost:${port}`
        : definition.defaultUrl;

    acc[definition.key] = env[definition.envVar] ?? defaultUrl;
    return acc;
  }, {});
}

export function getServiceDefinitions() {
  return serviceDefinitions;
}
