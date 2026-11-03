# PayPal changed files

Changes relative to `nodejs-migration` at `ad5c5ac`. No historical root PHP/TSX source, dependencies, credentials or hosting configuration changed.

| File | Reason |
|---|---|
| `README.md` | Link the Sandbox integration, verification and deployment documentation. |
| `backend-api/.env.example` | Safe Sandbox placeholders, including receiving merchant ID; retain Stripe settings. |
| `backend-api/app/Http/Controllers/AdminController.php` | Expose PayPal references, prevent manual payment overrides and block disputed payout status release. |
| `backend-api/app/Http/Controllers/PayPalController.php` | Authenticated configuration/create/capture and verified transactional webhook reconciliation. |
| `backend-api/app/Http/Controllers/StripePaymentController.php` | Serialize checkout and reject PayPal-reserved payments; preserve original Stripe flow. |
| `backend-api/app/Services/PayPalService.php` | OAuth cache, fixed-origin Orders API calls, official signature verification and trusted money/recipient checks. |
| `backend-api/config/services.php` | Read PayPal settings from environment; preserve Stripe configuration. |
| `backend-api/database/migrations/2026_11_03_211434_add_paypal_checkout_tracking.php` | Add nullable PayPal tracking columns and a unique webhook ledger without altering existing records. |
| `backend-api/routes/api.php` | Add four PayPal routes alongside all existing Stripe/admin routes. |
| `backend-api/tests/Feature/PayPalCheckoutTest.php` | 17 isolated backend regression cases with fake provider HTTP and in-memory SQLite. |
| `docs/PAYPAL-CHANGED-FILES.md` | Integration architecture, exact routes, deployment/checklists, validation or changed-file inventory. |
| `docs/PAYPAL-CHECKOUT.md` | Integration architecture, exact routes, deployment/checklists, validation or changed-file inventory. |
| `docs/PAYPAL-VALIDATION.md` | Integration architecture, exact routes, deployment/checklists, validation or changed-file inventory. |
| `frontend/public_html/_next/static/chunks/uhh-admin-dashboard-3cd215b5e4f6.js` | Versioned generated helper/admin payment controls and notification-linked variants. |
| `frontend/public_html/_next/static/chunks/uhh-customer-dashboard-436794a0d46d.js` | Generated versioned customer checkout chunk and notification-linked variant; old assets retained. |
| `frontend/public_html/_next/static/chunks/uhh-helper-dashboard-41e766e7af3d.js` | Versioned generated helper/admin payment controls and notification-linked variants. |
| `frontend/public_html/_next/static/chunks/uhh-linked-9def6ea75183.js` | Versioned generated helper/admin payment controls and notification-linked variants. |
| `frontend/public_html/_next/static/chunks/uhh-linked-da4b7ec2498b.js` | Generated versioned customer checkout chunk and notification-linked variant; old assets retained. |
| `frontend/public_html/_next/static/chunks/uhh-linked-fca373615027.js` | Versioned generated helper/admin payment controls and notification-linked variants. |
| `frontend/public_html/admin/__next._full.txt` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/admin/__next.admin.__PAGE__.txt` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/admin/index.html` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/admin/index.txt` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/dashboard/__next._full.txt` | Reference the new customer checkout chunk for HTML and React navigation payloads. |
| `frontend/public_html/dashboard/__next.dashboard.__PAGE__.txt` | Reference the new customer checkout chunk for HTML and React navigation payloads. |
| `frontend/public_html/dashboard/index.html` | Reference the new customer checkout chunk for HTML and React navigation payloads. |
| `frontend/public_html/dashboard/index.txt` | Reference the new customer checkout chunk for HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/__next._full.txt` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/__next.helper.dashboard.__PAGE__.txt` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/index.html` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/index.txt` | Reference the updated helper/admin payment chunks in HTML and React navigation payloads. |
| `frontend/public_html/privacy/__next._full.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/privacy/__next.privacy.__PAGE__.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/privacy/index.html` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/privacy/index.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/refund-policy/__next._full.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/refund-policy/__next.refund-policy.__PAGE__.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/refund-policy/index.html` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/refund-policy/index.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/terms/__next._full.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/terms/__next.terms.__PAGE__.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/terms/index.html` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/public_html/terms/index.txt` | Update payment-provider/payout policy copy consistently in HTML and React payloads; preserve SEO/layout. |
| `frontend/static-maintenance/build-manifest.json` | Deterministic mapping to regenerated customer checkout asset. |
| `frontend/static-maintenance/build-static.py` | Apply narrowly scoped payment policy copy replacements during reproducible builds. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-admin-dashboard-e3c5bace5b78.js` | Preserve prior helper/admin asset bytes for cached clients and future Stripe reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-customer-dashboard-5696ff60c0bc.js` | Retain the previous customer asset bytes for cached pages and future Stripe reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-helper-dashboard-abe77470a87b.js` | Preserve prior helper/admin asset bytes for cached clients and future Stripe reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-43a37568c7a9.js` | Preserve prior helper/admin asset bytes for cached clients and future Stripe reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-67937fc02805.js` | Retain the previous customer asset bytes for cached pages and future Stripe reactivation. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-ddfe86ee1713.js` | Preserve prior helper/admin asset bytes for cached clients and future Stripe reactivation. |
| `frontend/static-maintenance/editable-static-modules/admin-dashboard.js` | Show PayPal-managed payment status, suppress manual confirmation and guard/label separate payout recording. |
| `frontend/static-maintenance/editable-static-modules/customer-dashboard.js` | Official PayPal SDK button and states; stop automatic Stripe launch after completion; retain Stripe function. |
| `frontend/static-maintenance/editable-static-modules/helper-dashboard.js` | Temporarily hide retained Connect controls and status fetch; show separate helper payout arrangements. |
| `frontend/static-maintenance/payment-copy-replacements.json` | Payment-only terms/privacy/refund wording consistent with checkout and separate helper payouts. |
| `frontend/static-maintenance/tests/paypal-browser.mjs` | Synthetic SDK browser coverage of success, cancellation and failure on desktop/mobile. |
| `frontend/tests/paypal-policy.test.mjs` | Guard customer policy accuracy and preserved commission wording. |
