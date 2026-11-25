# Administrator management update

The account management page requires the matching Laravel API and static export. The Laravel update adds its own route file and audit table. The frontend ZIP contains the administrator management page and its versioned Next.js assets.

## Install in cPanel

Back up the database using cPanel. Upload both ZIPs to your cPanel home directory. Run these blocks in order. Each block stops if a command fails.

```bash
(
  set -e
  cd "$HOME/urbanhelphub/project/backend-api"
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
  backup=$(mktemp -d "$HOME/uhh-admin-api-backup.XXXXXX")
  cp -p routes/api.php "$backup/"
  printf 'API route backup saved in %s\n' "$backup"
  unzip -oq "$HOME/cpanel-administrator-api.zip" -d "$PWD"
  "$PHP85" artisan migrate --path=database/migrations/2026_11_25_000001_create_administrator_audit_events.php --force
  route_include="require __DIR__.'/administrator-management.php';"
  if ! grep -Fqx "$route_include" routes/api.php; then
    printf '\n%s\n' "$route_include" >> routes/api.php
  fi
  "$PHP85" artisan route:clear
  "$PHP85" artisan route:list --path=api/admin/administrators
)
```

The route list should show GET, POST and PUT. The public API should return HTTP 401 for an unauthenticated request.

```bash
curl -sS -o /dev/null -w '%{http_code}\n' \
  -H 'Accept: application/json' https://api.urbanhelphub.com/api/admin/administrators
```

```bash
(
  set -e
  cd "$HOME/public_html"
  backup=$(mktemp -d "$HOME/uhh-admin-page-backup.XXXXXX")
  if [ -d admin/administrators ]; then
    cp -a admin/administrators "$backup/"
  fi
  printf 'Administrator page backup saved in %s\n' "$backup"
  unzip -oq "$HOME/cpanel-administrator-page.zip" -d "$PWD"
)
```

## Verify on hosting

1. As Super Admin, reload [Administrator management](https://urbanhelphub.com/admin/administrators/). Check that the existing accounts load.
2. Create a dedicated test Admin using your current Super Admin password. Confirm that it appears as Suspended and cannot sign in.
3. Activate the test Admin. Sign in as that account in another browser profile, confirm access to the Admin dashboard, and check that visiting Administrator management returns you to the dashboard. The Laravel tests independently confirm HTTP 403 for direct account-management GET, POST, and PUT requests by a normal Admin.
4. Suspend the test Admin. Check that the account can no longer sign in and that the activity section lists creation, activation, and suspension with the Super Admin's name and timestamp.

## Inspect the existing payout audit

For the settled Sandbox task #8, find the internal payout ID and then print its recorded actions. These commands only read data.

```bash
cd "$HOME/urbanhelphub/project/backend-api"
PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
"$PHP85" artisan tinker --execute='dump(\Illuminate\Support\Facades\DB::table("payouts")->where("task_id", 8)->pluck("id")->all());'
read -rp 'Enter the payout ID shown above: ' payout_id
"$PHP85" artisan paypal:payout-audit "$payout_id"
```

Audit entries are present for actions performed after the payout audit update. The local automated tests confirm actor user ID and role for release, submission, and refresh for both administrator roles.
