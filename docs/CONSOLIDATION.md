# Consolidated source and ordered patches

## Inputs and repository comparison

Read `CODEX-HANDOFF.md` from the existing handoff branch as context. Its suggested
performance task is separate from this source consolidation. No deployment or
live-site performance change is part of this import.

Repository base: `0158963f2ad0c07fcbe8ab62e39e60d778c68d19` on `main`.
Retained branches:

- `codex/urbanhelphub-handoff-2026-10-20`, commit `5eebe43ad571b223ef3c96c560da7955bfa12291`.
- `ui-pwa-documentation`, commit `284ac131cd171194c7c11f6b312d46f1d5f01fd2`.

The existing backend matched the archive except for the archive's later single-ID
readiness policy, customer task editing, Mobile Salon seed, extension routes and
mail scheme template. These later archive changes are imported. Existing payment
integration files, root deployment notes and all repository UI/PWA files remain.
`web-app/` is byte-identical to the retained UI/PWA branch. The supplied, divergent
Next.js reference is retained separately in `frontend/nextjs-reference/`; neither
tree is a substitute for the maintained static export.

Import order:

1. `UrbanHelpHub-GitHub-Source.zip` — full source and static baseline.
2. `UrbanHelpHub-Password-Recovery-Fix.zip` — recovery endpoints/pages/assets and tests.
3. `UrbanHelpHub-Approval-Login-Consistency-Fix.zip` — review queue, readiness middleware and admin modules.
4. `UrbanHelpHub-Notification-Links-And-Email-Logo.zip` — shared notification/message navigation, recovery-page logo and branded mail provider.

Archive SHA-256 hashes and patch file lists are in `IMPORT-PROVENANCE.json`.
Backend patch files are overlaid in that order. Both extension requires are added
once, outside route groups, before the existing final-approval-email require,
which remains last. The branded mail provider is registered once alongside the
existing provider. No production environment values are imported.

## Authoritative hosting workflow

`frontend/public_html/` remains a static cPanel document root with a separate
Laravel API. Hosting does not require a Node server. The existing `.htaccess`,
robots, sitemap, Google verification and HTML SEO metadata are preserved.
No automatic deployment workflow is introduced.

Rebuild with Python from the repository root into a **new** directory:

```sh
python3 frontend/static-maintenance/build-static.py frontend/static-baseline /tmp/uhh-new-public-html
```

Recovery pages/assets are retained under `additional-pages/`, along with the
existing logo missing from the original rebuild inputs. Two earlier admin chunk
versions are retained unchanged under `compatibility-assets/` and copied after
module replacement for cached pages. This makes the full 1,037-file document
root reproducible without changing the supplied final patch's served bytes.

## Data exclusions

Only source, templates, static assets and tests are imported. Actual `.env` files,
credentials, database files/dumps, helper uploads, dependency directories and
runtime logs/caches are excluded. Database migrations and factories are source,
not a production database. Safe `.env.example` templates remain tracked.
The existing UI/PWA release ZIP was checked for excluded private paths.

## Validation and limits

The static regression command rebuilds into a temporary folder, compares every
output byte, checks the original SEO metadata snapshot, and verifies HTML asset
references. The Node tests exercise notification destinations, unsafe URL fallback,
read-update failure, reset token handling, session cleanup and request throttling
messages, plus the retained service-worker safety suite.

Backend tests must use the isolated SQLite configuration in `backend-api/phpunit.xml`
and an array mailer. Never run the feature tests against production. SMTP delivery,
real payment processing, cPanel-specific routing, and production identity uploads
are outside these local checks. Existing final-approval email scheduling remains
separate; importing source sends no email and does not run its mail cron.

See `CONSOLIDATION-VALIDATION.md` for the executed results and remaining blockers.
