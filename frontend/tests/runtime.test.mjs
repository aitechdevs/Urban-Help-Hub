import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { preparedResponse } from '../runtime/static-bridge.mjs';
import { localApiOrigin, proxyLocalApi } from '../runtime/local-api.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'uhh-runtime-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dashboard'));
  await writeFile(join(root, 'dashboard/index.html'), '<title>Dashboard</title><link rel="canonical" href="https://urbanhelphub.com/dashboard/"><script>const api="https://api.urbanhelphub.com/api"</script>');
  await writeFile(join(root, '.htaccess'), 'private config');
  await writeFile(join(root, 'php.ini'), 'private configuration');
  return root;
}

test('prepared route preserves SEO while routing API access locally without mutating source', async t => {
  const root = await fixture(t);
  const result = await preparedResponse('/dashboard/', root);
  assert.equal(result.status, 200);
  assert.match(result.body.toString(), /https:\/\/urbanhelphub.com\/dashboard\//);
  assert.match(result.body.toString(), /const api="\/__backend\/api"/);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  const { readFile } = await import('node:fs/promises');
  assert.match(await readFile(join(root, 'dashboard/index.html'), 'utf8'), /https:\/\/api.urbanhelphub.com/);
});

test('directory redirects preserve queries and stay on the current origin', async t => {
  const root = await fixture(t);
  for (const path of ['/dashboard?task=2', '//dashboard?task=2']) {
    const result = await preparedResponse(path, root);
    assert.equal(result.status, 308);
    assert.equal(result.headers.Location, '/dashboard/?task=2');
  }
});

test('dotfiles, traversal, private config and symlink escapes are not served', async t => {
  const root = await fixture(t);
  for (const path of ['/.htaccess', '/%2e%2e/etc/passwd', '/a/../dashboard/', '/php.ini', '/%00', '/%ZZ']) {
    const result = await preparedResponse(path, root);
    assert.ok(result.status >= 400, path);
  }
  await symlink('/etc/hosts', join(root, 'outside.txt'));
  assert.equal((await preparedResponse('/outside.txt', root)).status, 404);
});

test('unknown routes and write requests fall through to Next rather than a fake success page', async t => {
  const root = await fixture(t);
  assert.equal(await preparedResponse('/not-a-route', root), null);
  assert.equal(await preparedResponse('/dashboard/', root, 'POST'), null);
});

test('API origin rejects public hosts, credentials, non-HTTP schemes and hidden path overrides', () => {
  assert.equal(localApiOrigin(), 'http://127.0.0.1:8000');
  for (const value of ['https://api.urbanhelphub.com', 'https://evil.test', 'file:///tmp/backend',
    'http://user:password@localhost', 'http://127.0.0.1:8000/api', 'http://localhost?x=1']) {
    assert.throws(() => localApiOrigin(value), /loopback/);
  }
});

async function listen(server, t) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return 'http://127.0.0.1:' + server.address().port;
}

test('loopback proxy preserves auth, request body and status without caching account data', async t => {
  let received;
  const upstream = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    received = { path: req.url, auth: req.headers.authorization, method: req.method, body };
    res.writeHead(201, { 'Content-Type': 'application/json', 'Cache-Control': 'public' });
    res.end(JSON.stringify({ success: true }));
  });
  const origin = await listen(upstream, t);
  const bridge = createServer((req, res) => proxyLocalApi(req, res, localApiOrigin(origin)));
  const url = await listen(bridge, t);
  const response = await fetch(url + '/__backend/api/tasks/2/messages', {
    method: 'POST', headers: { Authorization: 'Bearer synthetic-test-only', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'local development' }),
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(received, { path: '/api/tasks/2/messages', auth: 'Bearer synthetic-test-only', method: 'POST', body: '{"message":"local development"}' });
});

test('proxy refuses external redirects and rewrites local redirects back through the bridge', async t => {
  const upstream = createServer((req, res) => {
    res.writeHead(302, { Location: req.url === '/external' ? 'https://api.urbanhelphub.com/api/user' : '/api/user' });
    res.end();
  });
  const origin = await listen(upstream, t);
  const bridge = createServer((req, res) => proxyLocalApi(req, res, origin));
  const url = await listen(bridge, t);
  const external = await fetch(url + '/__backend/external', { redirect: 'manual' });
  assert.equal(external.status, 502);
  assert.equal(external.headers.get('location'), null);
  const local = await fetch(url + '/__backend/local', { redirect: 'manual' });
  assert.equal(local.status, 302);
  assert.equal(local.headers.get('location'), '/__backend/api/user');
});
