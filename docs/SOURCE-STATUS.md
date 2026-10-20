# Source status and limitations

The original backend and Next.js sources came from urbanhelphub-Cpanel(3).zip.
The deployed frontend baseline came from urbanhelphub-public-html(1).zip.
Later online cPanel edits mean the older TSX tree is not an exact source map for
the static export. The authoritative frontend workflow here is static-maintenance
plus static-baseline, with its prepared output in frontend/public_html.
The older Next.js README/server.cjs/start script/config are historical reference;
their Node hosting instructions do not describe the deployed static hosting.

Backend source includes all prepared extension routes and changes from this work.
AdminController's existing shared verificationReadiness method is integrated
with SingleDocumentPolicy. Its other methods are retained from supplied source.
Production-only edits made after the supplied backend ZIP cannot be inferred.
Compare against a fresh cPanel backend export before replacing live controllers.

The latest supplied terminal screenshot shows both route:clear and route:cache
succeeded after adding the missing identity-once.php. Customer approval email
was delivered to Gmail and a ten-minute cron was saved. Helper verification email
and the complete rejected-document replacement flow still need live acceptance
checks. This archive does not assert those unobserved checks passed.

No database exports, credentials, real uploaded IDs or email queue records are
included. SEO metadata, robots, Google verification and sitemap are preserved
from the latest prepared frontend. Mobile Salon's sitemap addition is retained.
