import app from './index';
import { getRuntimeConfig, loadEnv } from './env';
import { startWorker } from './worker';

loadEnv();

const runtimeConfig = getRuntimeConfig();
const port = Number(runtimeConfig.port ?? process.env.PORT ?? 8080);
const host = runtimeConfig.host || '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`BlackRoad OS Operator listening on ${host}:${port}`);

  startWorker();
});

export default server;
