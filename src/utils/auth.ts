import { createHmac, timingSafeEqual } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { OperatorConfig } from '../config.js';
import logger from './logger.js';

function isMutation(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function verifySignature(body: unknown, timestamp: string, signature: string, secret: string): boolean {
  const payload = `${timestamp}.${JSON.stringify(body ?? '')}`;
  const digest = createHmac('sha256', secret).update(payload).digest('hex');
  const provided = Buffer.from(signature, 'hex');
  const expected = Buffer.from(digest, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function enforceAuth(request: FastifyRequest, reply: FastifyReply, config: OperatorConfig): Promise<void> {
  const { apiKey, signingSecret } = config;

  if (!apiKey && !signingSecret) {
    return; // Auth disabled
  }

  if (!isMutation(request.method)) {
    return; // Allow safe methods without auth
  }

  if (apiKey) {
    const token = request.headers['x-operator-api-key'] || request.headers['authorization'];
    if (token !== apiKey && token !== `Bearer ${apiKey}`) {
      await reply.status(401).send({ error: 'Unauthorized', message: 'missing or invalid api key' });
      return;
    }
  }

  if (signingSecret) {
    const signature = request.headers['x-signature'];
    const timestamp = request.headers['x-timestamp'];

    if (!signature || !timestamp || Array.isArray(signature) || Array.isArray(timestamp)) {
      await reply.status(401).send({ error: 'Unauthorized', message: 'missing signature or timestamp' });
      return;
    }

    const isValid = verifySignature(request.body, timestamp, signature, signingSecret);
    if (!isValid) {
      logger.warn({ path: request.url }, 'invalid request signature');
      await reply.status(401).send({ error: 'Unauthorized', message: 'invalid signature' });
    }
  }
}
