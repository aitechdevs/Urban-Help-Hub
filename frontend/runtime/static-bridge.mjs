import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};
const TEXT = new Set(['.html', '.txt', '.js', '.css', '.json', '.xml', '.webmanifest', '.svg']);

/** Serve the authoritative static frontend without recompiling the stale TSX tree.
 * Resolve every file under the approved root; never expose cPanel config or dotfiles.
 * Local API substitution happens in memory only. SEO and prepared files stay intact.
 */
export async function preparedResponse(rawUrl, root, method = 'GET') {
  if (!['GET', 'HEAD'].includes(method)) return null;
  const rawPath = rawUrl.split('?')[0];
  let decoded;
  try { decoded = decodeURIComponent(rawPath); } catch { return { status: 400, body: Buffer.from('Invalid URL') }; }
  const segments = decoded.split('/').filter(Boolean);
  if (decoded.includes('\\') || decoded.includes('\0') || segments.some(s => s.startsWith('.'))) {
    return { status: 404, body: Buffer.from('Not found') };
  }
  const relative = segments.join('/');
  const base = await realpath(root);
  let file = resolve(base, relative);
  if (file !== base && !file.startsWith(base + sep)) return { status: 404, body: Buffer.from('Not found') };
  try {
    if ((await stat(file)).isDirectory()) {
      if (!rawPath.endsWith('/')) {
        const query = rawUrl.includes('?') ? '?' + rawUrl.split('?').slice(1).join('?') : '';
        return { status: 308, headers: { Location: '/' + relative + '/' + query }, body: Buffer.alloc(0) };
      }
      file = resolve(file, 'index.html');
    }
    const actual = await realpath(file);
    if (!actual.startsWith(base + sep)) return { status: 404, body: Buffer.from('Not found') };
    const extension = extname(actual).toLowerCase();
    if (!TYPES[extension] || !(await stat(actual)).isFile()) return { status: 404, body: Buffer.from('Not found') };
    let body = await readFile(actual);
    if (TEXT.has(extension)) {
      // Preserve canonical URLs and brand links, but prevent development API writes to production.
      body = Buffer.from(body.toString('utf8').replaceAll('https://api.urbanhelphub.com', '/__backend'));
    }
    return { status: 200, headers: {
      'Content-Type': TYPES[extension], 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(extension === '.js' && actual.endsWith('/sw.js') ? { 'Service-Worker-Allowed': '/' } : {}),
    }, body };
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}
