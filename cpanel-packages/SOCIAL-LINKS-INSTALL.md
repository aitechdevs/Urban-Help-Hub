# UrbanHelpHub social link list update

This update builds on the existing **Super Admin → Settings** installation. It uses the same settings record, including any profiles and icons you already saved. Upload both ZIP files to your cPanel home folder, then run this block in cPanel Terminal.

```bash
(
  set -eu
  PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
  api_zip="$HOME/cpanel-social-links-api.zip"
  frontend_zip="$HOME/cpanel-social-links-frontend.zip"
  unzip -tq "$api_zip"
  unzip -tq "$frontend_zip"

  backup=$(mktemp -d "$HOME/uhh-social-links-backup.XXXXXX")
  cd "$HOME/urbanhelphub/project/backend-api"
  controller=app/Http/Controllers/PlatformSettingsController.php
  cp -p "$controller" "$backup/PlatformSettingsController.php"
  unzip -p "$api_zip" "$controller" > "$backup/PlatformSettingsController.updated.php"
  "$PHP85" -l "$backup/PlatformSettingsController.updated.php"
  cp "$backup/PlatformSettingsController.updated.php" "$controller"

  cd "$HOME/public_html"
  cp -a admin/settings "$backup/settings"
  unzip -oq "$frontend_zip" '_next/*'
  unzip -oq "$frontend_zip" 'admin/settings/*'
  echo "Original files backed up in $backup"
)
```

Open **Super Admin → Settings**. Your links start collapsed. Select a row to edit its label, URL, or icon. Opening another row closes the previous one and keeps your unsaved edits. Select **Add social link** to create a profile and **Save settings** to publish your changes. The update removes the 12-link cap. Very large batches of custom icons are subject to your hosting provider's upload size limit.
