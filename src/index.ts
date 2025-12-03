import 'dotenv/config';

import Fastify from 'fastify';

import { getConfig } from './config.js';
import { registerSampleJobProcessor } from './jobs/sample.job.js';
import { startHeartbeatScheduler } from './schedulers/heartbeat.scheduler.js';
import { generateChatResponse, checkLlmHealth, ChatRequest } from './services/llm.service.js';
import { deregisterAgent, getAgent, listAgents, recordHeartbeat, registerAgent, updateAgentStatus } from './services/agentRegistry.js';
import type { AgentRegistration, AgentStatus } from './types/index.js';
import { connection } from './queues/index.js';
import { enforceAuth } from './utils/auth.js';
import logger from './utils/logger.js';

const config = getConfig();
const app = Fastify({ logger });

app.addHook('onRequest', async (request, reply) => {
  await enforceAuth(request, reply, config);
});

// Health endpoint - liveness check
app.get('/health', async () => ({
  ok: true,
  service: 'blackroad-os-operator',
  timestamp: new Date().toISOString()
}));

// Ready endpoint - readiness check
app.get('/ready', async () => {
  // Perform lightweight checks
  let queueHealthy = false;
  try {
    await connection.ping();
    queueHealthy = true;
  } catch (error) {
    logger.error({ error }, 'redis connectivity check failed');
  }

  const checks = {
    config: true,
    queue: queueHealthy
  };

  return {
    ready: Object.values(checks).every((check) => check === true),
    service: 'blackroad-os-operator',
    checks
  };
});

// Agent collaboration endpoints
app.get('/agents', async () => ({
  agents: listAgents()
}));

app.post<{ Body: AgentRegistration }>('/agents/register', async (request, reply) => {
  const registration = request.body;

  if (!registration?.id || !registration.hostname) {
    return reply.status(400).send({ error: 'Bad Request', message: 'id and hostname are required' });
  }

  const agent = registerAgent(registration);
  return reply.status(201).send(agent);
});

app.post<{ Params: { id: string }; Body: Partial<AgentRegistration> }>('/agents/:id/heartbeat', async (request, reply) => {
  const { id } = request.params;
  const updated = recordHeartbeat(id, request.body);

  if (!updated) {
    return reply.status(404).send({ error: 'Not Found', message: 'agent not registered' });
  }

  return { agent: updated };
});

app.post<{ Params: { id: string }; Body: { status: AgentStatus } }>('/agents/:id/status', async (request, reply) => {
  const { id } = request.params;
  const { status } = request.body;
  const updated = updateAgentStatus(id, status);

  if (!updated) {
    return reply.status(404).send({ error: 'Not Found', message: 'agent not registered' });
  }

  return { agent: updated };
});

app.get<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
  const agent = getAgent(request.params.id);

  if (!agent) {
    return reply.status(404).send({ error: 'Not Found', message: 'agent not registered' });
  }

  return agent;
});

app.delete<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
  const removed = deregisterAgent(request.params.id);

  if (!removed) {
    return reply.status(404).send({ error: 'Not Found', message: 'agent not registered' });
  }

  return reply.status(204).send();
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
startHeartbeatScheduler(config.heartbeatCron);

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
