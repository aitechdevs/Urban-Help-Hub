# UrbanHelpHub platform settings and test account cleanup

Upload both ZIP files to your cPanel home directory (the folder containing `public_html`). Run the backend block first in cPanel Terminal.

```bash
(
  set -eu
  cd "$HOME/urbanhelphub/project/backend-api"
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
  zip="$HOME/cpanel-platform-settings-api.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-platform-api-backup.XXXXXX")
  unzip -Z1 "$zip" | while IFS= read -r path; do
    if [ -f "$path" ]; then cp -p --parents "$path" "$backup/"; fi
  done
  cp -p --parents routes/api.php "$backup/"
  echo "Backend files backed up in $backup"

  unzip -oq "$zip"
  "$PHP85" artisan migrate --path=database/migrations/2026_11_27_000001_create_platform_settings.php --force

  route_include="require __DIR__.'/platform-settings.php';"
  if ! grep -Fqx "$route_include" routes/api.php; then
    printf '\n%s\n' "$route_include" >> routes/api.php
  fi

  "$PHP85" artisan route:clear
  "$PHP85" artisan route:list --path=platform-settings -vv
  "$PHP85" artisan help marketplace:clear-test-accounts
)
```

Run the frontend block after the backend reports three settings routes and shows the cleanup command help.

```bash
(
  set -eu
  cd "$HOME/public_html"
  zip="$HOME/cpanel-platform-settings-frontend.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-platform-pages-backup.XXXXXX")
  unzip -Z1 "$zip" | while IFS= read -r path; do
    case "$path" in
      _next/*|*/) continue ;;
    esac
    if [ -f "$path" ]; then cp -p --parents "$path" "$backup/"; fi
  done
  echo "Website files backed up in $backup"

  unzip -oq "$zip" '_next/*'
  unzip -oq "$zip" -x '_next/*'
)
```

Sign in as Super Admin, open **Admin dashboard → Settings**, and enter the public details and profile links you want displayed. Select a built-in icon or upload a PNG or WebP up to 32 KB and 512 × 512 pixels. Select **Save settings**, then reopen the home page to check the links. The helper onboarding page and the Customer and Helper dashboards also show them in their footers.

## Remove selected test accounts

Export the production database in cPanel before using `--apply`. Keep the export private, outside `public_html`. Run the cleanup during a quiet window so nobody is using the selected test accounts.

List the Customer and Helper accounts with their IDs.

```bash
cd "$HOME/urbanhelphub/project/backend-api"
PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
"$PHP85" artisan marketplace:clear-test-accounts
```

Replace the example IDs `12 15` with the IDs you recognize as test accounts. Include both parties if they shared test bookings or Sandbox payments. Review the preview before continuing.

```bash
"$PHP85" artisan marketplace:clear-test-accounts 12 15
```

Once you have a database export and the preview matches your selection, use the same IDs and confirm the prompt.

```bash
"$PHP85" artisan marketplace:clear-test-accounts 12 15 --apply
```

The command removes selected accounts and eligible linked database rows in one transaction. It preserves Super Admins, Admins, and their audit events. A selection containing either administrator role, Live or unclassified financial records, or protected activity shared with accounts outside the selection is blocked. If the preview blocks a selection, keep those records for review.
