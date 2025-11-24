import { execSync } from "child_process";
import pkg from "../../package.json";

export interface BuildInfo {
  service: string;
  version: string;
  gitSha?: string;
  buildTime?: string;
  startedAt: string;
  environment: string;
  nodeVersion: string;
}

function resolveGitSha(): string | undefined {
  if (process.env.GIT_SHA) return process.env.GIT_SHA;

  try {
    const output = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return output || undefined;
  } catch {
    return undefined;
  }
}

export function getBuildInfo(startedAt: string): BuildInfo {
  return {
    service: pkg.name ?? "blackroad-os-operator",
    version: pkg.version ?? "0.0.0",
    gitSha: resolveGitSha(),
    buildTime: process.env.BUILD_TIME,
    startedAt,
    environment: process.env.NODE_ENV ?? "development",
    nodeVersion: process.version,
  };
}
