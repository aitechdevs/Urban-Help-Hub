# Changed and added files

Base commit: `0158963f2ad0c07fcbe8ab62e39e60d778c68d19`.

18 frontend files and one root README; no backend files, manifests of dependencies, lockfiles or credentials are modified.

| File relative to project folder | Change | Purpose |
| --- | --- | --- |
| `README.md` | Added | GitHub overview, architecture, development setup, routes, PWA policy, validation, deployment and known limitations. |
| `web-app/app/admin/page.tsx` | Modified | Connect existing sidebar and review-card actions, expose the same mobile/tablet destinations, identify active sections, restore menu focus, and disable unavailable Customer-management controls. |
| `web-app/app/dashboard/page.tsx` | Modified | Connect My tasks and View all to the existing task list, close menus after navigation, add accessible section targets and mobile preferences/notifications, and replace static message placeholders with the existing-API panel. |
| `web-app/app/globals.css` | Modified | Add restrained hover/pressed states, pointer cursors only to semantic controls, keyboard focus outlines, active-tab indicators, disabled states and reduced-motion handling. |
| `web-app/app/helper/dashboard/page.tsx` | Modified | Connect all existing tabs to Opportunities, My jobs, Messages and Earnings sections; preserve sm/lg breakpoints while adding tablet navigation; wire existing message functionality. |
| `web-app/app/layout.tsx` | Modified | Add manifest, theme and Apple home-screen metadata and mount the shared install/update component. |
| `web-app/app/manifest.ts` | Added | Generate UrbanHelpHub root-scope standalone manifest using the existing navy/white branding and PNG icons. |
| `web-app/components/MessagesPanel.tsx` | Added | Use existing permission-scoped message listing and sending APIs; load on user request because listing marks messages read; add real errors and disabled/loading feedback. |
| `web-app/components/NotificationBell.tsx` | Modified | Add expanded state, unique panel association, Escape/pointer support, busy/error states, response checks, no-store requests and mapping of missing message routes to existing dashboard sections. |
| `web-app/components/PwaSupport.tsx` | Added | Register and update the worker, capture install availability, open native prompts only after click, detect standalone mode, provide iOS Safari instructions and persist dismissal. |
| `web-app/components/RegionSelector.tsx` | Modified | Preserve the preference APIs; support touch-friendly outside closing and Escape with focus restoration. |
| `web-app/lib/dashboard-navigation.ts` | Added | Share hash/section navigation, active state, focus management and deferred deep-link handling after authenticated data loads. |
| `web-app/next.config.ts` | Modified | Serve sw.js with no-store, root scope permission and nosniff; request manifest revalidation. |
| `web-app/public/icons/icon-192.png` | Added | 192×192 PNG made by fitting the unchanged existing logo on white. |
| `web-app/public/icons/icon-512.png` | Added | 512×512 PNG made by fitting the unchanged existing logo on white. |
| `web-app/public/icons/icon-maskable-512.png` | Added | 512×512 opaque PNG with the unchanged logo fully inside the maskable safe zone. |
| `web-app/public/offline.html` | Added | Provide a self-contained, data-free offline homepage fallback with a retry link. |
| `web-app/public/sw.js` | Added | Cache only the offline document and three icons; bypass all private/API/Stripe/Next requests, keep the homepage network-first and activate updates without reloading private flows. |
| `web-app/tests/service-worker.test.mjs` | Added | Six Node tests cover the exact public allowlist, credential omission, private-request bypass, stale cache cleanup, safe offline fallback and fresh online responses. |

Inline comments now explain hash subscriptions and keyboard focus, permission-scoped message requests, legacy notification paths, installation eligibility, hydration-safe browser state, and worker update/cache boundaries. No runtime behavior changed during this documentation follow-up.
