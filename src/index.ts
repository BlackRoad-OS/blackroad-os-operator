import express from 'express';
import { config } from './config';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import infoRouter from './routes/info';
import versionRouter from './routes/version';
import { SERVICE_ID, SERVICE_NAME } from './config/serviceConfig';

function buildSafeEnv() {
  const redactedKeys = ['key', 'token', 'secret', 'password'];
  return Object.keys(process.env).reduce<Record<string, string | undefined>>((acc, key) => {
    const lower = key.toLowerCase();
    if (redactedKeys.some((marker) => lower.includes(marker))) {
      acc[key] = '[redacted]';
    } else {
      acc[key] = process.env[key];
    }
    return acc;
  }, {});
}

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(loggingMiddleware);

  app.use('/health', healthRouter);
  app.use('/info', infoRouter);
  app.use('/version', versionRouter);

  app.get('/debug/env', (_req, res) => {
    res.json({ service: SERVICE_ID, env: buildSafeEnv() });
  });

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Not found', service: SERVICE_ID });
  });

  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const port = config.operatorPort || 8080;
  const app = createApp();
  app.listen(port, () => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        message: `${SERVICE_NAME} listening`,
        service_id: SERVICE_ID,
        port,
        env: config.env,
      }),
    );
  });
}

export default createApp;
