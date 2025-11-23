export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export function createLogger(level: 'debug' | 'info' | 'warn' | 'error' = 'info'): Logger {
  const levels: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  const current = levels[level] ?? levels.info;

  const shouldLog = (msgLevel: keyof typeof levels) => levels[msgLevel] >= current;

  return {
    info: (...args: unknown[]) => shouldLog('info') && console.info('[INFO]', ...args),
    warn: (...args: unknown[]) => shouldLog('warn') && console.warn('[WARN]', ...args),
    error: (...args: unknown[]) => shouldLog('error') && console.error('[ERROR]', ...args),
    debug: (...args: unknown[]) => shouldLog('debug') && console.debug('[DEBUG]', ...args),
  };
}
