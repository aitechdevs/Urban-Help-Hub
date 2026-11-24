# Urban Help Hub PayPal-only update

## cPanel

Back up the existing backend and database. From the backend directory, unpack the latest ZIP with `unzip -n` to supply any missing files. If the previously supplied backend ZIP is already installed, replace only the five updated files below. The deployment ZIP deliberately excludes Composer files to preserve cPanel-specific dependencies. Remove the retired package separately through Composer when you know which Composer runs under PHP 8.5. The source patch already removes it from the manifest and lockfile.

```bash
cd ~/urbanhelphub/project/backend-api
PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
unzip -n ./cpanel-backend-overlay.zip
unzip -o ./cpanel-backend-overlay.zip \
  routes/api.php config/services.php \
  app/Http/Controllers/AdminController.php \
  app/Http/Controllers/MarketplaceController.php \
  app/Http/Controllers/PayPalPaymentController.php
```

The removed classes can be moved into the backend backup after the route check. Paths are relative to the Laravel backend.

- `app/Http/Controllers/StripeConnectController.php`
- `app/Http/Controllers/StripePaymentController.php`
- `app/Services/StripeClient.php`

Keep the existing `.env`, APP_KEY, database and storage. This update adds no migration to the previously delivered consolidated release. The original migrations and historical records are preserved, including protection against recharging historical payments with a prior checkout session.

```bash
"$PHP85" artisan route:clear &&
  "$PHP85" artisan config:cache &&
  "$PHP85" artisan route:list --path=customer/payments
```

Check the service categories API, extract the fresh frontend into `public_html` while preserving `.htaccess`, then run the CA$100 Sandbox test. If any step fails, pause before the next one.

## GitHub source

The complete source patch is based on feature/uhh-static-release at commit 5032c35. Check the patch against a clean checkout of that base with `git apply --check uhh-paypal-only-source.patch` before applying and reviewing it. The branch containing these download packages is a delivery branch. Merge the reviewed source changes through your regular GitHub workflow.
