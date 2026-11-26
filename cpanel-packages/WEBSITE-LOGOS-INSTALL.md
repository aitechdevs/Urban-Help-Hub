# UrbanHelpHub website logos

The update adds the existing logo to Administrator Management, Activity log, Helper review, both Messages pages, the task confirmation, and the 404 and offline pages. The separate API landing-page package also adds the logo to that page.

## Update the website

Upload cpanel-website-logos.zip to your cPanel home directory. Paste this block into cPanel Terminal.

```bash
(
  set -e
  cd "$HOME/public_html"
  backup=$(mktemp -d "$HOME/uhh-site-logo-backup.XXXXXX")
  for path in admin/activity admin/administrators admin/helpers helper/messages messages post-a-task 404 404.html _not-found offline.html sw.js UrbanHelpHub-logo.png icons; do
    if [ -e "$path" ]; then
      cp -a --parents "$path" "$backup/"
    fi
  done
  echo "Website backup saved in $backup"

  zip="$HOME/cpanel-website-logos.zip"
  unzip -tq "$zip"
  unzip -oq "$zip" '_next/*'
  unzip -oq "$zip" -x '_next/*'
)
```

Open /admin/administrators/ and /admin/activity/ as Super Admin. Press Ctrl+Shift+R once if a page is still open from before the update. Both pages should show the UrbanHelpHub logo in a white header.

## Update the API landing page

Upload cpanel-api-landing-logo.zip to your cPanel home directory. Paste this block into cPanel Terminal after the website update.

```bash
(
  set -e
  cd "$HOME/urbanhelphub/project/backend-api"
  backup=$(mktemp -d "$HOME/uhh-api-logo-backup.XXXXXX")
  cp -p resources/views/welcome.blade.php "$backup/"
  echo "Landing page backup saved in $backup"

  unzip -oq "$HOME/cpanel-api-landing-logo.zip" -d "$PWD"
  /opt/cpanel/ea-php85/root/usr/bin/php artisan view:clear
)
```
