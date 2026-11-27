# UrbanHelpHub Live PayPal setup

The client has completed the Sandbox checkout test. Use the client's Canadian PayPal Business account and its Live REST app for production. Have the client confirm with PayPal that their account is approved for the marketplace's direct-collection model, including collecting customer payments and paying helpers separately. Confirm the account's Live Payouts access before enabling outgoing payments.

## Get the Live values

1. Have the business account owner sign in to the PayPal Developer Dashboard. Under Apps & Credentials, switch to **Live** and select or create the UrbanHelpHub app. Record its client ID and secret securely. [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Get the PayPal merchant account ID from the same Business account. This is the merchant ID, separate from the application client ID.
3. In the Live app, create a webhook at `https://api.urbanhelphub.com/api/paypal/webhook`. Record its Live webhook ID. Subscribe to the following events supported by the app.

   - Payment capture completed, pending, denied or declined, refunded, and reversed
   - Customer dispute created, updated, and resolved
   - For Payouts, the individual payout item events available for the account, including succeeded, failed, returned, refunded, and unclaimed

Keep the Sandbox credentials and records separate. Enter the Live secret only in the private backend .env on cPanel.

## Stage the cutover in cPanel

Install the backend ZIP first to add the Live check command. Arrange a change window so users do not start a PayPal booking while the environment is being switched. Settle or review any outstanding Sandbox records while the Sandbox integration is still available. Historical Sandbox IDs should stay in Sandbox records.

Make a private backup of the backend .env before editing its existing values.

```bash
cd "$HOME/urbanhelphub/project/backend-api"
backup=$(mktemp -d "$HOME/uhh-paypal-env-backup.XXXXXX")
cp -p .env "$backup/.env"
chmod 600 "$backup/.env"
```

Set these keys to the following values. Replace the four placeholders with the client's Live values.

```dotenv
PAYPAL_MODE=live
PAYPAL_CURRENCY=CAD
FRONTEND_URL=https://urbanhelphub.com
PAYPAL_CLIENT_ID=LIVE_CLIENT_ID
PAYPAL_CLIENT_SECRET=LIVE_CLIENT_SECRET
PAYPAL_MERCHANT_ID=LIVE_MERCHANT_ID
PAYPAL_WEBHOOK_ID=LIVE_WEBHOOK_ID
PAYPAL_LIVE_DIRECT_MODEL_APPROVED=false
PAYPAL_PAYOUTS_ENABLED=false
PAYPAL_LIVE_PAYOUTS_ENABLED=false
```

Reload the configuration and run the Live checks.

```bash
cd "$HOME/urbanhelphub/project/backend-api"
PHP85=/opt/cpanel/ea-php85/root/usr/bin/php
"$PHP85" artisan config:cache &&
  "$PHP85" artisan paypal:check-live --remote
```

The command authenticates to Live and reads the configured webhook. It reports the switches, checks the webhook URL and checkout events, and counts unresolved Sandbox records. It prints no credentials and creates no orders, captures, or payouts. A passing result confirms the app can authenticate and read the webhook. Verify merchant approval and payment processing separately.

## Enable checkout and payouts

1. Once the Live check succeeds and the client confirms PayPal approval for the direct-collection model, set `PAYPAL_LIVE_DIRECT_MODEL_APPROVED=true` in the backend .env and rebuild the configuration cache. Keep payouts disabled for the first checkout.
2. Have the client use a fresh, agreed low-value Live booking and a buyer account separate from the merchant account. Verify the Live PayPal confirmation, the return to the Customer dashboard, the receipt in the merchant's PayPal activity, and any applicable fees. The previous Sandbox transaction and its references stay in Sandbox.
3. After PayPal confirms Live Payouts access, run `"$PHP85" artisan paypal:check-live --remote --payouts` while payout switches are still off. Once it passes, set both `PAYPAL_PAYOUTS_ENABLED=true` and `PAYPAL_LIVE_PAYOUTS_ENABLED=true`, then run `"$PHP85" artisan config:cache`.
4. Verify a single authorized payout to the intended Helper's Live PayPal account. Check the recipient before releasing, refresh the status after submission, and compare the result with PayPal activity. A successful Sandbox payout does not validate a Live recipient.

If the first Live test needs investigation, turn the payout switches off. Keep the Live webhook and credentials available to reconcile existing Live orders or payouts before any return to Sandbox. Retain the environment for any funds already collected.
