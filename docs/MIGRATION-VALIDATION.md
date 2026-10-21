# Node migration validation — 21 October 2026

No live-site access or deployment was performed.

| Check | Result |
| --- | --- |
| Four attached archive hashes vs existing consolidation provenance | All match exactly |
| Prepared cPanel snapshot preservation | `cpanel-working` at `060bec8`; no runtime source/assets changed in its preservation commit |
| Static rebuild | 1,037 served files byte-identical |
| SEO/configuration | 136 original page metadata sets and four sitemap/robots/verification/hosting files preserved |
| HTML local asset references | All resolve across 140 pages |
| Laravel test suite | 30 passed, 110 assertions, isolated SQLite and array mailer |
| Notification/recovery and retained UI/PWA tests | 13 passed |
| Node runtime unit/integration tests | 7 passed |
| Snapshot comparison fixture tests | 3 passed; these are not a fresh production export comparison |
| Next.js production build | Passed; genuine dynamic `/api/migration-health` route built |
| Runtime HTTP smoke | Next health, all 140 exact prepared HTML responses, public assets, API status/auth passthrough, directory redirects and config-file protection passed |
| Frontend JavaScript syntax checks | Passed |
| npm frozen installs | Both frontend and backend-api passed `npm ci` |
| Laravel Vite local font build | Passed, CSS/JS and all three Instrument Sans weights generated |
| Default Bunny font build | Blocked by unavailable external fonts.bunny.net DNS/network; default production provider unchanged |
| Existing Laravel application/routes/config/Composer lock vs cpanel-working | Unchanged |

Node 24.19.0, PHP 8.4.26, npm 11.9 and the locked Next 16.3.5 / Vite 8.3.4
packages were used. PHP 8.5 hosting handlers remain in the preserved cPanel files.
The Vite build emits an optional optimized-font-fallback warning; font assets and
build output complete successfully. The test runtime uses a synthetic local API;
Laravel's real API behavior is separately covered by the PHP suite.

## Limits and remaining review

No fresh cPanel export was supplied, so exact source parity with current production
is not verified. Database/private-data backup verification is outside this source
comparison. No real SMTP, Stripe payment, production account or document operation
was performed. The older TSX trees are not feature-parity replacements; the new
Next runtime preserves the maintained export while individual route migration is
future work. No new full browser acceptance suite is claimed by this migration.

Git transport can push branches. GitHub API requests currently fail with an
outbound proxy CONNECT 403 for api.github.com; that blocks automated PR creation.
The PR title/body are prepared in `PR-NODEJS-MIGRATION.md`. The API destination has
been added to the editable cloud network draft; saving a draft does not apply or
publish it. This has no effect on cPanel or the live site.

The existing dependency advisories documented in CONSOLIDATION-VALIDATION.md
remain separate upgrade work; no security verification or checksum was disabled.
