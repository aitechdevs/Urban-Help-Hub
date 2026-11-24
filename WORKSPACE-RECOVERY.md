# Recover the Urban Help Hub workspace

Use the GitHub source branch recovery/uhh-paypal-release when starting a new Codex task. It contains the Laravel and Next.js source, migrations, tests and dependency lockfiles. The cpanel-sandbox-packages branch contains the deployment ZIPs and the CA$100 Sandbox verification record.

To restore on a new computer, clone the source branch or pick it in Codex:

    git clone --branch recovery/uhh-paypal-release https://github.com/aitechdevs/Urban-Help-Hub.git

For development, use PHP 8.4.1 or newer with Composer and Node.js 20.9 or newer. In backend-api, run composer install, configure a local environment from .env.example, generate an app key for that local database and run php artisan migrate. Run php artisan test. In web-app, run npm ci, then use the build command in the deployment guide with the intended API URL.

The Codex cloud environment's Publish action saves a reusable environment snapshot. Use it if available for the prepared setup. Use GitHub commits and pushes for source changes between milestones. A new task can restore the source from this branch even if it cannot reconnect to the old workspace.

Keep .env, application keys, PayPal credentials, database backups, and private uploads in your protected hosting backups. Restore a database snapshot and its matching Laravel application key together when recovering encrypted payout data.

## Latest verification

The CA$100 Sandbox booking passed with two CA$50 payments, a CA$60 payout verified in the recipient's Sandbox Activity, and a CA$40 gross platform share. The 84 Laravel tests also verified that new PayPal orders use the configured public dashboard for approval and cancellation. A fresh interactive Sandbox approval and redirect on the deployed site remains to be checked.
