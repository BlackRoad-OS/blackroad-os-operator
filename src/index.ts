import 'dotenv/config';

import Fastify from 'fastify';

import { getConfig } from './config.js';
import { registerSampleJobProcessor } from './jobs/sample.job.js';
import { startHeartbeatScheduler } from './schedulers/heartbeat.scheduler.js';
import { generateChatResponse, checkLlmHealth, ChatRequest } from './services/llm.service.js';
import { fingerprintPayload } from './utils/fingerprint.js';
import logger from './utils/logger.js';

const config = getConfig();
const app = Fastify({ logger });

// Health endpoint - liveness check
app.get('/health', async () => ({
  ok: true,
  service: 'blackroad-os-operator',
  timestamp: new Date().toISOString()
}));

// Ready endpoint - readiness check
app.get('/ready', async () => {
  // Perform lightweight checks
  // Note: For production, consider adding actual Redis connectivity check
  const checks = {
    config: true,
    queue: true // Currently always true; TODO: add actual queue connectivity check if needed
  };

  return {
    ready: Object.values(checks).every((check) => check === true),
    service: 'blackroad-os-operator',
    checks
  };
});

// Version endpoint - build metadata
app.get('/version', async () => ({
  service: 'blackroad-os-operator',
  version: config.version,
  commit: config.commit,
  env: config.brOsEnv
}));

// ============================================
// HERO FLOW #1: Chat with Cece
// ============================================

interface ChatRequestBody {
  message: string;
  userId?: string;
  model?: string;
}

interface FingerprintRequestBody {
  data: unknown;
  salt?: string;
}

// Chat endpoint - talk to Cece through the Operator Engine
app.post<{ Body: ChatRequestBody }>('/chat', async (request, reply) => {
  const { message, userId, model } = request.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'message field is required and must be a non-empty string'
    });
  }

  try {
    const chatRequest: ChatRequest = {
      message: message.trim(),
      userId,
      model,
    };

    const response = await generateChatResponse(chatRequest);

    return {
      reply: response.reply,
      trace: response.trace,
    };
  } catch (error) {
    logger.error({ error, message }, 'Chat request failed');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to generate response'
    });
  }
});

// Immutable fingerprint endpoint - produce layered hashes for any payload
app.post<{ Body: FingerprintRequestBody }>('/fingerprint', async (request, reply) => {
  const { data, salt } = request.body ?? {};

  if (typeof data === 'undefined') {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'data field is required to compute a fingerprint'
    });
  }

  try {
    const fingerprint = fingerprintPayload(data as never, { salt });

    return {
      fingerprint,
      immutable: true,
      message: 'Fingerprint generated using SHA-256 seed with SHA-512 cascade expansion.'
    };
  } catch (error) {
    logger.error({ error, dataType: typeof data }, 'Fingerprint request failed');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to generate fingerprint'
    });
  }
});

// LLM Health check endpoint
app.get('/llm/health', async () => {
  const health = await checkLlmHealth();
  return {
    service: 'llm-gateway',
    provider: config.llmProvider,
    configured_model: config.ollamaModel,
    ollama_url: config.ollamaUrl,
    ...health
  };
});

registerSampleJobProcessor();
startHeartbeatScheduler();

async function startServer(): Promise<void> {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(
      {
        port: config.port,
        env: config.brOsEnv,
        version: config.version,
        commit: config.commit
      },
      'operator engine started'
    );
  } catch (error) {
    logger.error({ error }, 'failed to start operator engine');
    process.exit(1);
  }
}

startServer();

// TODO(op-next): add auth middleware and request signing
// TODO(op-next): expose agent registration endpoints
