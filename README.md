# UrbanHelpHub

Source and static deployment snapshot assembled 20 October 2026 from the supplied
cPanel exports plus the updates prepared in this project. Hosting remains a
Next.js static frontend on Truehost cPanel with a separate Laravel API.
No Node.js process is needed on the hosting server.

## Repository structure

| Path | Purpose |
| --- | --- |
| `backend-api/` | Laravel source with task editing, Mobile Salon, customer profile approval, final approval email and single-document/replacement updates merged |
| `frontend/public_html/` | Complete latest prepared static frontend, ready to copy to the website document root |
| `frontend/static-maintenance/` | Maintained JavaScript modules, additional pages and Python static builder |
| `frontend/static-baseline/` | Supplied cPanel static export used as the reproducible build baseline |
| `frontend/nextjs-reference/` | Earlier supplied Next.js/TypeScript source, for reference and future migration |
| `docs/` | Upload, architecture, deployment and validation notes |

Read [GitHub upload](docs/GITHUB.md), [deployment](docs/DEPLOYMENT.md), and
[source status](docs/SOURCE-STATUS.md) before rebuilding or deploying.

## Consolidated import

The source archive and the three later patches are consolidated in the order
listed in [the import report](docs/CONSOLIDATION.md). The existing repository's
handoff and UI/PWA branches are retained in Git history. `web-app/` preserves
the UI/PWA branch unchanged; `frontend/nextjs-reference/` preserves the reference
source supplied with the archive. Both are historical/reference workflows:
neither replaces the maintained static document root. The earlier repository
README is retained in [docs/REPOSITORY-UI-PWA.md](docs/REPOSITORY-UI-PWA.md).

No deployment is performed by importing, rebuilding, or running the checks.
Do not upload the repository root or backend source into the public document root.

## Rebuild the maintained frontend locally

Requires Python 3.9+ only; run from the repository root with a new output folder:

```bash
python3 frontend/static-maintenance/build-static.py frontend/static-baseline dist/public_html
```

The output should match `frontend/public_html/`. Do not rebuild the deployed site
from `nextjs-reference/`; it predates cPanel-only changes.

Run the static regression checks from the repository root:

```bash
python3 frontend/static-maintenance/tests/validate-static.py
node --test frontend/static-maintenance/tests/patch-flows.test.mjs web-app/tests/service-worker.test.mjs
```

## Backend setup for a new development environment

Use PHP 8.5 (matches the working cPanel CLI) and Composer. Install dependencies
from `composer.lock`, copy `.env.example` to `.env`, set a LOCAL database and
credentials, generate an application key and run migrations. Production secrets
and database contents are intentionally excluded. Never generate a replacement
APP_KEY or run fresh/reset migrations on the existing live site.

```bash
cd backend-api
composer install
cp .env.example .env
php artisan key:generate
# Set your local database configuration before continuing.
php artisan migrate
php artisan serve
```

The existing production mail cron remains separate from GitHub. See deployment
notes. The default development mailer can remain `log` to avoid real emails.

## Document policy

One active, approved, unexpired identity document is reused across all services.
A pending/approved valid identity blocks another upload. Rejected or expired
identity can be replaced from the dashboard without resubmitting profile,
services or availability. Admin reviews the replacement; final verification
remains an explicit admin decision. Individual service approvals are preserved.
No automated document authenticity claim is made.

## Scope

This is the complete available source plus prepared static deployment, not a
fresh download of today's cPanel files. It excludes credentials, databases,
private helper uploads, dependency folders and runtime files. Retain a separate
private cPanel backup of production data. No GitHub repository has been created
or pushed by this packaging operation.
