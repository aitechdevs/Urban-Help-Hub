import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import next from 'next';
import { preparedResponse } from './runtime/static-bridge.mjs';
import { localApiOrigin, proxyLocalApi } from './runtime/local-api.mjs';

const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || '127.0.0.1';
const apiOrigin = localApiOrigin(process.env.UHH_API_ORIGIN);
const dir = fileURLToPath(new URL('./', import.meta.url));
const root = fileURLToPath(new URL('./public_html/', import.meta.url));
const app = next({ dev, hostname, port, dir });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer(async (request, response) => {
  try {
    if (request.url.startsWith('/__backend/')) return await proxyLocalApi(request, response, apiOrigin);
    const prepared = await preparedResponse(request.url, root, request.method);
    if (prepared) {
      response.writeHead(prepared.status, prepared.headers || {});
      response.end(request.method === 'HEAD' ? undefined : prepared.body);
      return;
    }
    // Next serves newly migrated routes and its own assets; old chunks remain available.
    await handle(request, response);
  } catch {
    if (!response.headersSent) response.writeHead(500, { 'Cache-Control': 'no-store' });
    response.end('Development runtime request failed');
  }
});
server.listen(port, hostname, () => console.log(`UrbanHelpHub Next.js development runtime listening on ${hostname}:${port}`));
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.closeAllConnections();
  server.close();
  await app.close();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
