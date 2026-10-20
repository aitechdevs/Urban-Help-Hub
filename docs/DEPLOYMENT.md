# Truehost static frontend and Laravel API

Existing backend root:
/home/cpkygjzj/urbanhelphub/project/backend-api

Working CLI PHP:
/opt/cpanel/ea-php85/root/usr/bin/php

Frontend: copy contents of frontend/public_html into the site's public_html,
including _next assets and existing configuration files. Do not copy the whole
repository to public_html. Keep the API application and private storage outside
the public frontend root. The API web root remains backend-api/public.

For the EXISTING live API, preserve .env, APP_KEY, database, uploads, vendor,
permissions, existing hosting configuration and any newer cPanel edits. This
source repository is not authorization to overwrite the live backend wholesale.
Take a backup and compare changed files before deployment. The single-document
installer already applied on the host is integrated directly in this source;
you do not run that installer again when using this merged source tree.

For a NEW installation, install Composer dependencies and configure .env
privately, then migrate. Do not run migrate:fresh or seed sample users on live data.
No npm/Node server is required for this prepared frontend.

Extension require order in routes/api.php:
customer-task-details.php, account-review.php, identity-once.php,
final-approval-email.php (LAST, after all original routes).

After deliberate backend source deployment, clear and rebuild routes:
php artisan route:clear
php artisan route:cache
Use the full PHP 8.5 path above on cPanel.

Existing mail cron (one copy only):
*/10 * * * * /opt/cpanel/ea-php85/root/usr/bin/php /home/cpkygjzj/urbanhelphub/project/backend-api/artisan approvals:send-emails --limit=20 >/dev/null 2>&1

SMTP example keys match config/mail.php: MAIL_MAILER=smtp, MAIL_SCHEME=smtps,
MAIL_HOST=mail.urbanhelphub.com, MAIL_PORT=465. Set your mailbox username,
password and from address privately; no live credentials are included.
The --check option validates configuration only, not delivery/connectivity.

Final approval emails remain restrained: customer final profile approvals and
helper final verification transitions. Uploads/rejections do not generate new
email blasts. Successful outbox deliveries are not automatically resent.
