import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const base = {
    level,
    timestamp: new Date().toISOString(),
    service: 'operator',
    env: config.env,
    message,
    ...meta,
  };
  return JSON.stringify(base);
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const configuredLevel = (config.logLevel as LogLevel) ?? 'info';
  if (levels[level] < levels[configuredLevel]) return;

  const formatted = formatMessage(level, message, meta);
  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
