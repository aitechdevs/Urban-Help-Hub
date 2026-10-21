# Consolidate cPanel updates and establish isolated Next.js development

Base: `main`
Head: `nodejs-migration`

The prepared cPanel source and later approval/login consistency, password recovery,
notification navigation and email-logo fixes were spread across archives and older
frontend branches. Consolidate the exact supplied inputs without dropping the
newer maintained static features, and preserve that state on `cpanel-working`.
This is a prepared snapshot pending comparison against a fresh cPanel export, not
an exact production backup.

Keep Laravel for authentication, marketplace data, approvals, documents, mail and
Stripe. Add locked Node.js tooling to `backend-api` and `frontend`, pin Node 24,
and introduce a real Next.js runtime with a guarded compatibility adapter for
the maintained frontend. This preserves its HTML, SEO, assets and functionality
while routes can be migrated incrementally; it does not claim the historical TSX
source has been brought to parity.

The development proxy routes API requests to loopback-only Laravel. Production
API-origin substitution happens only in response memory, never in snapshot files.
No deployment workflow, production credentials, database change, mail cron run,
DNS change or live operation is included. The cPanel font provider remains the
default; a local font option permits reproducible builds without its network host.

Validation: 30 Laravel tests / 110 assertions; 13 existing notification/recovery/PWA
tests; seven runtime tests; three source-comparison tests; Next build; Vite local
font build; frozen npm installs; complete 1,037-file static reproducibility; 136 SEO
metadata sets/four hosting files; all 140 served HTML responses through the real
Next runtime and local proxy smoke checks. See MIGRATION-VALIDATION.md for limits.

Review the incremental-runtime boundary and private-file/API isolation before
merging. A fresh cPanel comparison and any eventual production rollout are
separate, explicit work. Main and the live site have not been updated.
