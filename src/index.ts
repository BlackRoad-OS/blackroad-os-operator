import express from 'express';
import { serviceConfig, SERVICE_ID, SERVICE_NAME } from './config/serviceConfig';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import infoRouter from './routes/info';
import versionRouter from './routes/version';
import debugEnvRouter from './routes/debugEnv';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(loggingMiddleware);

  app.use('/health', healthRouter);
  app.use('/info', infoRouter);
  app.use('/version', versionRouter);
  app.use('/debug/env', debugEnvRouter);

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Not found', service: SERVICE_ID });
  });

  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || process.env.OPERATOR_PORT || 8080);
  const app = createApp();
  app.listen(port, () => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        message: `${SERVICE_NAME} listening`,
        service_id: SERVICE_ID,
        port,
        config: serviceConfig,
      }),
    );
  });
}

export default createApp;
