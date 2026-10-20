# Consolidation validation

Executed locally on 21 October 2026 (Africa/Lagos). Nothing was deployed.

| Check | Result |
| --- | --- |
| Static builder and complete packaged document root | 1,037 files byte-identical |
| Original HTML SEO metadata | 136 page metadata sets unchanged |
| Sitemap, robots, Google verification, `.htaccess` | 4 files byte-identical |
| Local asset references | All references resolve across 140 HTML pages |
| Local static HTTP smoke | 10 page/asset requests passed, including recovery pages, messages, jobs, earnings, admin, sitemap and logo |
| Notification and recovery JavaScript regression tests | 7 passed |
| Retained UI/PWA service-worker suite | 6 passed |
| Laravel/PHPUnit suite | 30 passed, 110 assertions; no skipped tests |
| PHP syntax | All 103 tracked PHP files passed |
| Maintained JavaScript syntax | 9 files passed |
| Existing UI/PWA repository tree | `web-app/` unchanged from `284ac131cd171194c7c11f6b312d46f1d5f01fd2` |
| Backend dependency declarations/lockfile | Unchanged from repository/source input |
| Local Laravel HTTP smoke | Health endpoint and all 12 seeded service categories passed; Mobile Salon present |
| Laravel route cache | Generated successfully, then cleared |
| Private-data audit | 2,292 tracked files checked; no excluded private/runtime paths or credential-pattern findings; credential template fields blank or placeholders |

## Commands

From the repository root:

```sh
python3 frontend/static-maintenance/tests/validate-static.py
node --test frontend/static-maintenance/tests/patch-flows.test.mjs web-app/tests/service-worker.test.mjs
```

From `backend-api/`, after installing the locked Composer dependencies and
configuring a local-only application key:

```sh
php vendor/bin/phpunit
```

PHP 8.4.24, Composer 2.8.8, Node 24.19.0 and Python 3.12.14 were used. The hosting
PHP 8.5 handler is unchanged. Composer dependencies were installed at their locked
versions; blocked API downloads were retrieved from GitHub's official codeload
archive endpoint at the same locked commit references. TLS, archive integrity
checks and any lockfile checksums stayed enabled.

The repository's required Boost bootstrap was exercised locally, its generated
guidelines read, and its temporary dependency/configuration changes removed.
The final tests ran against the original dependency lockfile. Generated caches,
the development-only application key, dependencies and logs are ignored and are
not part of the commit.

Three stale imported test fixtures were corrected: two customer fixtures now
explicitly declare active status (database defaults are not hydrated on a newly
created Eloquent instance), and the manually constructed mail middleware route
now includes Laravel's controller action metadata. No application guard was
weakened to make these tests pass.

## Existing dependency advisories

`composer audit --locked` reports three advisories in the unchanged dependency
lockfile. Dependency upgrades are outside this import and require a separate
review:

- `league/commonmark`: [GHSA-97jj-33gv-5xf9](https://github.com/advisories/GHSA-97jj-33gv-5xf9), disallowed raw HTML bypass.
- `league/commonmark`: [GHSA-3q6v-r5mr-hxv8](https://github.com/advisories/GHSA-3q6v-r5mr-hxv8), table parser denial of service.
- `symfony/http-foundation`: [CVE-2026-108082](https://symfony.com/cve-2026-108082), header parsing denial of service.

## Not exercised

No real SMTP delivery, payment transaction, private document upload or live
cPanel operation was performed. The Laravel tests used in-memory SQLite and an
array mailer. MIME-level mail tests verified the inline logo, preserved text and
recipient/subject, escaped content, clickable reset URL and duplicate prevention.
The earlier Next.js reference trees were not used to rebuild the static site.
The handoff's separate performance investigation remains outside this PR.
