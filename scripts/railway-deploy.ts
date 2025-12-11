import { spawnSync } from 'node:child_process';
import process from 'node:process';

interface DeployOptions {
  service: string;
  project?: string;
  environment?: string;
  detach: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): DeployOptions {
  const options: DeployOptions = {
    service: '',
    detach: true,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--service':
        options.service = argv[i + 1];
        i += 1;
        break;
      case '--project':
        options.project = argv[i + 1];
        i += 1;
        break;
      case '--environment':
        options.environment = argv[i + 1];
        i += 1;
        break;
      case '--attach':
        options.detach = false;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      default:
        break;
    }
  }

  if (!options.service) {
    throw new Error('Missing required flag: --service <service-name>');
  }

  return options;
}

function runRailway(command: string[], label: string): void {
  const result = spawnSync('railway', command, { stdio: 'inherit' });

  if (result.error) {
    throw new Error(`Failed to run Railway CLI for ${label}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Railway CLI exited with status ${result.status} during ${label}`);
  }
}

function ensureRailwayCli(): void {
  const versionCheck = spawnSync('railway', ['--version'], { encoding: 'utf-8' });

  if (versionCheck.error) {
    throw new Error('Railway CLI not found in PATH. Install from https://railway.app/cli.');
  }

  if (versionCheck.status !== 0) {
    throw new Error(`Railway CLI returned non-zero status: ${versionCheck.status}`);
  }
}

function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));

    ensureRailwayCli();

    if (options.project) {
      // Ensure the CLI is linked to the correct project before deploying
      runRailway(['link', '--project', options.project], 'project link');
    }

    const deployArgs = ['up', '--service', options.service];

    if (options.environment) {
      deployArgs.push('--environment', options.environment);
    }

    if (options.detach) {
      deployArgs.push('--detach');
    }

    if (options.dryRun) {
      if (options.project) {
        console.log('[dry-run] railway link --project', options.project);
      }
      console.log('[dry-run] railway', deployArgs.join(' '));
      process.exit(0);
    }

    runRailway(deployArgs, 'deployment');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Railway deployment failed: ${message}`);
    process.exit(1);
  }
}

main();
