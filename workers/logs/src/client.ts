/**
 * BlackRoad OS Logging Client
 *
 * Simple client function for other workers to send logs to the centralized logging service.
 * Can be imported and used in any Cloudflare Worker.
 */

export interface LogClientConfig {
  logsEndpoint: string;
  serviceName: string;
  defaultMetadata?: Record<string, any>;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogOptions {
  level?: LogLevel;
  metadata?: Record<string, any>;
  request_id?: string;
  user_id?: string;
}

export class LogClient {
  private config: LogClientConfig;

  constructor(config: LogClientConfig) {
    this.config = config;
  }

  /**
   * Send a log entry to the centralized logging service
   */
  async log(
    message: string,
    options: LogOptions = {}
  ): Promise<boolean> {
    try {
      const logEntry = {
        service: this.config.serviceName,
        level: options.level || 'info',
        message,
        metadata: {
          ...this.config.defaultMetadata,
          ...options.metadata,
        },
        request_id: options.request_id,
        user_id: options.user_id,
      };

      const response = await fetch(`${this.config.logsEndpoint}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });

      return response.ok;
    } catch (error) {
      // Fail silently - logging should not break the application
      console.error('Failed to send log:', error);
      return false;
    }
  }

  /**
   * Log an info message
   */
  async info(message: string, options?: Omit<LogOptions, 'level'>): Promise<boolean> {
    return this.log(message, { ...options, level: 'info' });
  }

  /**
   * Log a warning message
   */
  async warn(message: string, options?: Omit<LogOptions, 'level'>): Promise<boolean> {
    return this.log(message, { ...options, level: 'warn' });
  }

  /**
   * Log an error message
   */
  async error(message: string, options?: Omit<LogOptions, 'level'>): Promise<boolean> {
    return this.log(message, { ...options, level: 'error' });
  }

  /**
   * Log a debug message
   */
  async debug(message: string, options?: Omit<LogOptions, 'level'>): Promise<boolean> {
    return this.log(message, { ...options, level: 'debug' });
  }
}

/**
 * Example usage in another worker:
 *
 * import { LogClient } from './path/to/client';
 *
 * const logger = new LogClient({
 *   logsEndpoint: 'https://blackroad-logs.YOUR-SUBDOMAIN.workers.dev',
 *   serviceName: 'api-gateway',
 *   defaultMetadata: {
 *     environment: 'production',
 *     version: '1.0.0',
 *   },
 * });
 *
 * // In your request handler:
 * await logger.info('Request received', {
 *   request_id: crypto.randomUUID(),
 *   metadata: { path: request.url },
 * });
 *
 * await logger.error('Database connection failed', {
 *   request_id: requestId,
 *   metadata: { error: error.message },
 * });
 */

/**
 * Lightweight version for environments where imports are difficult
 * Copy this function directly into your worker
 */
export async function quickLog(
  logsEndpoint: string,
  service: string,
  level: LogLevel,
  message: string,
  options?: {
    metadata?: Record<string, any>;
    request_id?: string;
    user_id?: string;
  }
): Promise<void> {
  try {
    await fetch(`${logsEndpoint}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service,
        level,
        message,
        ...options,
      }),
    });
  } catch (error) {
    console.error('Logging failed:', error);
  }
}
