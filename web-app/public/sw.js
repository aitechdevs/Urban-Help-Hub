/* Only these public, self-contained assets may enter Cache Storage.
 * Never cache documents, API calls, cookies, tokens, Next.js chunks, or Stripe.
 * Bump this version whenever the offline page or icons change.
 */
const CACHE = "urbanhelphub-public-v1";
const PUBLIC_ASSETS = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PUBLIC_ASSETS.map((path) => new Request(path, { cache: "reload", credentials: "omit" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("urbanhelphub-public-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Leave all other requests entirely to the browser's existing network behavior.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search ||
      request.headers.has("Authorization") || request.headers.has("RSC") ||
      request.headers.has("Next-Router-Prefetch")) return;
  if (PUBLIC_ASSETS.includes(url.pathname)) {
    event.respondWith((async () => (await caches.match(url.pathname, { cacheName: CACHE })) || fetch(request))());
    return;
  }
  // Only a failed homepage navigation gets the static, data-free fallback.
  // Login, logout, dashboards, payment return URLs and APIs have no fallback.
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match("/offline.html", { cacheName: CACHE })) || Response.error()));
  }
});
