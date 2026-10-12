# UrbanHelpHub MVP — Truehost cPanel deployment

This release uses two applications:

- `backend-api`: Laravel API served from `api.yourdomain.com`
- `web-app`: Next.js application served from `yourdomain.com`

## 1. Confirm the hosting features

Before uploading, open Truehost cPanel and confirm that it includes:

- **Setup Node.js App**, with Node.js 20.9 or newer
- PHP 8.3 or newer
- MySQL Databases
- Terminal or SSH access
- SSL/TLS Status or AutoSSL

If **Setup Node.js App** is missing, ask Truehost to enable Node.js application hosting or place the frontend on Vercel. Do not deploy the Next.js source as plain static files; this MVP uses server-rendered routes.

## 2. Create the database

In **MySQL Databases**:

1. Create a database, for example `account_urbanhelp`.
2. Create a database user with a strong password.
3. Add the user to the database and grant **All Privileges**.
4. Keep the complete cPanel-prefixed database and username for the `.env` file.

## 3. Upload the Laravel API

1. Upload `backend-api` outside `public_html`, for example:
   `/home/CPANEL_USER/urbanhelphub/backend-api`
2. Create the subdomain `api.yourdomain.com` and set its document root to:
   `/home/CPANEL_USER/urbanhelphub/backend-api/public`
3. In Terminal, run:

```bash
cd /home/CPANEL_USER/urbanhelphub/backend-api
cp .env.production.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
```

4. Edit `.env` and set the real domain, frontend URLs, database values, mail settings, and a strong initial administrator password.
5. Finish the setup:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan optimize
```

The seed command installs the service categories. It creates the first administrator only when `MVP_ADMIN_EMAIL` and `MVP_ADMIN_PASSWORD` are present.

Ensure `storage` and `bootstrap/cache` are writable by the hosting account. Visit `https://api.yourdomain.com/up`; it should report that the application is healthy.

## 4. Create the Next.js application

The value of `NEXT_PUBLIC_API_URL` is compiled into the browser bundle, so set it **before** building.

1. Upload `web-app` to `/home/CPANEL_USER/urbanhelphub/web-app`.
2. Open **Setup Node.js App** and create an application with:
   - Node.js: 20.9 or newer
   - Mode: Production
   - Application root: `urbanhelphub/web-app`
   - Application URL: `https://yourdomain.com`
   - Startup file: `server.cjs`
3. Add this environment variable in the Node.js application:
   `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
4. In the application terminal, run:

```bash
npm ci
npm run build
```

5. Restart the Node.js application from cPanel.

If the site displays old API settings, rebuild it after correcting `NEXT_PUBLIC_API_URL` and restart the application.

## 5. SSL, scheduler, and final checks

Enable AutoSSL for both the main domain and API subdomain. Add this cPanel cron job, replacing the account name:

```cron
* * * * * cd /home/CPANEL_USER/urbanhelphub/backend-api && php artisan schedule:run >> /dev/null 2>&1
```

Check the MVP in this order:

1. Open the homepage over HTTPS.
2. Register a customer and a helper.
3. Sign in with the administrator created by the seed command.
4. Approve the helper and their services.
5. Post and approve a task, accept it as the helper, and complete the workflow.
6. Change the country and confirm the circular flag, language, and local currency.
7. Confirm the admin finance dashboard remains in CAD.
8. Upload and view a verification document.

## Currency note

Customer and helper screens use the selected country's transaction currency. Admin finance totals use the CAD settlement snapshot stored with each payment. The included FX values are indicative MVP defaults; update the `FX_*_TO_CAD` variables or connect a payment/rate provider before processing real money.

## Production safety

- Keep `APP_DEBUG=false`.
- Never upload a local `.env` file or commit passwords.
- Replace the initial administrator password after the first login.
- Use real SMTP settings so password and workflow emails can be delivered.
- Back up the database and uploaded files before each update.
