import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function worker(network = async () => new Response("network")) {
  const handlers = {};
  const recorded = { requests: [], deleted: [], claimed: false, skipped: false };
  const fallback = new Response("offline");
  const cache = {
    addAll: async (requests) => { recorded.requests = requests; },
  };
  const context = {
    URL, Request, Response,
    fetch: network,
    caches: {
      open: async () => cache,
      match: async () => fallback,
      keys: async () => ["unrelated-app", "urbanhelphub-public-v0", "urbanhelphub-public-v1"],
      delete: async (key) => { recorded.deleted.push(key); return true; },
    },
    self: {
      location: { origin: "https://urbanhelphub.example" },
      addEventListener: (name, callback) => { handlers[name] = callback; },
      skipWaiting: async () => { recorded.skipped = true; },
      clients: { claim: async () => { recorded.claimed = true; } },
    },
  };
  // The browser resolves relative URLs against the worker origin.
  context.Request = class extends Request {
    constructor(url, options) { super(new URL(url, context.self.location.origin), options); }
  };
  vm.runInNewContext(source, context);
  function dispatch(path, { method = "GET", mode = "navigate", headers = {}, origin = context.self.location.origin } = {}) {
    let response;
    handlers.fetch({
      request: { url: origin + path, method, mode, headers: new Headers(headers) },
      respondWith: (value) => { response = value; },
    });
    return response;
  }
  return { handlers, recorded, dispatch };
}

test("precache contains only four public assets and omits credentials", async () => {
  const { handlers, recorded } = worker();
  let done;
  handlers.install({ waitUntil: (promise) => { done = promise; } });
  await done;
  assert.deepEqual(Array.from(recorded.requests, (request) => new URL(request.url).pathname),
    ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"]);
  assert.ok(recorded.requests.every((request) => request.credentials === "omit" && request.cache === "reload"));
  assert.ok(recorded.skipped);
});

test("activation removes only obsolete caches owned by this application", async () => {
  const { handlers, recorded } = worker();
  let done;
  handlers.activate({ waitUntil: (promise) => { done = promise; } });
  await done;
  assert.deepEqual(recorded.deleted, ["urbanhelphub-public-v0"]);
  assert.ok(recorded.claimed);
});

test("private routes, APIs, Stripe, new frontend chunks and non-GET requests bypass the worker", () => {
  const { dispatch } = worker();
  for (const path of ["/dashboard", "/dashboard/", "/helper/dashboard", "/admin", "/admin/helpers/1",
    "/login", "/logout", "/api/user", "/api/messages", "/api/stripe/webhook",
    "/api/customer/payments/1/checkout", "/api/helper/stripe/onboarding-link",
    "/_next/static/new-build.js", "/?payment=success", "/?stripe=return"]) {
    assert.equal(dispatch(path), undefined, path);
  }
  assert.equal(dispatch("/", { method: "POST" }), undefined);
  assert.equal(dispatch("/icons/icon-192.png", { origin: "https://checkout.stripe.com" }), undefined);
});

test("authorization, React server component and prefetch requests cannot enter the cache", () => {
  const { dispatch } = worker();
  for (const headers of [{ Authorization: "Bearer synthetic-test-value" }, { RSC: "1" }, { "Next-Router-Prefetch": "1" }]) {
    assert.equal(dispatch("/", { headers }), undefined);
    assert.equal(dispatch("/icons/icon-192.png", { headers }), undefined);
  }
});

test("only a failed plain homepage navigation gets the static offline fallback", async () => {
  const { dispatch } = worker(async () => { throw new Error("offline"); });
  assert.equal(await (await dispatch("/")).text(), "offline");
  assert.equal(dispatch("/", { mode: "cors" }), undefined);
  assert.equal(dispatch("/dashboard"), undefined);
  assert.equal(dispatch("/?payment=cancelled"), undefined);
});

test("successful homepage navigation uses the network without storing its response", async () => {
  const { dispatch, recorded } = worker(async () => new Response("fresh deployment"));
  assert.equal(await (await dispatch("/")).text(), "fresh deployment");
  assert.equal(recorded.requests.length, 0);
});
