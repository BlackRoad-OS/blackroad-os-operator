import app from './index';
import { getOperatorConfig, loadEnv } from './config/env';
import { startWorker } from './worker';

loadEnv();

const runtimeConfig = getOperatorConfig();
const port = Number(process.env.PORT ?? runtimeConfig.port ?? 8080);
const host = '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`[blackroad-os-operator] listening on http://${host}:${port}`);

  startWorker();
});

export default server;
