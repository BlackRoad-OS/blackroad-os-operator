import express from 'express';
import packageJson from '../../package.json';
import { getServiceUrls } from '../health/config';
import { checkServiceHealth } from '../health/healthClient';

const router = express.Router();

const baseHealthResponse = () => ({
  status: 'ok',
  service: 'operator',
  timestamp: new Date().toISOString(),
});

router.get('/health', (_req, res) => {
  res.json(baseHealthResponse());
});

router.get('/api/health', (_req, res) => {
  res.json(baseHealthResponse());
});

router.get('/version', (_req, res) => {
  res.json({ version: packageJson.version, service: 'operator' });
});

router.get('/system/health', async (_req, res) => {
  console.log('Received /system/health request');
  const serviceUrls = getServiceUrls();
  const results: Record<string, Awaited<ReturnType<typeof checkServiceHealth>>> = {};

  for (const [serviceName, url] of Object.entries(serviceUrls)) {
    const result = await checkServiceHealth(serviceName, url);

    if (!result.reachable) {
      console.warn(`Service ${serviceName} unreachable`, result.error ?? result.payload);
    }

    results[serviceName] = result;
  }

  const totalServices = Object.keys(results).length;
  const failures = Object.values(results).filter((result) => !result.reachable || (result.httpStatus ?? 0) >= 300).length;

  const status = failures === 0 ? 'ok' : failures < totalServices ? 'degraded' : 'error';

  res.json({
    service: 'operator',
    status,
    timestamp: new Date().toISOString(),
    services: results,
  });
});

export default router;
