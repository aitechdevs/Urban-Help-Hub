# UrbanHelpHub notification links and branded email

This update sends a branded email on new Admin and Super Admin decisions that affect a Helper or Customer. It uses the existing email outbox and mail worker. Notification entries are links. If an older entry includes a record ID, the link opens that task, conversation, review, or payout. Entries whose records are no longer available open the relevant section.

## Install the backend

Back up the database. Upload cpanel-notification-email-api.zip and cpanel-notification-links-frontend.zip to your cPanel home directory.

```bash
(
  set -e
  cd "$HOME/urbanhelphub/project/backend-api"
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
  zip="$HOME/cpanel-notification-email-api.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-notifications-api-backup.XXXXXX")
  cp -a --parents bootstrap/providers.php routes/api.php "$backup/"
  unzip -Z1 "$zip" | while IFS= read -r file; do
    if [ -f "$file" ]; then cp -a --parents "$file" "$backup/"; fi
  done
  echo "Backend backup saved in $backup"

  unzip -oq "$zip" -d "$PWD"
  "$PHP85" artisan migrate --path=database/migrations/2026_10_17_000003_create_approval_email_outbox_table.php --force

  "$PHP85" <<'PHP'
<?php
$file = 'bootstrap/providers.php';
$contents = file_get_contents($file);
$provider = 'BrandedMailServiceProvider::class';
if (!str_contains($contents, $provider)) {
    $replacement = "\$1\n    \\App\\Providers\\BrandedMailServiceProvider::class,";
    $updated = preg_replace('/^([ \t]*return[ \t]*\[)/m', $replacement, $contents, 1, $count);
    if ($count !== 1 || file_put_contents($file, $updated, LOCK_EX) === false) {
        fwrite(STDERR, "Could not register the email branding provider.\n");
        exit(1);
    }
}
PHP
  "$PHP85" -l bootstrap/providers.php

  route_include="require __DIR__.'/administrator-notifications.php';"
  if ! grep -Fqx "$route_include" routes/api.php; then
    printf '\n%s\n' "$route_include" >> routes/api.php
  fi

  "$PHP85" artisan config:cache
  "$PHP85" artisan route:clear
  "$PHP85" artisan route:list --path=api/admin/helpers -vv
  "$PHP85" artisan approvals:send-emails --check
)
```

Look for NotifyAdministratorDecision on the four Helper decision routes. The email check validates the configured mailer without sending any mail. If the check reports that the mailer is set to log or array, email delivery requires the existing SMTP or sendmail settings in the backend .env. Keep one copy of the existing approvals:send-emails cron. If it is absent, use this command in cPanel Cron Jobs every ten minutes.

```text
/opt/cpanel/ea-php85/root/usr/bin/php "$HOME/urbanhelphub/project/backend-api/artisan" approvals:send-emails --limit=20 >/dev/null 2>&1
```

## Install the website

```bash
(
  set -e
  cd "$HOME/public_html"
  zip="$HOME/cpanel-notification-links-frontend.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-notifications-page-backup.XXXXXX")
  for path in admin dashboard helper/dashboard helper/messages messages login customer/profile; do
    if [ -e "$path" ]; then cp -a --parents "$path" "$backup/"; fi
  done
  echo "Website backup saved in $backup"

  unzip -oq "$zip" '_next/*' 'assets/*'
  unzip -oq "$zip" -x '_next/*' 'assets/*'
)
```

## Verify with test accounts

1. Review a test Helper document or test Customer task as Admin or Super Admin.
2. Open the test account's notification bell and click the entry. The relevant document or task should be in view. Test a message link separately and confirm it selects the corresponding conversation.
3. After the existing cron has run, check the test inbox for the UrbanHelpHub logo and link. Open the link and sign in to confirm it returns to the same record.
4. Use a phone-width browser to check that the notification bell remains visible.
