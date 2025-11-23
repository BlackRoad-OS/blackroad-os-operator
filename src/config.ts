export interface OperatorConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  maxConcurrentJobs: number;
  eventBufferSize: number;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfig(): OperatorConfig {
  const nodeEnv = (process.env.NODE_ENV as OperatorConfig["nodeEnv"]) ?? "development";

  return {
    nodeEnv,
    port: parseNumber(process.env.PORT, 4100),
    logLevel: (process.env.LOG_LEVEL as OperatorConfig["logLevel"]) ?? "info",
    maxConcurrentJobs: parseNumber(process.env.MAX_CONCURRENT_JOBS, 4),
    eventBufferSize: parseNumber(process.env.EVENT_BUFFER_SIZE, 200),
  };
}
