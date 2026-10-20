# Validation results

Date: 12 October 2026. Base source: `0158963f2ad0c07fcbe8ab62e39e60d778c68d19`. Validation used Node.js 24.19, Next.js 16.3.5, React 19.2.8, PHP 8.4.26 and headless Chromium 153 with Playwright.

## Final executed checks

| Check | Final result |
| --- | --- |
| `npm run build` with the local development API URL | Passed; production compilation, TypeScript and all 12 static outputs completed |
| `npm run lint` | Passed; 0 errors, 25 pre-existing image-element warnings |
| `node --test tests/service-worker.test.mjs` | 6 passed, 0 failed, 0 skipped |
| Backend `php artisan test` | 2 passed, 2 assertions; these are the existing example tests |
| Chromium browser checks | 18 passed, 0 failed |
| Real local Laravel API smoke checks | Passed for Customer and Helper registration, login, profile, denied Admin access, messages, notifications, logout token revocation and unauthenticated Stripe endpoint rejection |
| Binary-capable Git patch | Applied cleanly to a temporary extraction of the exact base commit; all 19 source/documentation files reproduced byte-for-byte |
| `git diff --check -- README.md web-app` | Passed for source files; generated diff files retain required context whitespace |

The browser navigation/message tests use synthetic, role-specific API fixtures matching the existing endpoint contracts. They verify real rendered components, click/touch/keyboard behavior, request methods, disabled states and message submission, but are not a full production task/payment integration test. The separate API checks exercise the actual Laravel application against the local SQLite development database, not cPanel or customer data.

## Browser check details

- Passed: customer dashboard desktop navigation and keyboard.
- Passed: customer messages read/send through existing API with loading/disabled states.
- Passed: customer dropdown notification keyboard Escape and message link.
- Passed: customer mobile touch navigation and menus.
- Passed: helper dashboard desktop navigation and keyboard.
- Passed: helper messages read/send through existing API with loading/disabled states.
- Passed: helper dropdown notification keyboard Escape and message link.
- Passed: helper mobile touch navigation and menus.
- Passed: helper tablet navigation preserves existing breakpoint access.
- Passed: admin dashboard desktop navigation and keyboard.
- Passed: admin cards connect to existing filtered helper queue; missing customer controls disabled.
- Passed: admin dropdown notification keyboard Escape and message link.
- Passed: admin mobile touch navigation and menus.
- Passed: admin tablet navigation preserves existing breakpoint access.
- Passed: PWA manifest, icon sizes, worker headers, registration and safe browser caches.
- Passed: custom install event waits for click, invokes native prompt once, persists dismissal.
- Passed: accepted installation and appinstalled hide the control.
- Passed: iOS Safari guidance, installed standalone detection and unsupported browsers.

## Service-worker safety coverage

The six Node checks validate the four-asset allowlist, omitted credentials during precaching, cleanup restricted to this application's obsolete caches, bypass of private documents/APIs/Stripe endpoints/Next.js bundles, bypass of Authorization/RSC/prefetch requests, static fallback only for a failed plain homepage navigation, and network delivery without storing successful homepage responses. Chromium separately verified an active root-scope worker, no-store worker headers, correct manifest values and actual PNG dimensions; Cache Storage contained exactly the offline page and three icons after online private-document requests. Offline homepage fallback worked. An explicit update check caused no forced page reload.

## Limitations / not run

- **Native operating-system installation:** not performed. Native `beforeinstallprompt` eligibility depends on browser policy and user engagement; captured-event, user-click, accepted/dismissed and `appinstalled` handling were tested with synthetic events.
- **Physical iPhone/iPad Safari and physical touch hardware:** not tested. Safari guidance, iOS standalone detection and mobile touch input were tested with browser emulation. Confirm actual Share → Add to Home Screen after HTTPS deployment.
- **Live Stripe Checkout/Connect/webhooks/payouts:** not run; no live credentials or production transactions were used. This exported frontend contains no Checkout or Connect launcher. Existing backend payment files are byte-for-byte unchanged. Stripe endpoints require authentication, and the worker does not intercept them; that is not evidence a full Stripe transaction was completed.
- **cPanel production deployment:** not performed. Rebuild on cPanel with the existing production API URL and restart its managed Node application using the installation instructions.
- No full marketplace transaction or production database migration was executed. Only local development registration/login test records were created.

Early checks identified and corrected conversation-selector labeling and Escape focus ownership. Final results above refer to the final source and a clean frontend process. Existing warnings were left unchanged as requested.

## Documentation follow-up

Added the root GitHub README and explanatory inline comments. These edits do not change runtime behavior. Documentation follow-up checks passed: lint (zero errors, 25 existing warnings), all six service-worker tests, and clean binary patch application reproducing all 19 source/documentation files. The 18 Chromium checks and production build above apply to the unchanged implementation preceding the comment-only follow-up.
