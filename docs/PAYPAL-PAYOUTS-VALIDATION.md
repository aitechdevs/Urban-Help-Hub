# Admin-approved payout validation

No real PayPal calls, live funds, cPanel changes, production database operations or deployment were performed. All provider behavior in automated tests is synthetic. New sending switches remain false by default.

- **65 backend tests / 359 assertions passed**, including 18 new payout tests and the previous 17 Checkout tests. Coverage includes admin/role authorization, job/customer completion, verified collection before release, 30/70 accounting, provider refund before delayed webhook, helper password and recipient privacy, reviewed-account version, recipient freezing, duplicate admin submissions, ambiguous response and duplicate-batch recovery, failed/unclaimed/returned transfers, mismatched provider recipient, Live/feature gates, old ambiguous submissions, signed/replayed payout webhooks, one eligibility notification and approval-only polling.
- **8 frontend runtime/policy tests passed**.
- **13 existing notification/recovery/service-worker tests passed**.
- **8 synthetic browser scenarios passed**: customer success/cancel/error at desktop/mobile widths, helper payout-email save/password clearing, and admin approval → processing → provider-confirmed settlement. The admin test asserts one approval payload containing the reviewed account version and no manual paid-status bypass. A disputed payment has no approve button.
- Static builder reproduces **1049 files** byte for byte. Original metadata for **136 HTML pages** and four hosting/SEO files remains unchanged; local assets resolve across **140 HTML pages**. Versioned assets retain older URLs for cached clients.
- Next production build, frontend syntax lint, changed static-module syntax and backend local-font Vite build passed. The pre-existing optional-fontaine warning remains; the default remote-font build's previously documented fonts.bunny.net network issue is unrelated and unchanged.
- The real local Next runtime smoke passed all 140 exact prepared HTML responses, health/assets/SEO, local API passthrough/auth status and private-file protection.
- Laravel route and view caches compile successfully and were cleared afterward. New PayPal payout PHP is formatted with Pint. Unrelated legacy controller formatting is retained.
- No runtime dependency/lockfile change ships. Required Boost setup was local only and its temporary package/configuration files were removed.

Reproduce from repository root with PHP/Composer and Node dependencies installed:

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

Optional browser suite (use installed module paths or normal Playwright module resolution):

```sh
UHH_PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs \
UHH_CHROMIUM_MODULE=/absolute/path/to/@sparticuz/chromium/build/index.js \
node frontend/static-maintenance/tests/paypal-browser.mjs
```

Remaining acceptance work is explicit: PayPal business/Payouts approval, a real Sandbox recipient transfer, actual provider response shapes and webhook delivery, target PHP 8.5 and MySQL concurrency behavior, hosting-specific popup/CSP behavior, and scheduler operation. Local runtime is PHP 8.4.26 / SQLite with mocked provider HTTP. No passing mock test is a claim that PayPal has enabled your account or that real money moved.
