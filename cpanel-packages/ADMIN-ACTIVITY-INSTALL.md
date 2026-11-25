# UrbanHelpHub administrator activity

The Activity log lives at /admin/activity/ and appears in the Super Admin dashboard. It combines the existing administrator account and PayPal payout events with new records of administrator sign-ins, sign-outs, Admin page data requests and API changes. The log can be filtered by administrator user ID or activity type. The server requires an active Super Admin account.

## Install in cPanel

Back up the database. Upload cpanel-admin-activity-api.zip and cpanel-admin-activity-frontend.zip to your cPanel home directory.

In the existing backend .env, verify that APP_NAME is UrbanHelpHub and APP_DEBUG is false. Edit the existing entries if needed.

Paste this backend block into cPanel Terminal. It backs up the files involved, adds one audit table, and adds the two registration lines to the existing configuration.

```bash
(
  set -e
  cd "$HOME/urbanhelphub/project/backend-api"
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php

  backup=$(mktemp -d "$HOME/uhh-activity-api-backup.XXXXXX")
  cp -a --parents bootstrap/providers.php routes/api.php resources/views/welcome.blade.php "$backup/"
  echo "Backend backup saved in $backup"

  unzip -oq "$HOME/cpanel-admin-activity-api.zip" -d "$PWD"
  "$PHP85" artisan migrate --path=database/migrations/2026_11_25_000002_create_administrator_request_events.php --force

  "$PHP85" <<'PHP'
<?php
$file = 'bootstrap/providers.php';
$contents = file_get_contents($file);
$provider = '\App\Providers\AdministratorActivityServiceProvider::class';
if (!str_contains($contents, $provider)) {
    $updated = preg_replace('/^([ \t]*return[ \t]*\[)/m', "\$1\n    ".$provider.',', $contents, 1, $count);
    if ($count !== 1 || file_put_contents($file, $updated, LOCK_EX) === false) {
        fwrite(STDERR, "Could not register the activity logger.\n");
        exit(1);
    }
}
PHP
  "$PHP85" -l bootstrap/providers.php

  route_include="require __DIR__.'/administrator-activity.php';"
  if ! grep -Fqx "$route_include" routes/api.php; then
    printf '\n%s\n' "$route_include" >> routes/api.php
  fi

  "$PHP85" artisan config:cache
  "$PHP85" artisan route:clear
  "$PHP85" artisan route:list --path=api/admin/activity -vv
)
```

The route list should show GET /api/admin/activity with the Super Admin guard. After that check, paste the frontend block.

```bash
(
  set -e
  cd "$HOME/public_html"

  backup=$(mktemp -d "$HOME/uhh-activity-page-backup.XXXXXX")
  cp -a admin "$backup/"
  echo "Frontend backup saved in $backup"

  zip="$HOME/cpanel-admin-activity-frontend.zip"
  unzip -oq "$zip" '_next/*'
  unzip -oq "$zip" 'admin/*'
)
```

## Verify

1. Sign in as a normal Admin, open the Admin dashboard, and sign out.
2. Sign in as Super Admin. Open Activity log from the Admin dashboard or [open the activity page](https://urbanhelphub.com/admin/activity/) directly. Check for the normal Admin’s sign-in, dashboard request, and sign-out. Use the account’s user ID to filter.
3. Open the same activity URL as a normal Admin. The page should return the browser to the dashboard, and the activity endpoint should return HTTP 403.
4. Use the PayPal payouts filter to see any existing payout audit entries. Earlier requests that had no audit entries are unavailable.
