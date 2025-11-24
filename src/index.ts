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
