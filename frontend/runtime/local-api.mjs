const HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length']);

/** Development proxy deliberately refuses public backend hosts. No credentials are saved. */
export function localApiOrigin(value = 'http://127.0.0.1:8000') {
  const url = new URL(value);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('UHH_API_ORIGIN must be a loopback-only Laravel origin. Production API access is disabled.');
  }
  return url.origin;
}

export async function proxyLocalApi(request, response, origin) {
  // The origin was validated at startup. Never honor a user-supplied upstream URL.
  const suffix = request.url.slice('/__backend'.length);
  if (!suffix.startsWith('/') || suffix.startsWith('//') || suffix.includes('\\')) {
    response.writeHead(400); response.end('Invalid API path'); return;
  }
  const target = new URL(origin + suffix);
  if (target.origin !== origin) { response.writeHead(400); response.end('Invalid API origin'); return; }
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (!HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  try {
    const upstream = await fetch(target, {
      method: request.method, headers, redirect: 'manual', signal: AbortSignal.timeout(15000),
      ...(!['GET', 'HEAD'].includes(request.method) ? { body: request, duplex: 'half' } : {}),
    });
    const redirect = upstream.headers.get('location');
    if (redirect) {
      const destination = new URL(redirect, origin);
      if (destination.origin !== origin) throw new Error('External development redirect refused');
    }
    const resultHeaders = {};
    for (const [name, value] of upstream.headers) {
      if (!HOP_HEADERS.has(name) && name !== 'content-encoding' && name !== 'set-cookie') resultHeaders[name] = value;
    }
    // Fetch decodes upstream content. Never forward its old compressed byte length.
    resultHeaders['cache-control'] = 'no-store';
    if (redirect) {
      const destination = new URL(redirect, origin);
      resultHeaders.location = '/__backend' + destination.pathname + destination.search + destination.hash;
    }
    if (upstream.headers.getSetCookie) {
      const cookies = upstream.headers.getSetCookie();
      if (cookies.length) resultHeaders['set-cookie'] = cookies;
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    response.writeHead(upstream.status, resultHeaders);
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ success: false, message: 'Local Laravel API is unavailable. Start it on the configured loopback address.' }));
  }
}
