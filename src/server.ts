import app from './index';
import { loadEnv } from './env';
import { startWorker } from './worker';

loadEnv();

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`BlackRoad OS Operator listening on :${port}`);

  startWorker();
});

export default server;
