import http from "http";
import { getConfig } from "./config";
import { createApp } from "./app";
import { createDefaultAgentRegistry } from "./runtime/agentRegistry";
import { InMemoryJobQueue } from "./runtime/jobQueue";
import { Worker } from "./runtime/worker";
import { EventBus } from "./events/eventBus";
import { InMemoryJournalStore, eventToJournalEntry } from "./integrations/journalStore";
import { createLogger } from "./utils/logger";
import { getBuildInfo } from "./utils/buildInfo";

const config = getConfig();
const logger = createLogger(config.logLevel);
const startedAt = new Date().toISOString();
const buildInfo = getBuildInfo(startedAt);
const registry = createDefaultAgentRegistry(logger);
const queue = new InMemoryJobQueue();
const eventBus = new EventBus(config.eventBufferSize, logger);
const journalStore = new InMemoryJournalStore();

// Persist events into journal store
const unsubscribeJournal = eventBus.subscribe((event) => {
  journalStore
    .append(eventToJournalEntry(event))
    .catch((err) => logger.error("Failed to append journal entry", err));
});

const worker = new Worker(registry, queue, eventBus, config, logger);
worker.start();

const app = createApp({ config, registry, queue, worker, eventBus, logger, buildInfo });
const server = http.createServer(app);

server.listen(config.port, () => {
  const baseUrl = `http://localhost:${config.port}/internal`;
  logger.info(`Operator starting in ${config.nodeEnv} mode on ${baseUrl}`);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down operator");
  worker.stop();
  unsubscribeJournal();
  server.close();
});
import 'dotenv/config';

import Fastify from 'fastify';

import { registerSampleJobProcessor } from './jobs/sample.job.js';
import { startHeartbeatScheduler } from './schedulers/heartbeat.scheduler.js';
import logger from './utils/logger.js';

const app = Fastify({ logger });
const port = Number(process.env.PORT ?? 4000);

app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

app.get('/version', async () => ({ version: '0.0.1', commit: process.env.COMMIT_SHA ?? 'unknown' }));

registerSampleJobProcessor();
startHeartbeatScheduler();

async function startServer(): Promise<void> {
  try {
    await app.listen({ port, host: '0.0.0.0' });
    logger.info({ port }, 'operator engine started');
  } catch (error) {
    logger.error({ error }, 'failed to start operator engine');
    process.exit(1);
  }
}

startServer();

// TODO(op-next): add auth middleware and request signing
// TODO(op-next): expose agent registration endpoints
