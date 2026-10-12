# UrbanHelpHub UI and PWA patch — installation

This patch is based on Git commit `0158963f2ad0c07fcbe8ab62e39e60d778c68d19`. It changes the Next.js frontend and adds the root GitHub README. The Laravel backend, database, authentication/authorization, Stripe configuration, commissions and payout logic are unchanged. No environment values, credentials, dependency folders or production data are included.

## Destination and file replacement

Your cPanel screenshot identifies the project folder as `urbanhelphub/project`, containing `backend-api` and `web-app`. Use `/home/<CPANEL_USER>/urbanhelphub/project` as the extraction destination (substitute your actual cPanel username). If you moved the app, use the existing parent of `web-app` instead. Verify that `web-app/package.json` and `web-app/server.cjs` exist before proceeding.

The optional root `README.md` belongs in the project parent, alongside `web-app` and `backend-api`. Its `releases/` links refer to the GitHub repository documentation. Every entry under `web-app/` in this ZIP belongs under that existing project parent. **Do not extract the ZIP directly inside `web-app`**, which would create a nested `web-app/web-app`. Replace only the files marked Replace below; add the new files. Do not replace `.env` or copy anything into `backend-api` or `public_html`.

The ZIP also contains these review documents at its root: `PATCH-INSTALL-INSTRUCTIONS.md`, `CHANGED-FILES.md`, `TEST-RESULTS.md`, `UNIMPLEMENTED-CONTROLS.md`, `UrbanHelpHub-UI-PWA.patch`, and `SHA256SUMS.txt`. Keep those documents outside the public website; they are not application runtime files. The Git diff includes binary icon changes and can alternatively be applied with `git apply --check` followed by `git apply` from the repository root at the stated base commit. Do not deploy both ways.

| File relative to project folder | Action |
| --- | --- |
| `README.md` | Add to the GitHub repository root; optionally add to the cPanel project parent for developer reference |
| `web-app/app/admin/page.tsx` | Replace existing |
| `web-app/app/dashboard/page.tsx` | Replace existing |
| `web-app/app/globals.css` | Replace existing |
| `web-app/app/helper/dashboard/page.tsx` | Replace existing |
| `web-app/app/layout.tsx` | Replace existing |
| `web-app/app/manifest.ts` | Add new |
| `web-app/components/MessagesPanel.tsx` | Add new |
| `web-app/components/NotificationBell.tsx` | Replace existing |
| `web-app/components/PwaSupport.tsx` | Add new |
| `web-app/components/RegionSelector.tsx` | Replace existing |
| `web-app/lib/dashboard-navigation.ts` | Add new |
| `web-app/next.config.ts` | Replace existing |
| `web-app/public/icons/icon-192.png` | Add new |
| `web-app/public/icons/icon-512.png` | Add new |
| `web-app/public/icons/icon-maskable-512.png` | Add new |
| `web-app/public/offline.html` | Add new |
| `web-app/public/sw.js` | Add new |
| `web-app/tests/service-worker.test.mjs` | Add new |

## Back up before upload

1. Back up the existing `web-app` source files that will be replaced, preserving their paths. Store the backup outside `public_html` and outside this application folder.
2. Back up the working `web-app/.next` production build and record the current Git commit/version. A hosting snapshot or a cPanel ZIP of the frontend is suitable; keep any credentials in that backup private and do not upload it here.
3. Note the new-file list below so rollback can remove exactly those additions. Preserve any locally customized changes before replacing files. Apply this patch to a staging copy first if your cPanel source has diverged from the provided export.

## Build and restart

Open the application's cPanel Node.js terminal, activating the Node.js environment shown by **Setup Node.js App**. Use Node.js 20.9 or newer (validation used Node.js 24). From the existing frontend directory:

```sh
cd /home/<CPANEL_USER>/urbanhelphub/project/web-app
npm ci --include=dev
npm run lint
node --test tests/service-worker.test.mjs
npm run build
```

Stop if a command fails. Preserve the existing `NEXT_PUBLIC_API_URL` setting in cPanel; it must be available at build time. The validation build used a local development API URL, but compiled assets are not shipped in this ZIP. **You must rebuild on the server with your existing production API URL.** There are no package.json or lockfile changes.

In **Setup Node.js App**, restart the existing application with the unchanged startup file `server.cjs`. Do not start a second `npm start` server alongside cPanel's managed application. No PHP commands, migrations, database changes, `artisan optimize:clear`, Stripe dashboard changes or backend cache clearing are required.

## Frontend caches and PWA verification

- Serve the application over HTTPS at the domain root. This patch assumes root paths `/sw.js`, `/manifest.webmanifest` and `/icons/`; deployment under a URL subdirectory requires a separate configuration change.
- Purge any cPanel/CDN proxy cache for `/sw.js`, `/manifest.webmanifest`, `/offline.html` and `/icons/*`, if a proxy cache is configured. Honor the service-worker `Cache-Control: no-store` header. Next.js build assets retain their normal hashed deployment URLs.
- Open `https://YOUR_EXISTING_FRONTEND_DOMAIN/manifest.webmanifest`. Confirm UrbanHelpHub, start URL `/`, scope `/`, standalone display and the three icon entries. Check each PNG loads, including 192×192, 512×512 and the maskable 512×512 icon.
- Open `/sw.js`; it must return JavaScript, not an HTML fallback or redirect. Browser developer tools → Application → Service Workers must show the active worker at scope `/`. Inspect response headers for `Cache-Control: no-store` and `Service-Worker-Allowed: /`.
- Browser developer tools → Cache Storage should show `urbanhelphub-public-v1` containing exactly the offline page and the three icons. Dashboard documents, tokens, API responses, Stripe requests and `/_next` bundles must be absent.
- The worker checks for updates on registration, when a tab becomes visible and hourly. New workers activate automatically; no forced reload interrupts a form or payment flow. The worker does not cache JavaScript, documents or API responses. Bump the worker cache version if you later change the offline page or icons.
- On a supported browser, the Install control appears only when `beforeinstallprompt` is available. Clicking it opens the native prompt. Browser install eligibility can require user engagement and varies by browser. It cannot be forced, and a synthetic event in automated tests does not prove native installation eligibility on every device.
- On iPhone/iPad Safari, the suggestion explains Share → Add to Home Screen. Installed standalone windows show no suggestion. Dismissal is saved locally; remove only `urbanhelphub-install-dismissed-v1` from Local Storage if you deliberately want to retest the suggestion.
- Offline fallback is provided only for an unsuccessful, plain homepage navigation. Login, dashboards, payment-return query URLs and API requests remain online-only. Never demonstrate offline behavior with a real payment in progress.

## Functional verification after restart

Sign in separately as Customer, Helper and Administrator on desktop and mobile. Check tabs, menus, notification actions, profile/application links, helper-review cards and current active indicators. Use Tab, Enter/Space and Escape; confirm visible focus and that mobile menus close after selection. On Customer/Helper dashboards, open conversations, choose an existing confirmed task, refresh and send a test message. Existing backend permissions determine available conversations. Do not use live payments to verify this UI patch. Run your existing Stripe test-mode Checkout/Connect flow separately before production release if one is available.

## Safe rollback

1. Before removing PWA files, replace `/sw.js` temporarily with the self-retiring worker below and keep the same no-store response header. Restart/reload the application so browsers can discover it. Keep this retirement file available long enough for returning users to receive it.

```js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil((async () => {
  await Promise.all((await caches.keys())
    .filter(key => key.startsWith("urbanhelphub-public-"))
    .map(key => caches.delete(key)));
  await self.registration.unregister();
})()));
```

2. Restore only the replaced frontend source files from your backup. Remove the newly added application files listed in the table, except retain the retirement `public/sw.js` temporarily as explained above. Keep credentials, uploads, backend files and unrelated files intact.
3. Restore the prior working `.next` build with its matching source/dependencies, or rebuild the restored source using the existing production API setting. Restart the cPanel Node.js application and purge affected proxy cache entries. Do not run database migrations for rollback.
4. For an immediate check on your own browser, unregister this app's worker and delete only caches with prefix `urbanhelphub-public-` in developer tools, then reload. Previously installed home-screen shortcuts are controlled by users and cannot be remotely uninstalled; they will load the restored website once online.
