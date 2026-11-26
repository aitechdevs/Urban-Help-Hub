# UrbanHelpHub email confirmation

New Customers and Helpers receive a branded confirmation email after registration. Administrator accounts created in Administrator Management also receive a confirmation email. Those accounts must still be activated by a Super Admin. The account holder opens the email link, confirms the address, and signs in to the dashboard for their role. Links expire in 24 hours. Existing accounts retain their current sign-in flow.

## Install the backend

Back up the database. Upload cpanel-email-confirmation-api.zip and cpanel-email-confirmation-frontend.zip to your cPanel home directory. Keep the existing mail settings and email cron.

```bash
(
  set -e
  set -o pipefail
  cd "$HOME/urbanhelphub/project/backend-api"
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
  zip="$HOME/cpanel-email-confirmation-api.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-email-confirmation-api-backup.XXXXXX")
  cp -p --parents routes/api.php "$backup/"
  unzip -Z1 "$zip" | while IFS= read -r file; do
    if [ -f "$file" ]; then cp -p --parents "$file" "$backup/"; fi
  done
  echo "Backend backup saved in $backup"

  migration=database/migrations/2026_11_26_000001_create_account_email_confirmations.php
  unzip -oq "$zip" "$migration"
  "$PHP85" artisan migrate --path="$migration" --force
  unzip -oq "$zip"

  route_include="require __DIR__.'/account-email-confirmation.php';"
  if ! grep -Fqx "$route_include" routes/api.php; then
    printf '\n%s\n' "$route_include" >> routes/api.php
  fi

  "$PHP85" artisan route:clear
  "$PHP85" artisan route:list --path=api/auth/email
  "$PHP85" artisan approvals:send-emails --check
)
```

The route list should show POST routes for confirm and resend. The mailer check does not send email.

## Install the website

```bash
(
  set -e
  cd "$HOME/public_html"
  zip="$HOME/cpanel-email-confirmation-frontend.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-email-confirmation-page-backup.XXXXXX")
  for path in login register confirm-email admin/administrators; do
    if [ -e "$path" ]; then cp -a --parents "$path" "$backup/"; fi
  done
  echo "Website backup saved in $backup"

  unzip -oq "$zip" '_next/*'
  unzip -oq "$zip" -x '_next/*'
)
```

## Verify with a test account

1. Register a new Customer or Helper with an inbox you control. The website should ask you to check your email and should require confirmation before sign-in.
2. Wait for the existing email worker. Open the branded email and select Confirm email address. The website should take you to sign-in.
3. Sign in and confirm that the correct dashboard opens. Reopen the original confirmation link to verify it cannot be reused.

## Newly provisioned Super Admin accounts

Use the existing server-side Super Admin provisioning procedure. To require email confirmation for a newly provisioned active Super Admin, queue the confirmation immediately after provisioning. This enrolls the account and revokes any API sign-in tokens issued before enrollment.

```bash
cd "$HOME/urbanhelphub/project/backend-api"
read -rp 'New Super Admin email: ' admin_email
/opt/cpanel/ea-php85/root/usr/bin/php artisan accounts:confirm-super-admin-email "$admin_email"
```
