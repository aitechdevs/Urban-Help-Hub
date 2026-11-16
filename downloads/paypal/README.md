# UrbanHelpHub PayPal migration

Source-built payment migration for a Next.js static frontend in cPanel `public_html` and a Laravel API.

## Download

[Download the complete migration package](UrbanHelpHub-PayPal-complete.zip?raw=true).

The ZIP contains:

| File | Purpose |
| --- | --- |
| `public_html-paypal.zip` | Complete static frontend; extract its contents into the staged `public_html` directory. |
| `backend-api-paypal.zip` | Laravel backend update; extract into the existing API application directory outside `public_html`. |
| `UrbanHelpHub-PayPal-source.zip` | Updated frontend and backend source for review and future builds. |
| `DEPLOYMENT.md` | Installation, configuration, migration and cPanel instructions. |
| `VALIDATION.txt` | Test results and verification limits. |
| `SHA256SUMS.txt` | Checksums for the three inner ZIP files. |

Use the source ZIP for the updated application code. This download branch provides the release bundle and documentation.

Read [deployment instructions](DEPLOYMENT.md) and [validation results](VALIDATION.txt) before uploading.

## Payment rules

- Customers pay at least 50% before work starts; 100% upfront is optional.
- Helpers receive 60% of the agreed total. Their earnings remain held until customer completion confirmation, full verified customer payment and admin release.
- The platform absorbs PayPal collection fees, payout fees and applicable reviewed taxes from its 40%.
- Active Stripe UI/API calls are removed. Historical transaction records are retained.

## Deployment essentials

1. Back up the production files and database. Preserve the existing backend `.env`, `APP_KEY`, uploaded documents and storage.
2. Install the backend update and run the non-destructive migrations described in the deployment guide. Keep PayPal credentials on the API server.
3. Upload the complete static export, including HTML, its matching `_next` directory and `.htaccess`. Merge existing hosting rules as instructed.
4. Configure the matching PayPal environment, merchant account, webhook and Payouts capability, then verify the complete flow in sandbox before accepting live payments.

The frontend was rebuilt from source. Replace generated frontend assets as a complete build; do not combine the export with old compiled patches.

## Verification

- 25 backend tests passed with 181 assertions.
- Production static build passed; lint completed with 0 errors and 26 warnings.
- All 34 previously deployed non-dynamic routes returned HTTP 200 from the static export.
- Browser checks passed for both payment plans, PayPal return capture, admin payout controls, messaging, profile editing, task editing, helper PayPal settings, admin helper review and password recovery.

PayPal test responses were mocked. Production deployment, real PayPal credentials, webhook delivery, Payouts activation and production SMTP remain to be verified. No Defender clearance is claimed. See the deployment guide for supported transaction currencies and legacy transaction handling.
