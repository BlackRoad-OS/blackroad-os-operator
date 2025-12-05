import type { Console } from 'node:console';
import vm from 'node:vm';

import logger from '../utils/logger.js';

export type SandboxLanguage = 'javascript';

export interface SandboxExecutionRequest {
  language: SandboxLanguage;
  code: string;
  timeoutMs?: number;
}

export interface SandboxExecutionResult {
  output: unknown;
  logs: string[];
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 2000;

function buildContext(logs: string[]): vm.Context {
  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push(args.map((arg) => String(arg)).join(' ')),
    error: (...args: unknown[]) => logs.push(args.map((arg) => String(arg)).join(' ')),
  } satisfies Console;

  return vm.createContext({ console: sandboxConsole, Math, Date, JSON, Number, String, Boolean, Array });
}

function runJavascript(code: string, timeoutMs: number, logs: string[]): unknown {
  const script = new vm.Script(code, { displayErrors: true });
  const context = buildContext(logs);
  return script.runInContext(context, { timeout: timeoutMs });
}

export async function executeSandbox(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
  const start = Date.now();
  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const logs: string[] = [];

  try {
    let output: unknown;
    if (request.language === 'javascript') {
      output = runJavascript(request.code, timeoutMs, logs);
    } else {
      throw new Error(`Unsupported language: ${request.language}`);
    }

    return {
      output,
      logs,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    logger.error({ error }, 'Sandbox execution failed');
    throw error;
  }
}
