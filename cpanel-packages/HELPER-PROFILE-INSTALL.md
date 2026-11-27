# Helper profile editor and mobile Refresh update

The Helper dashboard's Edit profile button opens a direct editor. It offers separate saves for profile details, service area, each existing service, and availability. Service area and edited services retain their review requirements. The onboarding screens are available for a new Helper application.

Upload cpanel-helper-profile-api.zip and cpanel-helper-profile-frontend.zip to your cPanel home directory. This install leaves the current PayPal mode and credentials in place. The separate Live PayPal guide contains the cutover steps.

## Backend

```bash
(
  set -e
  cd "$HOME/urbanhelphub/project/backend-api"
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
  zip="$HOME/cpanel-helper-profile-api.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-helper-profile-api-backup.XXXXXX")
  cp -p --parents routes/api.php "$backup/"
  echo "Route backup saved in $backup"

  unzip -oq "$zip"
  route_include="require __DIR__.'/helper-profile.php';"
  if ! grep -Fqx "$route_include" routes/api.php; then
    printf '\n%s\n' "$route_include" >> routes/api.php
  fi

  "$PHP85" artisan route:clear
  "$PHP85" artisan route:list --path=api/helper/profile
)
```

The route list should show two PATCH routes, one for profile fields and one for a service.

## Website

```bash
(
  set -e
  set -o pipefail
  cd "$HOME/public_html"
  zip="$HOME/cpanel-helper-profile-frontend.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-helper-profile-page-backup.XXXXXX")
  unzip -Z1 "$zip" | while IFS= read -r path; do
    case "$path" in
      _next/*|*/) continue ;;
    esac
    if [ -f "$path" ]; then cp -p --parents "$path" "$backup/"; fi
  done
  echo "Website backup saved in $backup"

  unzip -oq "$zip" '_next/*'
  unzip -oq "$zip" -x '_next/*'
)
```

Sign in as a Helper and use Edit profile. Change the headline and check that it saves without changing the service area. On a phone, open Administrator Management and check that the Refresh button fits on one line.
