# Prepared cPanel snapshot

`cpanel-working` preserves the consolidated static cPanel frontend and Laravel API.
The four current attachments exactly match the SHA-256 inputs recorded in
`IMPORT-PROVENANCE.json`; the tested consolidation at `8779e1c` is retained.
No application source, public asset, SEO metadata or hosting configuration is
changed when creating this preservation branch.

This is a prepared snapshot, **not an exact production backup**. No fresh cPanel
frontend/backend export accompanied this request. Earlier exports and support
screenshots do not prove the current production files match these inputs.

When fresh, safely redacted exports are available outside the repository:

```sh
python3 tools/compare-cpanel-export.py \
  --frontend /path/to/fresh/public_html \
  --backend /path/to/fresh/backend-api \
  --output /tmp/urbanhelphub-cpanel-comparison.json
```

A matching report verifies only the compared source/public assets. Database,
private uploads, credentials, dependency installations, PHP/Node configuration,
cron and active server state require a separate private production backup.
Do not commit production exports containing private data. This comparison tool
does not deploy, send mail, change credentials or access the live site.

Continue development on `nodejs-migration`, leaving this snapshot branch stable.
