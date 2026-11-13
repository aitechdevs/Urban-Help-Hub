# 40/60 changed files

Relative to cab9f98. No database migration, credentials, dependency changes or deployment are included.

| File | Purpose |
|---|---|
| `README.md` | Document the new rate, validation, source package or unresolved Live integration requirements. |
| `backend-api/.env.example` | Set the new 40% default and add disabled-by-default Live/model guards; preserve Stripe configuration. |
| `backend-api/app/Http/Controllers/MarketplaceController.php` | Create new payment records with the 40% fee and a matching commission snapshot. |
| `backend-api/app/Services/PayPalPayoutService.php` | Validate each payment against its own 30%/40% snapshot without repricing history. |
| `backend-api/app/Services/PayPalService.php` | Block unsupported Connected Path usage and Live direct collection without explicit model approval. |
| `backend-api/config/services.php` | Set the new 40% default and add disabled-by-default Live/model guards; preserve Stripe configuration. |
| `backend-api/tests/Feature/PayPalCheckoutTest.php` | Prove missing direct-model approval and unsupported Connected Path cannot initiate payments. |
| `backend-api/tests/Feature/PayPalPayoutTest.php` | Cover 40/60 creation/transfers, preserved historical amounts and invalid snapshots. |
| `docs/PAYPAL-40-60-CHANGED-FILES.md` | Document the new rate, validation, source package or unresolved Live integration requirements. |
| `docs/PAYPAL-40-60-RELEASE.md` | Document the new rate, validation, source package or unresolved Live integration requirements. |
| `docs/PAYPAL-PAYOUTS-VALIDATION.md` | Document the new rate, validation, source package or unresolved Live integration requirements. |
| `docs/PAYPAL-PAYOUTS.md` | Document the new rate, validation, source package or unresolved Live integration requirements. |
| `frontend/public_html/_next/static/chunks/uhh-admin-dashboard-71f47ff018fe.js` | Generated, content-versioned helper/admin module and notification-linked variant. |
| `frontend/public_html/_next/static/chunks/uhh-helper-dashboard-f1e1aeccdfea.js` | Generated, content-versioned helper/admin module and notification-linked variant. |
| `frontend/public_html/_next/static/chunks/uhh-linked-8d82aeb876c4.js` | Generated, content-versioned helper/admin module and notification-linked variant. |
| `frontend/public_html/_next/static/chunks/uhh-linked-dadb3c069983.js` | Generated, content-versioned helper/admin module and notification-linked variant. |
| `frontend/public_html/admin/__next._full.txt` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/admin/__next.admin.__PAGE__.txt` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/admin/index.html` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/admin/index.txt` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/__next._full.txt` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/__next.helper.dashboard.__PAGE__.txt` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/index.html` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/helper/dashboard/index.txt` | Reference the new helper/admin assets in HTML and React navigation payloads. |
| `frontend/public_html/refund-policy/__next._full.txt` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/refund-policy/__next.refund-policy.__PAGE__.txt` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/refund-policy/index.html` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/refund-policy/index.txt` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/terms/__next._full.txt` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/terms/__next.terms.__PAGE__.txt` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/terms/index.html` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/public_html/terms/index.txt` | Update current payment-policy percentages; preserve metadata/layout. |
| `frontend/static-maintenance/build-manifest.json` | Map original references to updated versioned assets. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-admin-dashboard-e5e703be5e4d.js` | Preserve pre-update helper/admin asset URLs and bytes for cached clients. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-helper-dashboard-f281479b9bbe.js` | Preserve pre-update helper/admin asset URLs and bytes for cached clients. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-09c0d6eccc52.js` | Preserve pre-update helper/admin asset URLs and bytes for cached clients. |
| `frontend/static-maintenance/compatibility-assets/_next/static/chunks/uhh-linked-9c9806cfdf40.js` | Preserve pre-update helper/admin asset URLs and bytes for cached clients. |
| `frontend/static-maintenance/editable-static-modules/admin-dashboard.js` | Show recorded commission/net and snapshot-specific approval percentages for new and historical payments. |
| `frontend/static-maintenance/editable-static-modules/helper-dashboard.js` | Describe the new 60% gross share and preserve historical recorded splits. |
| `frontend/static-maintenance/payment-copy-replacements.json` | Reproducibly update payment-only 40/60 terms and refund policy copy. |
| `frontend/static-maintenance/tests/paypal-browser.mjs` | Check new 60% approval and historical 70% in the same dashboard, including correct confirmation amounts. |
| `frontend/tests/paypal-policy.test.mjs` | Assert current 40% commission wording. |
