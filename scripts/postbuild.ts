import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.warn('Unable to read git commit', error);
    return 'unknown';
  }
}

const payload = {
  ts: Date.now(),
  commit: getCommitHash(),
  agent: 'Prism-Gen-0'
};

const outputDir = join(process.cwd(), 'public');
mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'sig.beacon.json'), JSON.stringify(payload, null, 2));
console.log('sig.beacon.json emitted');
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const beacon = {
  ts: Date.now(),
  agent: 'Operator-Gen-0'
};

async function writeBeacon(): Promise<void> {
  const outputDir = 'dist';
  await mkdir(outputDir, { recursive: true });
  const destination = join(outputDir, 'sig.beacon.json');
  await writeFile(destination, JSON.stringify(beacon, null, 2), 'utf-8');
}

writeBeacon().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to write sig.beacon.json', error);
  process.exit(1);
});
