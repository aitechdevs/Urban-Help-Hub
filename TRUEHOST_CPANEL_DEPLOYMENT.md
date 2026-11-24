# Urban Help Hub cPanel release

This guide applies to the current Laravel API in `urbanhelphub/project/backend-api` and the Next.js static export in `public_html`. The API domain points to the Laravel project's `public` directory. The frontend requires Node.js only at build time.

## Update the existing test site

1. Back up the database, Laravel source and public files outside the web root. Use PHP 8.5 for this cPanel installation. Preserve the Laravel environment, application key, storage and existing provider records.
2. Upload the current backend overlay outside `public_html`. Extract it into a temporary directory and compare any server-specific differences before replacing the deployed files with this release's versions. Use the removal list in the accompanying release notes to retire the previous integration's source files.
3. Run Laravel commands from the backend directory.

   ```bash
   PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
   "$PHP85" artisan config:clear
   "$PHP85" artisan route:clear
   "$PHP85" artisan migrate:status
   "$PHP85" artisan migrate --force
   "$PHP85" artisan config:cache
   "$PHP85" artisan route:list --path=customer/payments
   ```

4. Verify HTTPS access to `/api/service-categories` and verify the PayPal capture and checkout routes. Configure only the Sandbox merchant and webhook for this test release. Use `PAYPAL_MODE=sandbox`, `PAYPAL_PAYOUTS_ENABLED=true` and the verified Sandbox webhook for `/api/paypal/webhook`.
5. Build in `web-app` with `NEXT_PUBLIC_API_URL=https://api.urbanhelphub.com/api npm run build -- --webpack`. Upload the contents of `out/` directly into `public_html`, preserving the hosting rules and unrelated directories.
6. Verify the CA$100 booking. Pay CA$50 before starting work, confirm completion, pay the CA$50 balance and approve the CA$60 helper payout. Verify the payout with PayPal and confirm the CA$40 gross platform share.

Keep the previously deployed version available until the checks pass. During a code rollback, keep additive payment tables in place to preserve history.
