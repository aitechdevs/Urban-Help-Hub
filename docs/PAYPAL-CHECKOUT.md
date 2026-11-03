# PayPal Sandbox checkout

This branch extends `nodejs-migration` at `ad5c5ac3ac885c3400be488a2acbbdf91bbbd4f1`. It is prepared code, not a deployment. `cpanel-working` and production remain unchanged. The existing snapshot has not been certified against a fresh cPanel export.

## Architecture and payment lifecycle

The canonical backend is `backend-api/` (Laravel 13.31.0, Sanctum, PHP ^8.3). Production PHP 8.5 is reported by the owner; cloud verification uses PHP 8.4.26, not a PHP 8.5 host. The maintained frontend is `frontend/public_html/`, generated from `frontend/static-baseline/` plus editable static modules. Next 16.3.5 / React 19.2.8 serves that export locally. Historical root PHP copies, `web-app/`, and `frontend/nextjs-reference/` are not the deployment source.

`MarketplaceController::confirmCompletion` locks the task, marks completion, creates one payment if absent, and creates its pending helper payout. There is no Payment Eloquent model: existing controllers use DB queries. Decimal major-unit fields include `subtotal_amount`, `platform_fee`, `tax_amount`, `total_amount`, `refunded_amount`, currency and CAD settlement/FX/net fields. Existing common payment statuses are pending, paid, failed and refunded. PayPal additionally records partially_refunded and reversed, which cannot be checked out again. Existing amount/commission calculation and settlement fields are unchanged. Unsupported PayPal currencies fail explicitly; no implicit conversion occurs. This initial adapter supports CAD, USD, AUD, EUR, GBP and NZD, all with two decimals.

The original Stripe checkout uses a helper Connect account and an application fee/destination transfer. All Stripe routes, SDK dependency, environment settings, database fields, history and source remain. Helper Connect controls are temporarily hidden through STRIPE_PAYOUT_UI_ENABLED=false; the original actions remain in source. Admin PayPal payments show provider-managed confirmation and separate manual payout recording. Its endpoint now locks checkout and refuses a payment already reserved for PayPal. PayPal rejects any existing Stripe session or provider payment reference: reconcile/cancel it at Stripe first; never just clear a database reference. Stripe reactivation requires a reviewed frontend change, not deletion of PayPal history. Payment paragraphs in terms/privacy/refund policy now describe PayPal checkout and separate payouts, while preserving layout, SEO, commission percentage and unrelated policy text. Provider-neutral privacy text continues to cover historical processing.

PayPal collects the full customer total into the configured platform merchant account. The commission remains accounting data; **this does not split funds or send helper payouts**. On confirmed collection, an existing untransferred pending payout is labelled `manual` and stays pending. Admin payout status records an externally performed payout; it does not transfer money. Refunds/reversals do not recover already-sent helper money. Reconcile those manually and monitor dispute flags; an OPEN dispute blocks marking that payout paid. Obtain provider approval for the marketplace collection/payout model before any real-money use.

## Additive migration and safeguards

`2026_11_03_211434_add_paypal_checkout_tracking.php` adds nullable PayPal mode, order, capture, payer, request-key, start-time and dispute fields to payments, and a unique event-ID ledger. No existing payment records or Stripe fields are deleted/renamed. Admin payment results include PayPal references, dispute state and refunded amount. PayPal payment status cannot be manually overridden through admin.

Request keys commit before the network call. Row locks serialize Stripe/PayPal checkout and capture/webhook updates. Provider reads bind order/custom reference, amount, currency and merchant to the stored payment. Payment/notification/event-ledger changes are transactional. Failed webhooks return 503 and remain retryable; duplicate committed IDs do nothing. Current provider order state reconciles completed/denied/refunded events instead of trusting delivery order. Reversal and dispute events require verified signatures and matching captures. Unknown unrelated event types are verified and acknowledged without payment mutation.

Create/capture retries use stable PayPal-Request-Id values. An ambiguous create or incomplete capture older than five hours requires operator reconciliation, rather than exceeding PayPal's default request-ID retention and risking duplicate payment. An already-completed order can still reconcile after that window. Expired/voided orders also require reconciliation; automatic order replacement is deliberately unsupported. All API failures produce generic customer responses and logs containing internal payment/event identifiers only. No raw provider response, secret, token, personal payload or signature header is logged by this implementation.

## Exact API routes

Customer routes use existing `auth:sanctum` middleware and customer ownership checks:

- `GET /api/customer/payments/{paymentId}/paypal/config` — client ID, payment currency and mode only; no-store.
- `POST /api/customer/payments/{paymentId}/paypal/create-order` — no browser price accepted; returns `data.order_id`.
- `POST /api/customer/payments/{paymentId}/paypal/capture` — JSON `{ "order_id": "…" }`; backend confirmation returns `data.status: paid`.
- `POST /api/paypal/webhook` — public transport, authenticated by official PayPal signature verification API and PAYPAL_WEBHOOK_ID.

Existing routes including `/api/customer/payments/{paymentId}/checkout`, `/api/stripe/webhook`, `/api/admin/payments` and `/api/admin/payments/{paymentId}/status` remain.

The implemented API-domain Sandbox webhook URL is:

**https://api.urbanhelphub.com/api/paypal/webhook**

This URL is available only after an authorized deployment of this branch. For isolated staging tests, register the equivalent endpoint on the staging backend instead. No webhook was registered by this work.

## Server configuration

Set values privately in the backend environment. Never paste credentials into tickets, source, screenshots, shell command history or this document. Keep APP_DEBUG=false on any hosted environment.

```dotenv
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_MERCHANT_ID=
PAYPAL_CURRENCY=CAD
```

PAYPAL_MERCHANT_ID is the receiving Sandbox business account's merchant ID, not its client ID or email; it is required to verify the recipient. The backend's authenticated config route supplies only the public client ID, currency and mode to the official `https://www.paypal.com/sdk/js` button. The Sandbox/Live account is determined by the matching app credentials. OAuth tokens are cached server-side; restrict access to the Laravel cache. TLS verification remains enabled, with fixed API origins and redirects disabled.

## Deployment commands — reference only, NOT executed

First review the commit against the correct base, verify the target database/environment, take a private database/files backup, and schedule an authorized deployment. Apply the patch to a checkout containing the base commit (it changes `backend-api/` and `frontend/`, not the historical root PHP copies). Test in an isolated Sandbox environment first. No new Composer dependency is required. Use the server's existing matching locked vendor installation or install the unchanged lockfile with PHP 8.5 and your actual Composer executable.

After placing reviewed backend files and privately configuring Sandbox values:

```sh
cd "$HOME/urbanhelphub/project/backend-api"
/opt/cpanel/ea-php85/root/usr/bin/php -v
/opt/cpanel/ea-php85/root/usr/bin/php artisan optimize:clear
/opt/cpanel/ea-php85/root/usr/bin/php artisan migrate --force
/opt/cpanel/ea-php85/root/usr/bin/php artisan config:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan route:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan view:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan route:list --path=paypal
```

Verify the executable exists with Truehost if it differs. Do not run migrations against production until deployment is authorized. Do not roll back this migration after transactions exist; that would remove PayPal references and event history. Roll back visible checkout separately while retaining tracking data.

The prepared frontend files are already rebuilt. Publish only reviewed changed files under `frontend/public_html/` to the matching document root after backend readiness; retain old asset filenames and unrelated domains/staging/configuration. No Node process is needed for this cPanel static export. Do not rebuild the historical TSX frontend. Neither these commands nor frontend upload has been performed here.

## Sandbox checklist before Live

- [ ] Use separate Sandbox business and buyer accounts, Sandbox client credentials, merchant ID and app-specific webhook ID. Isolate test data from production.
- [ ] Run the additive migration and verify PHP 8.5, Sanctum/CORS, cache, HTTPS, route caching and production debug=false on the target environment.
- [ ] Subscribe the Sandbox app to PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.PENDING, PAYMENT.CAPTURE.REFUNDED, PAYMENT.CAPTURE.REVERSED and available CUSTOMER.DISPUTE.CREATED/UPDATED/RESOLVED events.
- [ ] Complete a real Sandbox buyer approval/capture, confirming the actual Orders response shape, merchant ID, amount/currency, one paid payment and one pending helper payout.
- [ ] Test cancellation, denied/pending capture, timeout/retry, repeated clicks, page reload, expired order and different/unsupported currency.
- [ ] Resend real Sandbox webhook events; test invalid signatures, duplicate IDs, a capture arriving before the browser response, partial/full refunds and dispute/reversal reconciliation.
- [ ] Test contention on the target MySQL database: concurrent create/capture/webhook requests and Stripe/PayPal attempts. Cloud tests use SQLite and ordering permutations, not a multi-process MySQL load test.
- [ ] Test desktop/mobile PayPal popup/redirect behavior, third-party cookie restrictions and any hosting CSP. Cloud browser tests use a synthetic SDK, not real PayPal approval.
- [ ] Ensure monitoring/retry handling for 503 webhooks and manual reconciliation alerts. Never mark a failed/pending capture paid based on the browser callback.

## Separate Live activation checklist — no activation performed

- [ ] Obtain PayPal approval for this marketplace model and decide the separate helper payout/reconciliation process.
- [ ] Complete all Sandbox checks above, target PHP 8.5 verification, refund/dispute operations and production rollback review.
- [ ] Create/approve a Live PayPal app and receiving merchant account; privately configure its distinct client ID, secret, merchant ID and webhook ID with PAYPAL_MODE=live only after authorization.
- [ ] Register the Live app's reviewed HTTPS webhook endpoint and subscriptions. Sandbox webhook IDs/credentials cannot verify Live events.
- [ ] Rebuild Laravel config cache. Keep existing Sandbox payments segregated: the code refuses a payment whose stored mode differs from the configured mode. Do not clear its tracking columns to reuse it.
- [ ] Perform an authorized low-value real transaction/refund, confirm settlement and fees, then monitor before broader availability.

## Validation

See `PAYPAL-VALIDATION.md` and `PAYPAL-CHANGED-FILES.md`. Official integration references: [Orders v2](https://developer.paypal.com/docs/api/orders/v2/), [JavaScript SDK](https://developer.paypal.com/sdk/js/reference/), [webhook signature verification](https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature_post), [REST idempotency](https://developer.paypal.com/api/rest/reference/idempotency/).
