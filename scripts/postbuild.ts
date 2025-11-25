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
