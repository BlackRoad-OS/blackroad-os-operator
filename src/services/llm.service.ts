/**
 * LLM Service - Handles communication with Ollama/GPT-OSS Model
 */

import { getConfig } from '../config.js';
import logger from '../utils/logger.js';

export interface ChatRequest {
  message: string;
  userId?: string;
  model?: string;
  systemPrompt?: string;
}

export interface ChatResponse {
  reply: string;
  trace: {
    llm_provider: string;
    model: string;
    used_rag: boolean;
    response_time_ms: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are Cece, the AI assistant for BlackRoad OS - an intelligent operating system that orchestrates AI agents, workflows, and infrastructure.

You are helpful, concise, and technically capable. When users ask about the system, explain what you can see and do within the Operator Engine.

Current capabilities:
- Chat with users through the Operator Engine
- Access to RAG API for context retrieval (coming soon)
- Orchestrate background jobs and workflows

Respond in a friendly but professional manner.`;

/**
 * Call Ollama API to generate a response
 */
export async function generateChatResponse(request: ChatRequest): Promise<ChatResponse> {
  const config = getConfig();
  const startTime = Date.now();

  const model = request.model ?? config.ollamaModel;
  const systemPrompt = request.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  const fullPrompt = `${systemPrompt}\n\nUser: ${request.message}\n\nAssistant:`;

  logger.info({ model, messageLength: request.message.length }, 'Generating LLM response');

  try {
    const response = await fetch(`${config.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Ollama API error');
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    const responseTimeMs = Date.now() - startTime;

    logger.info(
      { model, responseTimeMs, responseLength: data.response?.length },
      'LLM response generated'
    );

    return {
      reply: data.response?.trim() ?? '',
      trace: {
        llm_provider: config.llmProvider,
        model: data.model ?? model,
        used_rag: false,
        response_time_ms: responseTimeMs,
      },
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    logger.error({ error, responseTimeMs }, 'Failed to generate LLM response');
    throw error;
  }
}

/**
 * Check if Ollama is healthy and has the required model
 */
export async function checkLlmHealth(): Promise<{
  healthy: boolean;
  models: string[];
  error?: string;
}> {
  const config = getConfig();

  try {
    const response = await fetch(`${config.ollamaUrl}/api/tags`);

    if (!response.ok) {
      return { healthy: false, models: [], error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = data.models?.map((m) => m.name) ?? [];

    return { healthy: true, models };
  } catch (error) {
    return {
      healthy: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
