/**
 * BlackRoad OS TypeScript SDK - Client
 *
 * @blackroad_name SDK Client
 * @operator alexa.operator.v1
 */

import { AgentsResource } from './agents';
import { GovernanceResource } from './governance';
import { LedgerResource } from './ledger';
import { CollaborationResource } from './collaboration';
import type { ChatRequest, ChatResponse, BlackRoadError } from '../types';

export interface BlackRoadConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class BlackRoad {
  private readonly config: Required<Omit<BlackRoadConfig, 'apiKey' | 'headers'>> & {
    apiKey?: string;
    headers: Record<string, string>;
  };

  public readonly agents: AgentsResource;
  public readonly governance: GovernanceResource;
  public readonly ledger: LedgerResource;
  public readonly collaboration: CollaborationResource;

  constructor(config: BlackRoadConfig = {}) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl?.replace(/\/$/, '') || 'https://api.blackroad.io/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    // Initialize resources
    this.agents = new AgentsResource(this);
    this.governance = new GovernanceResource(this);
    this.ledger = new LedgerResource(this);
    this.collaboration = new CollaborationResource(this);
  }

  /**
   * Make an HTTP request to the API.
   */
  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
    } = {},
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl);

    // Add query params
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Build headers
    const headers: Record<string, string> = { ...this.config.headers };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Make request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          name: 'BlackRoadError',
          message: errorData.message || `Request failed with status ${response.status}`,
          code: errorData.error || 'request_failed',
          status: response.status,
          requestId: response.headers.get('x-request-id') || undefined,
        } as BlackRoadError;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          name: 'BlackRoadError',
          message: 'Request timed out',
          code: 'timeout',
          status: 0,
        } as BlackRoadError;
      }

      throw error;
    }
  }

  /**
   * Stream an HTTP response from the API.
   */
  async *stream<T>(
    method: string,
    path: string,
    options: { body?: unknown } = {},
  ): AsyncGenerator<T> {
    const url = new URL(path, this.config.baseUrl);

    const headers: Record<string, string> = { ...this.config.headers };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        name: 'BlackRoadError',
        message: errorData.message || `Request failed with status ${response.status}`,
        code: errorData.error || 'request_failed',
        status: response.status,
      } as BlackRoadError;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]') {
              yield JSON.parse(data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Chat with the default agent.
   */
  async chat(
    message: string,
    options: Omit<ChatRequest, 'message'> = {},
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('POST', '/chat', {
      body: { message, ...options },
    });
  }
}

export { AgentsResource } from './agents';
export { GovernanceResource } from './governance';
export { LedgerResource } from './ledger';
export { CollaborationResource } from './collaboration';
