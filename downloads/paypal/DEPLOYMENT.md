# UrbanHelpHub — static cPanel frontend and PayPal API

The frontend is a Next.js static export served from `public_html`. Only the Laravel API needs a PHP runtime. Build the frontend from `web-app` source; do not edit generated JavaScript or reuse the old patched `_next` directory.

## Payment rules

Customers approve a fixed quote and choose either 50% before work starts or 100% upfront. Odd-cent deposits round up so the commitment is never below 50%. A customer who starts a deposit order finishes that plan; they can pay its remaining balance any time after the deposit. The helper receives 60% of the agreed total, rounded to cents. The platform retains 40% and absorbs PayPal collection fees, payout fees and reviewed taxes from its share. No fees or taxes are deducted from the helper's earnings.

Helpers cannot start work without a verified commitment. Even with 100% upfront, earnings stay held until the helper completes the job, the customer confirms completion, full payment is verified and an active administrator authorizes release. A payout becomes paid only after PayPal reports SUCCESS. Disputes and reversals block payment release. An uncertain payout submission must be reconciled in PayPal; never create another payout to bypass the submission guard.

## Prepare and update the API

1. Back up the current backend, database and `public_html`. Keep the current backend `.env`, `APP_KEY`, database, uploaded documents and `storage` contents. Do not copy production credentials from uploaded archives.
2. Upload the contents of `backend-api` to the existing Laravel application directory, outside `public_html`. Keep the API subdomain document root pointed at its `public` directory. The old repository-root Stripe overlay is retired; use `backend-api` only.
3. In cPanel Terminal, from the directory containing `artisan`, run:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
php artisan optimize:clear
php artisan migrate --force --no-interaction
php artisan storage:link
```

Run `storage:link` only if `public/storage` is missing. Never run `migrate:fresh`, replace the production database, or generate a new key for an existing installation.

4. Merge these values into the existing backend `.env`, entering credentials securely in cPanel:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.urbanhelphub.com
FRONTEND_URL=https://urbanhelphub.com
FRONTEND_URLS=https://urbanhelphub.com,https://www.urbanhelphub.com
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MERCHANT_ID=
PAYPAL_WEBHOOK_ID=
```

Use sandbox credentials and `PAYPAL_MODE=sandbox` in a separate staging installation first. The client ID and secret must belong to the same PayPal app and environment. The merchant ID must identify the platform's receiving account. Enable PayPal Payouts on that account. Helpers save their PayPal recipient email in their dashboard.

5. Register `https://api.urbanhelphub.com/api/paypal/webhook` in the matching PayPal app. Subscribe to capture completed, refunded and reversed events; dispute created events; and payout-item success, failure, returned, refunded, reversed, blocked, canceled, denied, held and unclaimed events available in the PayPal dashboard. Set the webhook ID in `.env`. The API verifies signatures through PayPal and reads authoritative order/capture/payout data.
6. Run `php artisan config:cache` and restart queue workers with `php artisan queue:restart`. Keep the existing queue worker configuration. Approval email delivery is scheduled every minute through `php artisan approvals:send-emails --limit=20`. Preserve the SMTP settings and unrelated cron jobs, and ensure one cPanel cron runs `cd /path/to/backend-api && php artisan schedule:run` every minute. Avoid adding a second copy if that scheduler cron already exists.
7. Check `/up` and `/api/service-categories` on the API subdomain. Confirm CORS permits both frontend hostnames.

## Rebuild and upload the frontend

Use Node.js 20.9 or newer (validated with Node.js 24). From `web-app`:

```bash
npm ci
NEXT_PUBLIC_API_URL=https://api.urbanhelphub.com/api npm run build
```

Upload **all contents of `web-app/out/`** directly into `public_html`, including `.htaccess`, HTML pages, the new `_next` directory, and public resources. The supplied `public_html-paypal.zip` contains that complete export with files at the ZIP root. Do not upload only `_next`; HTML and JavaScript must come from the same build. Do not run a Node application for this static frontend. No PayPal secret belongs in frontend files.

Use a clean staged frontend directory and switch it into service after review. Retain unrelated cPanel files, SSL verification directories, hosted email configuration and user uploads. Replace the old frontend's generated HTML, `_next` and `assets` together; stale Stripe scripts from the previous build must not remain referenced or be mixed with the new build. The original hand-patched `assets/password-recovery*` and `assets/uhh-account*` scripts are replaced by source-built React pages. The archive's PHP configuration files are not part of the new frontend.

The exported `.htaccess` preserves `/admin/helpers/123/` links by redirecting to `/admin/helper/?id=123`. Merge that rule and the static DirectoryIndex setting with any existing HTTPS or canonical-host rules; preserve unrelated hosting rules. Remove any catch-all that sends exported routes to a Node app or old PHP frontend. Purge CDN/browser caches after switching the complete build.

## Verify before enabling live payments

- Open homepage, registration/login, customer/helper dashboards and service pages; verify country/language selection, messages, profile approvals, password recovery, task editing, documents, reviews and WhatsApp support access.
- In sandbox, confirm an agreed quote, verify work is blocked before a 50% deposit, complete both the deposit/balance and 100%-upfront flows, and confirm that full upfront payment alone does not release helper earnings.
- Have the customer confirm completion. In admin finance, review absorbed tax and customer completion, then release the payout. Refresh its PayPal status; verify the helper receives 60% and that PayPal fees/taxes reduce only the platform's 40%.
- Verify signed webhooks, refunds/disputes and duplicate submissions. No Stripe endpoints are registered. Historical Stripe columns/records are retained; this change does not convert or refund legacy transactions automatically.

Automated checks use mocked PayPal responses; they do not prove live account credentials, webhook delivery or Payouts activation. PayPal checkout supports only the two-decimal currencies listed in `TaskPayments::CURRENCIES` with a configured CAD reporting rate. Existing country/language display remains available, but unsupported transaction currencies are rejected before a booking is confirmed; no exchange rate or payment conversion is silently invented.
