# PayPal validation

All work is local; no real credentials or payment-provider calls were used. No deployment, real funds, SMTP, production database or cPanel changes were performed.

- Laravel feature/unit suite: 47 tests, including 17 PayPal tests; 246 assertions.
- Frontend runtime and customer payment policy tests: 8 passed.
- Existing recovery/notification and retained worker tests: 13 passed.
- Synthetic SDK browser regression: 8 passed (success, cancellation and capture failure, at 1440px and 390px, plus helper/admin payout controls). Checks authenticated API requests, capture order reference, no visible Stripe checkout, no Stripe checkout calls and no false success on capture failure.
- Next production build and runtime syntax lint: passed.
- Static reproducibility: 1043 public files byte-identical to a fresh rebuild; 136 original HTML SEO metadata sets and four hosting/SEO files unchanged; asset links resolve across 140 HTML pages.
- Next runtime smoke: 140 prepared HTML responses, health, SEO/assets, API status/auth passthrough and private-file protection passed.
- New/modified PHP syntax checks and Pint on new PayPal code: passed. Laravel route and view caches compiled and cleared successfully. Existing controller formatting was retained to minimize unrelated changes.
- Laravel default Vite build: existing fonts.bunny.net DNS failure (EAI_AGAIN), unrelated to this change. Existing `npm run build:local --prefix backend-api` passed using local fonts, with the pre-existing optional-fontaine warning.
- No runtime dependencies added. Laravel Boost was installed locally as required by backend agent instructions using the same upstream commit archives via codeload when api.github.com was blocked, then removed from the shipped dependency/configuration diff.

Reproduce from repository root:

```sh
php backend-api/vendor/bin/phpunit --configuration backend-api/phpunit.xml
npm test --prefix frontend
node --test frontend/static-maintenance/tests/patch-flows.test.mjs web-app/tests/service-worker.test.mjs
python3 frontend/static-maintenance/tests/validate-static.py
npm run lint --prefix frontend
npm run build --prefix frontend
npm run build:local --prefix backend-api
npm run test:smoke --prefix frontend
```

For the optional browser check, provide installed Playwright and Chromium modules without changing runtime dependencies:

```sh
UHH_PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs \
UHH_CHROMIUM_MODULE=/absolute/path/to/@sparticuz/chromium/build/index.js \
node frontend/static-maintenance/tests/paypal-browser.mjs
```

Or make @playwright/test and its installed Chromium available through normal module resolution and omit both environment variables. The test starts and stops its own loopback Next runtime on port 3332; override with UHH_BROWSER_PORT. It intercepts the SDK and APIs and blocks all other external requests.

Remaining verification: real PayPal Sandbox buyer login, live-provider response shape and webhook delivery; PHP 8.5 on cPanel; target MySQL concurrent locking; hosting-specific popup/CSP behavior. A passed mock suite does not establish those properties. Follow the Sandbox checklist before considering Live activation.
