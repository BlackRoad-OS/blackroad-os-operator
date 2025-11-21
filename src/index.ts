import express from 'express';
import { loadEnv } from './env';

export function createApp() {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

function bootstrap() {
  loadEnv();
  const port = Number(process.env.PORT) || 8080;
  const app = createApp();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`BlackRoad OS Agents Orchestration Service listening on :${port}`);
  });
}

if (require.main === module) {
  bootstrap();
}
