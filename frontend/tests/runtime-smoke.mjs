/** Real local HTTP smoke: Next runtime, all prepared HTML, SEO bytes and API isolation. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, sep } from 'node:path';

const frontend = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(frontend, 'public_html');
const fakeBackend = createServer((req, res) => {
  res.writeHead(req.url === '/api/user' ? 401 : 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: req.url !== '/api/user', path: req.url }));
});
fakeBackend.listen(0, '127.0.0.1');
await once(fakeBackend, 'listening');
const port = Number(process.env.UHH_SMOKE_PORT || 3310);
const child = spawn(process.execPath, ['server.mjs'], { cwd: frontend,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PORT: String(port), HOST: '127.0.0.1', UHH_API_ORIGIN: `http://127.0.0.1:${fakeBackend.address().port}` },
  stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
child.stdout.on('data', chunk => { logs += chunk; });
child.stderr.on('data', chunk => { logs += chunk; });
const base = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error('Runtime exited: ' + logs);
    try { if ((await fetch(base + '/api/migration-health')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs);
  const health = await (await fetch(base + '/api/migration-health')).json();
  assert.equal(health.runtime, 'nextjs');
  async function* files(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) yield* files(path); else yield path;
    }
  }
  let count = 0;
  for await (const path of files(root)) {
    if (!path.endsWith('.html')) continue;
    const url = '/' + relative(root, path).split(sep).map(encodeURIComponent).join('/');
    const response = await fetch(base + url);
    assert.equal(response.status, 200, url);
    const expected = (await readFile(path, 'utf8')).replaceAll('https://api.urbanhelphub.com', '/__backend');
    assert.equal(await response.text(), expected, 'Served document differs: ' + url);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    count++;
  }
  for (const path of ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/UrbanHelpHub-logo.png']) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  assert.equal((await fetch(base + '/.htaccess')).status, 404);
  assert.equal((await fetch(base + '/__backend/api/user')).status, 401);
  assert.equal((await fetch(base + '/__backend/up')).status, 200);
  const redirect = await fetch(base + '/dashboard?task=7', { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/dashboard/?task=7');
  console.log(`PASS: Next health, ${count} exact prepared HTML responses, SEO/assets, local API status/auth passthrough, and private-file protection`);
} finally {
  child.kill('SIGTERM');
  if (child.exitCode === null) await Promise.race([once(child, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
  fakeBackend.closeAllConnections(); fakeBackend.close();
}
