# Urban Help Hub

**Local help, connected.** Urban Help Hub is a Canada-focused marketplace connecting customers with local helpers for everyday services and tasks.

Website: [urbanhelphub.com](https://urbanhelphub.com/)

## Project status — 22 November 2026

This repository contains several historical and ongoing frontend workflows. The `web-app/` Next.js frontend is under active development on the `feature/uhh-static-release` branch. The previously assembled static deployment workflow under `frontend/` remains in the repository for reference and comparison. **The new release candidate has not been deployed to production.** The live website and Laravel API are separate systems.

The proposed frontend static export builds successfully with Next.js 16.4.6 and produces 16/16 pages. The production-dependency npm audit reports zero findings as of the local test on 22 November 2026. These checks do **not** prove that PayPal transactions, authentication, role permissions, messaging, PWA behavior, or deployment have passed end-to-end validation.

## Features under development

- Customer dashboard for posting tasks, managing bookings and payment status
- Helper dashboard for services, availability, task activity and payout setup
- Administrative review of customers, helpers, tasks and marketplace activity
- Super Administrator page for managing administrators and permissions
- Task-related customer–helper messaging and completion-based read-only conversations
- PayPal Sandbox checkout and payout user interfaces, integrated with a separate Laravel backend
- Canada-focused regions, localization and responsive web design

Availability and correctness of these features depend on backend authorization, configuration and end-to-end testing.

## Architecture

| Path | Purpose |
| --- | --- |
| `web-app/` | Next.js / React / TypeScript frontend; source for the new static-export release candidate |
| `backend-api/` | Laravel API, database migrations, payment services and authentication logic |
| `frontend/` | Earlier consolidated static deployment artifacts and maintenance workflow |
| `docs/` | Architecture, historical consolidation, deployment and validation documentation |
| `releases/` | Existing release-related material |
| `tools/` | Existing project utilities |

The frontend can be hosted as static assets on Apache/cPanel; the Laravel API handles server-side operations. Do not put Laravel source, `.env` files, databases or private uploads in the public web root.

## Build the Next.js frontend

Requirements: a supported Node.js release, npm, and the project source.

```bash
cd web-app
npm ci
npx tsc --noEmit
npm audit --omit=dev
```

Configure `NEXT_PUBLIC_API_URL` to point to the intended Laravel API. For example, in Windows Command Prompt:

```cmd
set "NEXT_PUBLIC_API_URL=https://api.example.com/api"
npm run build -- --webpack
```

In PowerShell:

```powershell
$env:NEXT_PUBLIC_API_URL = "https://api.example.com/api"
npm run build -- --webpack
```

The project uses `output: "export"` with `trailingSlash: true`; the generated static website is written to `web-app/out/`. The `out/` folder is a generated artifact and is not committed to Git. Static frontend generation does not provide a Next.js server runtime.

For development:

```bash
cd web-app
npm run dev
```

## Existing static deployment workflow

The repository also includes a historical/static-maintenance workflow assembled from earlier cPanel sources. It has separate documentation and should not be silently mixed with the new `web-app/` release candidate. See [deployment](docs/DEPLOYMENT.md), [source status](docs/SOURCE-STATUS.md) and [consolidation history](docs/CONSOLIDATION.md) before choosing a deployment source.

An earlier Python-based static maintenance builder is located at `frontend/static-maintenance/build-static.py`; its output and testing steps are documented within `docs/`. Do not assume an old `frontend/public_html/` snapshot matches the latest Next.js release candidate.

## Deployment and security

- Build locally, review the generated files and back up the live site before any deployment.
- Deploy **only** reviewed static output contents to the frontend document root; keep the Laravel backend in its existing protected location.
- Never commit secrets, `.env` files, payment credentials, production backups, databases, or private user documents.
- `NEXT_PUBLIC_*` environment variables are public in browser bundles; never place secret keys in them.
- Verify PayPal payments and webhook signatures on the Laravel server. Use PayPal Sandbox for development tests.
- Enforce identity, role permissions, chat authorization and payout rules on the backend, not solely in the browser.
- Review dependency advisories and execute automated and manual regression tests before a production release.
- Do not run destructive database migrations or replace the production Laravel `APP_KEY` during a frontend deployment.

## Contributions and licensing

Development is maintained by the project team. Use a feature branch and a reviewable pull request; do not deploy automatically from unreviewed changes. Report security issues privately rather than publishing secrets in GitHub issues.

**All rights reserved**, unless the repository owner supplies an explicit license. Public visibility of code does not automatically grant permission to reuse or redistribute it.
