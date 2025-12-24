import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import logger from '../src/utils/logger.js';

type ScaffoldKind = 'job' | 'workflow' | 'scheduler' | 'service';

interface ScaffoldTemplate {
  filename: string;
  contents: string;
}

const VALID_TYPES: ScaffoldKind[] = ['job', 'workflow', 'scheduler', 'service'];

function toKebabCase(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toPascalCase(input: string): string {
  return input
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join('');
}

function createJobTemplate(name: string): ScaffoldTemplate {
  const kebabName = toKebabCase(name);
  const pascalName = toPascalCase(name);
  const queueConst = kebabName || 'new-job';

  return {
    filename: join('src', 'jobs', `${queueConst}.job.ts`),
    contents: `import { Worker } from 'bullmq';\n\nimport { connection, getQueue } from '../queues/index.js';\nimport logger from '../utils/logger.js';\n\nconst QUEUE_NAME = '${queueConst}';\n\nexport function register${pascalName || 'New'}JobProcessor(): Worker {\n  const worker = new Worker(\n    QUEUE_NAME,\n    async (job) => {\n      logger.info({ jobId: job.id, payload: job.data }, '${pascalName || 'New'} job received');\n      // TODO: implement business logic for the ${queueConst} queue\n    },\n    { connection }\n  );\n\n  worker.on('failed', (job, error) => {\n    logger.error({ jobId: job?.id, error }, '${pascalName || 'New'} job failed');\n  });\n\n  return worker;\n}\n\nexport async function enqueue${pascalName || 'New'}Job(payload: Record<string, unknown>): Promise<string> {\n  const queue = getQueue(QUEUE_NAME);\n  const job = await queue.add(QUEUE_NAME, payload, { attempts: 3 });\n\n  return job.id!;\n}\n`
  };
}

function createWorkflowTemplate(name: string): ScaffoldTemplate {
  const kebabName = toKebabCase(name) || 'new-workflow';
  const pascalName = toPascalCase(name) || 'NewWorkflow';

  return {
    filename: join('src', 'workflows', `${kebabName}.workflow.ts`),
    contents: `import { WorkflowDefinition } from '../types/index.js';\n\nexport const ${pascalName}: WorkflowDefinition = {\n  id: '${kebabName}',\n  name: '${pascalName}',\n  description: 'Describe what this workflow coordinates.',\n  steps: [\n    {\n      id: 'step-1',\n      jobName: '${kebabName}-job',\n      input: { example: true },\n      nextOnSuccess: undefined,\n      nextOnFailure: undefined,\n    },\n  ],\n};\n`
  };
}

function createSchedulerTemplate(name: string): ScaffoldTemplate {
  const kebabName = toKebabCase(name) || 'new-scheduler';
  const pascalName = toPascalCase(name) || 'NewScheduler';

  return {
    filename: join('src', 'schedulers', `${kebabName}.scheduler.ts`),
    contents: `import { schedule } from 'node-cron';\n\nimport logger from '../utils/logger.js';\n\nexport function start${pascalName}(): void {\n  // Runs every minute by default; adjust to your cadence.\n  const task = schedule('* * * * *', async () => {\n    logger.info('${pascalName} tick');\n    // TODO: add your scheduler logic here (enqueue jobs, dispatch workflows, etc.)\n  });\n\n  logger.info('${pascalName} scheduler started');\n\n  return task;\n}\n`
  };
}

function createServiceTemplate(name: string): ScaffoldTemplate {
  const kebabName = toKebabCase(name) || 'new-service';
  const camelName = toPascalCase(name);
  const functionName = camelName
    ? camelName.charAt(0).toLowerCase() + camelName.slice(1)
    : 'newService';

  return {
    filename: join('src', 'services', `${kebabName}.service.ts`),
    contents: `import logger from '../utils/logger.js';\n\nexport async function ${functionName}(): Promise<void> {\n  logger.info('${functionName} invoked');\n  // TODO: implement service logic\n}\n`
  };
}

function getTemplate(kind: ScaffoldKind, name: string): ScaffoldTemplate {
  switch (kind) {
    case 'job':
      return createJobTemplate(name);
    case 'workflow':
      return createWorkflowTemplate(name);
    case 'scheduler':
      return createSchedulerTemplate(name);
    case 'service':
      return createServiceTemplate(name);
    default:
      throw new Error(`Unsupported scaffold type: ${kind}`);
  }
}

async function writeTemplateFile({ filename, contents }: ScaffoldTemplate): Promise<void> {
  const targetPath = resolve(filename);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, contents, { flag: 'wx' });
}

async function main(): Promise<void> {
  const [, , typeArg, ...nameParts] = process.argv;

  if (!typeArg || nameParts.length === 0) {
    logger.error(
      'Usage: pnpm scaffold <job|workflow|scheduler|service> "Name of thing"\n' +
        'Example: pnpm scaffold job "data sync"'
    );
    process.exit(1);
  }

  if (!VALID_TYPES.includes(typeArg as ScaffoldKind)) {
    logger.error(`Invalid scaffold type. Choose one of: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  const name = nameParts.join(' ');
  const template = getTemplate(typeArg as ScaffoldKind, name);

  try {
    await writeTemplateFile(template);
    logger.info({ file: template.filename }, 'scaffold created');
    logger.info('Remember to register your new component (queue worker, scheduler, etc.) in the app entrypoints.');
  } catch (error) {
    if ((error as { code?: string }).code === 'EEXIST') {
      logger.error({ file: template.filename }, 'file already exists. Choose a different name or remove the file first.');
    } else {
      logger.error({ error }, 'failed to write scaffold');
    }
    process.exit(1);
  }
}

main();
