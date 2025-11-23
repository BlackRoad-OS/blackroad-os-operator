export type LogLevel = "debug" | "info" | "warn" | "error";

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function createLogger(level: LogLevel): Logger {
  const threshold = levelWeights[level] ?? levelWeights.info;

  const logAt = (msgLevel: LogLevel, args: unknown[]) => {
    if (levelWeights[msgLevel] < threshold) return;
    const prefix = `[${new Date().toISOString()}] [${msgLevel.toUpperCase()}]`;
    console[msgLevel === "debug" ? "log" : msgLevel](prefix, ...args);
  };

  return {
    debug: (...args: unknown[]) => logAt("debug", args),
    info: (...args: unknown[]) => logAt("info", args),
    warn: (...args: unknown[]) => logAt("warn", args),
    error: (...args: unknown[]) => logAt("error", args),
  };
}
