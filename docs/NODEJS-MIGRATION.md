# Node.js development migration

## Branches and provenance

- `cpanel-working` is the prepared static/Laravel snapshot at `060bec8`. It is not
  an exact production backup. See [snapshot verification](CPANEL-SNAPSHOT.md).
- `nodejs-migration` is the development branch. Its PR targets `main`; merging is
  a separate review decision. No automatic deployment is configured.
- The four current archives match the import hashes in `IMPORT-PROVENANCE.json`.
  The password-recovery, approval/login-consistency and notification/email-logo
  fixes remain in the tested consolidation inherited from `8779e1c`.

## Architecture and deliberate boundary

Laravel remains the API, authentication, approvals, documents, password recovery,
mail and Stripe backend. The maintained cPanel frontend has features absent from
both older TSX trees. Rebuilding those trees would lose those features.

`frontend/server.mjs` starts a real Next.js App Router runtime. It serves the
maintained public pages/assets through a guarded custom-server adapter first;
new Next routes are handled by Next afterward. `/api/migration-health` is a real,
uncached Next route. This is an incremental migration bridge, **not** a claim that
all maintained screens have been rewritten into editable TSX components.

Develop existing deployed UI behavior in `frontend/static-maintenance` and rebuild
its prepared export. Add new Next routes in `frontend/app`; when migrating an
existing route, move it deliberately out of the adapter's prepared route set only
after parity tests. Keep the snapshot branch stable. `web-app/` and
`frontend/nextjs-reference/` remain historical references; do not substitute them
for the maintained frontend or run their old deployment recipes.

## Reproducible Node tooling in both projects

Use Node.js 24 (`.nvmrc`), or a compatible runtime in `>=22.12 <25`. Each project
has its own npm lockfile. From the repository root:

```sh
npm ci --prefix frontend
npm ci --prefix backend-api --include=dev
npm run build --prefix frontend
npm run build:local --prefix backend-api
```

Laravel's existing `vite.config.js` retains Bunny as the default font provider.
`build:local` bundles the same Instrument Sans weights from the locked npm font
package without depending on an external font-download host. Normal `npm run build
--prefix backend-api` retains the original provider and needs fonts.bunny.net.
The optional optimized-fallback warning does not prevent font/asset generation.
Generated `.next`, Vite outputs, dependencies and local configuration stay ignored.

## Safe local Laravel setup

Use PHP supported by composer.lock (locally validated on PHP 8.4; cPanel's PHP 8.5
handler is preserved). Install with `composer install` from `backend-api`.
Create `.env` from `.env.example` only if none exists, configure a local SQLite
file, use `MAIL_MAILER=log`, and keep production Stripe/SMTP credentials unset.
Generate APP_KEY only for a new local environment. Then run migrations and seed
service categories on the local database. Never point development or tests at
production; never regenerate a production key or reset a production database.

```sh
# First terminal, from backend-api, with PHP on PATH:
npm run dev:api
# Second terminal, from repository root:
npm run dev --prefix frontend
```

Default frontend: loopback port 3000. Default Laravel: loopback port 8000.
For the built Next runtime use `npm start --prefix frontend`. `PORT` and `HOST`
configure its listener. `UHH_API_ORIGIN` may select a different **loopback-only**
Laravel origin; public hosts, credentials and path overrides are rejected.

## Configuration and isolation

The 1,037 prepared public files, original HTML metadata, sitemap, robots,
Google verification and cPanel `.htaccess` are unchanged. The adapter substitutes
only the production API-origin literal with `/__backend` **in response memory**.
That route proxies to local Laravel, preserving method/body/auth/status without
caching account data or following redirects to external hosts. Canonical/SEO URLs
and branding remain unchanged. Private configuration, dotfiles, unsupported file
types and symlinks escaping the prepared tree cannot be served by the adapter.

This runtime uses no-store responses during migration, including old hash-named
chunks whose API origin is substituted. It is a development workflow, not an
approved production hosting configuration. Apache/PHP handlers in `.htaccess`
are preserved for cPanel but are not interpreted by Node. The existing mail cron
is not run; SMTP delivery and Stripe transactions are not exercised. Password
reset emails retain their existing trusted canonical website URL; use the
isolated tests for reset flows rather than opening production links from logs.

## Checks

```sh
python3 frontend/static-maintenance/tests/validate-static.py
node --test frontend/static-maintenance/tests/patch-flows.test.mjs web-app/tests/service-worker.test.mjs
python3 -m unittest discover -s tools/tests
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm run test:smoke --prefix frontend
npm run build:local --prefix backend-api
# From backend-api, using the isolated SQLite/array-mailer phpunit.xml:
php vendor/bin/phpunit
```

The smoke test starts its own loopback Next runtime and a synthetic local API,
verifies every prepared HTML response and critical public assets, then stops both.
Laravel's real feature suite separately exercises the API and approval/reset/mail
logic. Neither is a claim of live production or SMTP/payment validation.

A fresh cPanel export is still required for source/public-file production parity.
No deployment, DNS, cPanel setting, production secret, cron, or live data was changed.
