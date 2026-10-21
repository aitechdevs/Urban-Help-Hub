# UrbanHelpHub

UrbanHelpHub connects customers with local helpers. The repository contains a Laravel API and a Next.js frontend with Customer, Helper and Administrator dashboards.

## Project structure

| Path | Purpose |
| --- | --- |
| `backend-api/` | Laravel 13 API, Sanctum authentication, marketplace endpoints, messaging, notifications and Stripe integration |
| `web-app/` | Next.js 16 App Router frontend, React 19 and Tailwind CSS 4 |
| `web-app/components/` | Shared notification, region, messaging and PWA components |
| `web-app/lib/dashboard-navigation.ts` | Accessible section navigation and active navigation state |
| `web-app/app/manifest.ts` | Installable web app metadata |
| `web-app/public/sw.js` | Public-asset-only service worker |
| `web-app/tests/service-worker.test.mjs` | Service-worker safety tests |
| `TRUEHOST_CPANEL_DEPLOYMENT.md` | Original hosting deployment guide |
| `releases/` | UI/PWA patch ZIP, installation instructions, file list and validation report |

The root-level `app`, `config`, `database` and `routes` folders were imported from the initial payment-only update. The runnable backend lives in **`backend-api`**; run Laravel commands there.

## Requirements

- Node.js 20.9 or newer and npm; development validation used Node.js 24.
- PHP 8.3 or newer and Composer; validation used PHP 8.4. Your locked dependency versions must also support the selected runtime.
- PHP extensions required by Composer, including mbstring, XML/DOM, curl and SQLite PDO for the local database.
- HTTPS for production PWA installation. Loopback development addresses are treated as secure contexts by supported browsers.

## Local development

Use a local database and development configuration. Never copy production credentials or customer data into a development checkout.

### Backend

From the repository root:

```sh
cd backend-api
composer install --no-interaction --prefer-dist
# First setup only; preserve an existing .env.
test -f .env || cp .env.example .env
mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
test -f database/database.sqlite || touch database/database.sqlite
```

The example environment defaults to SQLite. Keep `DB_CONNECTION=sqlite`; if specifying `DB_DATABASE`, use the absolute path to your local SQLite file. Generate an application key once for a new local environment, then migrate and seed:

```sh
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

Do not regenerate an existing environment's application key. Seeding creates service categories; an initial administrator is created only when the documented `MVP_ADMIN_EMAIL` and `MVP_ADMIN_PASSWORD` variables are supplied locally. Do not commit these values.

### Frontend

In another terminal, from the repository root:

```sh
cd web-app
npm ci
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api npm run dev
```

On Windows, configure `NEXT_PUBLIC_API_URL` using your shell or an ignored `web-app/.env.local` file instead of the POSIX inline assignment. The default frontend port is 3000. The backend's development CORS configuration permits the documented localhost frontend addresses.

PWA registration is enabled only in production builds so a development service worker does not cache work in progress. To check the PWA locally:

```sh
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api npm run build
npm start
```

## Dashboards and existing APIs

| Frontend route | Purpose |
| --- | --- |
| `/dashboard` | Customer tasks, profile details and conversations |
| `/helper/dashboard` | Helper services, opportunities, jobs, earnings and conversations |
| `/become-a-helper` | Existing Helper profile, service and verification workflow |
| `/admin` | Existing Helper review queue, task approvals and payments |
| `/admin/helpers/[id]` | Detailed Helper review and verification |
| `/login`, `/register`, `/post-a-task` | Existing authentication and task forms |

Section navigation uses focusable anchors without moving the existing dashboard panels. Message panels use the existing authenticated `GET /api/messages` and `POST /api/tasks/{id}/messages` endpoints. Opening the list marks messages read on the backend, so the panel loads only after an explicit user action. The API remains responsible for authorization and conversation availability.

## PWA behavior and security

- The manifest has root scope, start URL `/`, standalone display and icons derived from the existing logo.
- The service worker stores exactly four public assets: the offline HTML page and three icons. It never caches API responses, account information, authentication data, dashboard documents, Stripe requests or Next.js JavaScript chunks.
- Only an unsuccessful plain homepage navigation receives the static offline fallback. Authentication, dashboards, payment-return URLs and APIs remain online-only.
- Worker updates activate automatically without forcing a page reload. Increment the cache version in `public/sw.js` when changing its cached offline document or icons.
- The custom native installation prompt opens only after a user click and only after browser eligibility is signaled. iOS Safari receives Share → Add to Home Screen guidance. Standalone windows suppress the suggestion; dismissal is saved locally.
- iOS cannot reliably reveal installation status from a normal Safari tab. Native eligibility and device installation should be checked on the deployed HTTPS origin.

## Validation

```sh
cd web-app
npm run lint
node --test tests/service-worker.test.mjs
npm run build
```

Run `php artisan test` from `backend-api`. The UI/PWA implementation passed 18 Chromium checks, six service-worker tests and the two existing backend example tests; lint has 25 pre-existing image warnings. See [the detailed test report](releases/TEST-RESULTS.md) for the distinction between fixture-based browser checks, real local API checks and untested production behavior.

## cPanel deployment and rollback

Use [the patch installation guide](releases/PATCH-INSTALL-INSTRUCTIONS.md) for precise upload locations, replacement files, backup, rebuild, cache and rollback instructions. The frontend is served by cPanel's Node.js application using `web-app/server.cjs`; preserve the existing production API URL at build time and restart the managed application after a successful build.

The UI/PWA patch requires no database migrations, changes to Stripe configuration or backend cache-clearing commands. No compiled frontend build or environment files are included in the patch ZIP.

## Known gaps

The export has no Customer-management page/API or editable Customer account form. The Administrator Customer-management controls are explicitly unavailable. Stripe backend endpoints exist, but the exported frontend has no Checkout, Connect onboarding or connected-account payout launcher. No payment UI or business logic was invented. See [the complete list of unavailable controls](releases/UNIMPLEMENTED-CONTROLS.md).

Never commit `.env` files, Stripe keys, webhook secrets, private uploads, tokens or production database exports. This patch does not change commissions, payment processing or authorization.
