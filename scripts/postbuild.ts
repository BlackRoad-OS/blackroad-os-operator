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
