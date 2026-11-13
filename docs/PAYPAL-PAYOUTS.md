> Current 40/60 update and Connected Path Live blocker: read [PAYPAL-40-60-RELEASE.md](PAYPAL-40-60-RELEASE.md) first. This document describes the existing direct Checkout/Payouts adapter.

# Customer payments and admin-approved helper payouts

Complete source branch: `feature/paypal-admin-approved-payouts`. This extends the PayPal checkout source at `827589c`; it includes checkout plus automatic transfers after admin approval. Nothing has been deployed, no real transfers were submitted and no Live setting was enabled.

## Business flow

1. The helper marks work complete. The customer confirms completion.
2. The existing completion flow records the service subtotal, a **40% platform commission** and a pending **60% helper payout**. It creates no duplicate payment. The customer approves PayPal Checkout; a verified backend capture/webhook must confirm collection.
3. Once both job completion and collection are confirmed, an active administrator receives one **Helper payout awaiting approval** dashboard notification linked to `/admin#payments`. Job confirmation without payment is not payout authorization.
4. The helper saves a receiving PayPal email in the helper dashboard, confirming their UrbanHelpHub password. Storage is encrypted with Laravel's APP_KEY, separate from serialized user data. This verifies control of the UrbanHelpHub account, not ownership or eligibility of the receiving PayPal account; the helper and admin must check the address.
5. The admin reviews the recipient, recorded commission and helper net, then clicks **Approve and send 60%** and confirms. A changed account version requires a reload/review. The original approved recipient cannot be redirected by later account edits.
6. The backend commits approver, approval time and an immutable sender batch reference before submitting a one-recipient PayPal Payouts request. No customer/helper endpoint can approve a payout, and the legacy manual status endpoint cannot bypass PayPal confirmation.
7. Processing and unclaimed items remain unpaid. Only the individual item's verified `SUCCESS` status marks it paid and notifies the helper/admin. A batch-level success alone is insufficient.

Example: a CAD 100.00 service subtotal records CAD 40.00 platform commission and CAD 60.00 helper earnings. Commission is rounded to cents; the helper receives the remainder so the two always total the subtotal. Taxes, if introduced, are outside this split. PayPal checkout/payout fees are borne by the platform, not silently deducted from the helper's gross share. The platform's recorded gross commission is not its profit after fees. Available merchant payout balance is required.

New completion records snapshot `commission_percent=40`; the old Stripe fee environment variable remains but does not override this new split. Existing amounts and 30% snapshots remain valid under their recorded split; legacy null snapshots use 30% validation. Inconsistent/unknown snapshots require accounting review.

## PayPal setup — Sandbox first

PayPal must enable Payouts for your business/app and approve the marketplace model. A Checkout app alone does not establish Payouts access. Confirm Canadian availability, supported receiving countries/currencies, account verification, funding and fees with PayPal. Do not send real customer funds until this is approved.

Keep the original server-only PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID, PAYPAL_MERCHANT_ID and PAYPAL_CURRENCY settings. Add these switches privately:

```dotenv
PAYPAL_MODE=sandbox
PAYPAL_PAYOUTS_ENABLED=true
PAYPAL_LIVE_PAYOUTS_ENABLED=false
APP_DEBUG=false
```

Both new switches default to **false** in source. Enable the first only in an isolated Sandbox deployment with Payouts access. No account credentials belong in GitHub, frontend files, screenshots or logs. Preserve APP_KEY: changing it makes stored payout recipients unreadable.

Use Sandbox helper accounts for test recipient emails. Fund the Sandbox business balance as needed. The app submits payments from the platform's PayPal account; it does not instruct Checkout to distribute funds or operate an escrow account.

## Routes and webhook subscriptions

All routes are under the existing Sanctum authentication; admin routes also require an active administrator:

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/helper/paypal/payout-account` | Current active helper's payout email only; no-store |
| PUT | `/api/helper/paypal/payout-account` | Save own email with current password; rate limited |
| POST | `/api/admin/payouts/{payoutId}/approve-paypal` | Approve and submit the recorded helper share; requires the reviewed `account_version` from admin payment results |
| POST | `/api/admin/payouts/{payoutId}/reconcile-paypal` | Check/reconcile the existing approved transfer; never creates a new approval |

The existing authenticated `GET /api/admin/payments` includes recipient, account version, approval audit fields, provider state and recorded commission/helper amounts. It does not expose encrypted storage values. Browser-supplied amounts/recipients are not used to send funds.

The shared, signature-verified webhook remains:

`POST https://api.urbanhelphub.com/api/paypal/webhook`

Use the equivalent isolated staging backend URL during Sandbox testing. Add the app's available **PAYMENT.PAYOUTSBATCH.*** and **PAYMENT.PAYOUTS-ITEM.*** events, including batch SUCCESS/DENIED/PROCESSING and item SUCCEEDED/FAILED/UNCLAIMED/RETURNED/REFUNDED/BLOCKED/HELD/CANCELED/DENIED where offered, alongside the existing checkout/refund/dispute subscriptions. The handler retrieves the current batch, verifies its persisted sender reference, individual recipient, amount, currency and item ID, and commits updates together with the unique event ledger. It does not trust webhook transaction status alone.

## Retries and reconciliation

An interrupted submission reuses the **same** sender_batch_id and PayPal-Request-Id. A duplicate-batch response may resolve to its existing batch, which is retrieved and validated. It never generates a fresh transfer to work around an uncertain result. Unknown submissions older than 29 days stop for manual reconciliation rather than exceed PayPal's sender-batch duplicate-protection window. Do not clear IDs or approval fields.

Known transfers are reconciled through provider reads; unresolved approved submissions can retry the original idempotent submission while still eligible. Refunds, reversals, open disputes, mismatched accounting/currency, stale recipients, wrong environment or previously paid payouts block initial sending. Current PayPal capture status is checked before approval/submission as well as stored state.

A failed, returned, refunded, blocked or unclaimed transfer is not treated as successful. The admin can inspect the existing transfer, but this version deliberately does not create a replacement transfer automatically. Resolve the existing transfer with PayPal before designing a new authorized attempt. Funds already sent cannot be clawed back by changing database status. A refund or dispute after approval alerts admins for reconciliation; it does not automatically reverse a completed payout.

Background reconciliation is registered every minute through Laravel's scheduler with an overlap lock. It only processes previously approved processing/unclaimed transfers; it never approves pending payouts. The admin's initial submission is immediate and does not require a queue worker. Configure this cPanel cron only after an authorized deployment:

```sh
* * * * * cd /home/YOUR_CPANEL_USER/urbanhelphub/project/backend-api && /opt/cpanel/ea-php85/root/usr/bin/php artisan schedule:run >> /home/YOUR_CPANEL_USER/logs/urbanhelphub-scheduler.log 2>&1
```

Replace YOUR_CPANEL_USER with your actual username, ensure the private logs directory exists, and restrict/rotate logs. Do not add duplicate scheduler entries. The command itself is:

```sh
/opt/cpanel/ea-php85/root/usr/bin/php artisan paypal:payouts-reconcile
```

## Database and deployment reference

First compare a fresh cPanel export with the prepared source and back up database/files privately. That production comparison remains outstanding. Use an isolated staging backend/database and a frontend pointed to that API; never run Sandbox payouts against production data.

Apply both additive migrations when starting from `nodejs-migration`; apply only the new one if the PayPal checkout migration is already installed. No Composer runtime dependency is added. Preserve `.env`, APP_KEY, storage/uploads, existing credentials and payment records. Check pending migrations before running them.

```sh
cd "$HOME/urbanhelphub/project/backend-api"
/opt/cpanel/ea-php85/root/usr/bin/php -v
/opt/cpanel/ea-php85/root/usr/bin/php artisan optimize:clear
# Only if the original PayPal migration is not yet installed:
/opt/cpanel/ea-php85/root/usr/bin/php artisan migrate --path=database/migrations/2026_11_03_211434_add_paypal_checkout_tracking.php --force
/opt/cpanel/ea-php85/root/usr/bin/php artisan migrate --path=database/migrations/2026_11_04_135453_add_admin_approved_paypal_payouts.php --force
/opt/cpanel/ea-php85/root/usr/bin/php artisan config:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan route:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan view:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan route:list --path=paypal
```

These are instructions, not commands executed on your hosting. The new migration adds an encrypted helper-account table, nullable payment commission snapshot and payout approval/provider-tracking fields; it deletes no existing transaction data. Do not roll back tracking migrations after payment activity. A source rollback must retain provider references and reconcile already-authorized transfers.

Publish reviewed prepared `frontend/public_html/` changes only after backend/migration readiness, adding versioned assets before updated pages and retaining old assets. The cPanel frontend remains a static export; no Node server is required. Editable modules are under `frontend/static-maintenance/editable-static-modules/`. Do not overwrite live hosting configuration or unrelated sites.

## Sandbox acceptance checklist

- [ ] Provider Payouts approval, Sandbox credentials, matching merchant/webhook IDs and funded balance.
- [ ] New helper email/password form saves only the signed-in helper's recipient; admin sees/reviews the intended address.
- [ ] Customer completion records 40/60; no transfer occurs on completion or capture alone.
- [ ] Verified collection sends one admin eligibility notification and creates no duplicate payment.
- [ ] Admin approves a genuine Sandbox transfer; inspect the real batch/item response and receiving Sandbox account.
- [ ] PENDING/UNCLAIMED is not paid; individual SUCCESS marks paid once and notifies helper/admin.
- [ ] Real signed webhook resend, missed webhook recovery through cron and duplicate admin clicks produce one transfer.
- [ ] Simulate lost responses, missing funding, blocked/incorrect recipient, refund/dispute before release, provider-returned funds and changed helper details.
- [ ] Verify concurrent approval/capture/webhook transactions on the target MySQL database and PHP 8.5 host. Local tests use PHP 8.4 and SQLite, not a MySQL concurrency/load test.
- [ ] Check mobile/desktop popup and form behavior and provider-specific country/currency restrictions.

## Live activation — separate and not performed

After all Sandbox tests and provider business approval, use distinct Live client credentials, merchant/webhook IDs and the reviewed Live endpoint. For a separately approved direct Checkout/Payouts model only, Live sending additionally requires PAYPAL_LIVE_DIRECT_MODEL_APPROVED=true. Connected Path-only approval is insufficient. The other required gates are: PAYPAL_MODE=live, PAYPAL_PAYOUTS_ENABLED=true and PAYPAL_LIVE_PAYOUTS_ENABLED=true. Refresh Laravel config cache. Sandbox payments/payouts cannot be reused in Live; mode checks reject them. Perform only an explicitly authorized low-value Live test, inspect settlement/fees/refund behavior and monitor before wider availability.

Automated/mock checks do not establish real PayPal account eligibility or successful transfer. Source is prepared and tested locally; real Sandbox and hosting verification are still required. See `PAYPAL-PAYOUTS-VALIDATION.md` and `PAYPAL-PAYOUTS-CHANGED-FILES.md`.
