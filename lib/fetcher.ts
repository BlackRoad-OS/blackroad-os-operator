import { BEACON_URL, CORE_HUB } from '@/lib/constants';
import type { Env, HealthResponse, VersionResponse } from '@/types';

const mockEnvs: Env[] = [
  {
    id: 'br-north',
    name: 'Northstar',
    region: 'us-east-1',
    status: 'healthy',
    agentCount: 5,
    lastDeploy: {
      id: 'deploy-1201',
      version: '2024.09.01',
      committedAt: new Date().toISOString(),
      status: 'success'
    }
  },
  {
    id: 'br-eu',
    name: 'Echo Ridge',
    region: 'eu-west-1',
    status: 'degraded',
    agentCount: 3,
    lastDeploy: {
      id: 'deploy-1188',
      version: '2024.08.24',
      committedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: 'in-progress'
    }
  }
];

export async function getEnvironments(): Promise<Env[]> {
  void BEACON_URL;
  return Promise.resolve(mockEnvs);
}

export async function getEnvById(id: string): Promise<Env | undefined> {
  // TODO(prism-next): replace with real fetch to BEACON once gateway is wired.
  void CORE_HUB;
  return Promise.resolve(mockEnvs.find((env) => env.id === id));
}

export async function getHealth(): Promise<HealthResponse> {
  return Promise.resolve({ status: 'ok', uptime: process.uptime() });
}

export async function getVersion(): Promise<VersionResponse> {
  return Promise.resolve({ version: '0.0.1', commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev' });
}
