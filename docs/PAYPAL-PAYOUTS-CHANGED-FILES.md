# Payout increment changed files

Relative to checkout commit `827589c`. The complete source also contains that earlier Checkout increment. No credentials, dependency changes or live hosting settings are included.

| File | Purpose |
|---|---|
| `README.md` | Document current source, validation, deployment requirements or changed-file inventory. |
| `backend-api/.env.example` | Safe disabled-by-default Payouts and Live sending switches; no credentials. |
| `backend-api/app/Console/Commands/ReconcilePayPalPayouts.php` | Poll only already approved processing/unclaimed transfers; never create an approval. |
| `backend-api/app/Http/Controllers/AdminController.php` | Expose authorized payout review/audit details and block manual status bypass for PayPal. |
| `backend-api/app/Http/Controllers/MarketplaceController.php` | Record 30% commission snapshot on new completion payments and clarify helper pending-approval messaging. |
| `backend-api/app/Http/Controllers/PayPalController.php` | Route verified payout events to reconciliation and notify admins when collected payments become eligible or approved payments become risky. |
| `backend-api/app/Http/Controllers/PayPalPayoutController.php` | Own-helper account endpoints and active-admin approval/reconciliation transport with sanitized failures. |
| `backend-api/app/Services/PayPalPayoutService.php` | Eligibility and 30/70 checks, approval audit, immutable sender/recipient, provider submission/reconciliation and notifications. |
| `backend-api/app/Services/PayPalService.php` | Server-side Payouts submission and duplicate-batch reconciliation using fixed provider API origins. |
| `backend-api/config/services.php` | Fixed 30% new-payment commission and explicit payout feature gates. |
| `backend-api/database/migrations/2026_11_04_135453_add_admin_approved_paypal_payouts.php` | Add encrypted helper payout accounts, commission snapshot and approval/provider-reference columns without deleting data. |
| `backend-api/routes/api.php` | Authenticated/rate-limited helper account and active-admin payout endpoints. |
| `backend-api/routes/console.php` | Register overlap-protected reconciliation schedule; cPanel cron activation remains a deployment step. |
| `backend-api/tests/Feature/PayPalPayoutTest.php` | 18 isolated payout, authorization, accounting, privacy, idempotency and notification tests. |
| `docs/PAYPAL-CHECKOUT.md` | Document current source, validation, deployment requirements or changed-file inventory. |
| `docs/PAYPAL-PAYOUTS-CHANGED-FILES.md` | Document current source, validation, deployment requirements or changed-file inventory. |
| `docs/PAYPAL-PAYOUTS-VALIDATION.md` | Document current source, validation, deployment requirements or changed-file inventory. |
| `docs/PAYPAL-PAYOUTS.md` | Document current source, validation, deployment requirements or changed-file inventory. |
| `frontend/public_html/_next/static/chunks/uhh-admin-dashboard-e5e703be5e4d.js` | Generated versioned customer/helper/admin payout UI and notification-linked asset variant. |
| `frontend/public_html/_next/static/chunks/uhh-customer-dashboard-bbafb7060be5.js` | Generated versioned customer/helper/admin payout UI and notification-linked asset variant. |
| `frontend/public_html/_next/static/chunks/uhh-helper-dashboard-f281479b9bbe.js` | Generated versioned customer/helper/admin payout UI and notification-linked asset variant. |
| `frontend/public_html/_next/static/chunks/uhh-linked-09c0d6eccc52.js` | Generated versioned customer/helper/admin payout UI and notification-linked asset variant. |
| `frontend/public_html/_next/static/chunks/uhh-linked-1d326184ad3e.js` | Generated versioned customer/helper/admin payout UI and notification-linked asset variant. |
| `frontend/public_html/_next/static/chunks/uhh-linked-9c9806cfdf40.js` | Generated versioned customer/helper/admin payout UI and notification-linked asset variant. |
| `frontend/public_html/admin/__next._full.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/admin/__next.admin.__PAGE__.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/admin/index.html` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/admin/index.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/dashboard/__next._full.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/dashboard/__next.dashboard.__PAGE__.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/dashboard/index.html` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/dashboard/index.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/__next._full.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/__next.helper.dashboard.__PAGE__.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/index.html` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/index.txt` | Reference the rebuilt payment UI assets in HTML and React navigation payloads. |
| `frontend/public_html/terms/__next._full.txt` | Payment-only terms reflect customer confirmation and admin-approved PayPal transfers; metadata/layout preserved. |
| `frontend/public_html/terms/__next.terms.__PAGE__.txt` | Payment-only terms reflect customer confirmation and admin-approved PayPal transfers; metadata/layout preserved. |
| `frontend/public_html/terms/index.html` | Payment-only terms reflect customer confirmation and admin-approved PayPal transfers; metadata/layout preserved. |
| `frontend/public_html/terms/index.txt` | Payment-only terms reflect customer confirmation and admin-approved PayPal transfers; metadata/layout preserved. |
| `frontend/static-maintenance/build-manifest.json` | Map current source to content-versioned assets. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-admin-dashboard-3cd215b5e4f6.js` | Retain previous prepared asset bytes/URLs for cached clients and Stripe history/reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-customer-dashboard-436794a0d46d.js` | Retain previous prepared asset bytes/URLs for cached clients and Stripe history/reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-helper-dashboard-41e766e7af3d.js` | Retain previous prepared asset bytes/URLs for cached clients and Stripe history/reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-9def6ea75183.js` | Retain previous prepared asset bytes/URLs for cached clients and Stripe history/reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-da4b7ec2498b.js` | Retain previous prepared asset bytes/URLs for cached clients and Stripe history/reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-fca373615027.js` | Retain previous prepared asset bytes/URLs for cached clients and Stripe history/reactivation. |
| `frontend/static-maintenance/editable-static-modules/admin-dashboard.js` | Review recipient/commission, approve/send 70%, inspect processing status and prevent manual confirmation. |
| `frontend/static-maintenance/editable-static-modules/customer-dashboard.js` | Clarify that collected payments leave helper earnings awaiting admin approval. |
| `frontend/static-maintenance/editable-static-modules/helper-dashboard.js` | Helper receiving-email/password form, approval explanations and retained hidden Stripe controls. |
| `frontend/static-maintenance/payment-copy-replacements.json` | Maintain payment-only policy wording in the reproducible static build. |
| `frontend/static-maintenance/tests/paypal-browser.mjs` | Test helper account save and real admin UI approval payload/status transitions using a synthetic provider. |
| `frontend/tests/paypal-policy.test.mjs` | Assert current payout policy wording while retaining the 30% commission. |
