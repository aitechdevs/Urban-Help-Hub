import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const frontend = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2];
if (!output) {
  console.error('Supply a NEW output directory: npm run build:static -- /tmp/urbanhelphub-build');
  process.exit(1);
}
const result = spawnSync(process.env.PYTHON_BIN || 'python3',
  [resolve(frontend, 'static-maintenance/build-static.py'), resolve(frontend, 'static-baseline'), resolve(output)],
  { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
