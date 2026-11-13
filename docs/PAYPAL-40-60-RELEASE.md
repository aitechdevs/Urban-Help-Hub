# UrbanHelpHub 40% / helper 60% release

Source branch: `feature/paypal-40-60-split`, based on `cab9f98`.

## What changed

New payments created by customer completion confirmation record **40% platform commission and 60% helper gross earnings**, on the service subtotal. A CAD 100.00 subtotal records CAD 40.00 commission and CAD 60.00 helper gross payout. Existing payment/payout amounts, provider IDs, approvals and commission snapshots are not rewritten. An unfinished job without a payment record uses the current rate when its payment is created; confirm applicable contractual terms before rollout.

Payout eligibility validates the record's own commission snapshot, not today's global rate. Supported snapshots are historical 30% and new 40%. Legacy null snapshots retain the earlier 30% validation; inconsistent/unknown snapshots require review. Repeated approval/reconciliation uses the originally recorded amounts and frozen recipient/reference. No automatic repricing, duplicate payments or replacement transfers were introduced.

The admin sees each record's actual commission/helper amounts and snapshot; a 40/60 payment can coexist with a historical 30/70 payment. Approval dialogs use recorded amounts. Helpers see the new gross share; current terms/refund copy uses 40/60. Old static asset URLs remain available for cached pages; layouts and SEO metadata are retained.

There is no new database migration in this increment. The two previous tracking/account migrations remain required when installing the complete source on an older checkout. No runtime dependencies or credentials are added.

## Live integration blocker: Connected Path

The PayPal partner email supplied by the owner states that the Connected Path platform account **cannot accept direct customer payments or hold funds**. Helpers are merchants of record, and PayPal performs split payments; delayed release follows its approved integration. This repository's payment adapter is still **direct Checkout followed by admin-approved Payouts**, not a Connected Path implementation.

Changing a commission percentage does not implement seller onboarding, partner fee allocation or Connected Path delayed-disbursement APIs. This release must not be described as an approved Connected Path Live deployment. PayPal's technical documentation/checklist, approved account roles, merchant onboarding requirements, release rules and fee-allocation confirmation are required to finish that adapter.

The current adapter now fails closed for unsupported models and Live direct collection:

```dotenv
PAYPAL_INTEGRATION_MODEL=checkout_payouts
PAYPAL_LIVE_DIRECT_MODEL_APPROVED=false
PAYPAL_MODE=sandbox
PAYPAL_PAYOUTS_ENABLED=false
PAYPAL_LIVE_PAYOUTS_ENABLED=false
```

Setting PAYPAL_INTEGRATION_MODEL=connected_path refuses checkout on this adapter; it does not switch products. Do not set the direct-model approval flag for a Connected Path-only approval. Only if PayPal separately approves this exact direct collection/Payouts model may its explicit Live gates be reviewed for activation. No gate was enabled here.

These percentages are gross commission/helper allocation. This increment does not implement deductions of actual provider fees from helper earnings or guarantee a net 40% profit. The earlier proposed helper-borne fee arrangement must be confirmed with PayPal and implemented from actual fees under the approved model, with clear agreements/itemization. It must not be estimated or silently deducted from the 60%.

## cPanel preparation, not Live activation

A fresh production export comparison remains outstanding. Before upload, compare current cPanel source with this branch, back up database/files privately, and test against an isolated staging backend/database. Keep private `.env`, APP_KEY, uploads, storage, provider settings and unrelated sites intact.

This increment changes backend commission/configuration/eligibility/Live guards and the prepared static frontend plus tests/docs. Use the changed-file inventory; upload new assets before pages. Never replace the entire public_html or rebuild historical TSX source.

After reviewed files and private Sandbox configuration are installed on an authorized staging target:

```sh
cd "$HOME/urbanhelphub/project/backend-api"
/opt/cpanel/ea-php85/root/usr/bin/php -v
/opt/cpanel/ea-php85/root/usr/bin/php artisan migrate:status
/opt/cpanel/ea-php85/root/usr/bin/php artisan optimize:clear
/opt/cpanel/ea-php85/root/usr/bin/php artisan config:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan route:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan view:cache
```

No migration is needed solely to move from cab9f98 to this increment. For older installations, follow the previous migration instructions only after confirming each pending migration and the correct source/database. Do not drop/roll back tracking data. Keep Live blocked until the approved payment architecture is implemented and accepted.

## Verification

- Backend suite: **69 tests / 376 assertions passed**, including new 40/60 creation/payout, historical snapshot preservation, invalid snapshot rejection and Live/model guards.
- Frontend runtime/policy suite: **8 passed**. Existing recovery/notification/worker suite: **13 passed**.
- Browser suite: **8 synthetic scenarios passed**, including 40/60 admin approval alongside a historical 30/70 row. No real PayPal transaction was sent.
- Reproducible static build: **1053 files**, original metadata for **136 pages**, four hosting/SEO files unchanged and asset links valid across **140 pages**.
- Next production build, syntax lint, local-font backend build and real local runtime smoke passed. The known remote-font network issue is unchanged; no claim is made that that external font build was rerun/fixed.
- Tests use PHP 8.4.26, SQLite and fake provider HTTP. Target PHP 8.5/MySQL concurrency and real Sandbox/Connected Path acceptance remain unverified.

Nothing was deployed. No Live mode, credential, payout account or production data was changed.
