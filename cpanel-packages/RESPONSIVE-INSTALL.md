# UrbanHelpHub responsive website update

This update includes the current static website export. The backend and database do not need to be updated for this release.

Upload cpanel-responsive-frontend.zip to your cPanel home directory and paste the block below into cPanel Terminal. Existing website files being replaced are backed up first. The new versioned assets are installed before the pages that refer to them.

```bash
(
  set -e
  set -o pipefail
  cd "$HOME/public_html"
  zip="$HOME/cpanel-responsive-frontend.zip"
  unzip -tq "$zip"

  backup=$(mktemp -d "$HOME/uhh-responsive-backup.XXXXXX")
  unzip -Z1 "$zip" | while IFS= read -r path; do
    case "$path" in
      _next/*|*/) continue ;;
    esac
    if [ -f "$path" ]; then cp -p --parents "$path" "$backup/"; fi
  done
  echo "Website backup saved in $backup"

  unzip -oq "$zip" '_next/*'
  unzip -oq "$zip" -x '_next/*'
  echo "Responsive website files installed."
)
```

On a phone, reload the Admin dashboard and open **Tasks** from the menu. Check that long URLs wrap within the task card and that the page only scrolls vertically. Open **Payments** and check the release controls. On a tablet, check that the Admin menu is available when the sidebar is hidden. If the phone still shows the old layout, open the dashboard in a new private tab to check the newest files.
