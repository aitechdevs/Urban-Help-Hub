"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Store only a user preference, never credentials or account data.
const DISMISS_KEY = "urbanhelphub-install-dismissed-v1";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

// iPadOS may identify itself as a Mac; touch capability distinguishes tablets.
function installStatus() {
  if (isStandalone()) return "hidden";
  try { if (localStorage.getItem(DISMISS_KEY) === "1") return "hidden"; } catch { /* Storage is optional. */ }
  const safari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/.test(navigator.userAgent);
  const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return appleMobile && safari ? "ios" : "browser";
}

function subscribeStatus(callback: () => void) {
  const display = window.matchMedia("(display-mode: standalone)");
  display.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => { display.removeEventListener("change", callback); window.removeEventListener("storage", callback); };
}

export default function PwaSupport() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  // The server snapshot is hidden to avoid hydration mismatches and prompt flashes.
  const status = useSyncExternalStore(subscribeStatus, installStatus, () => "hidden");
  const ios = status === "ios";
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === "1"; } catch { /* Storage can be unavailable in private browsing. */ }

    // Keep the browser event for one user-initiated native prompt.
    function beforeInstall(event: Event) {
      event.preventDefault();
      if (!dismissed && !isStandalone()) setInstallEvent(event as InstallEvent);
    }
    function appInstalled() { setHidden(true); setInstallEvent(null); }
    const display = window.matchMedia("(display-mode: standalone)");
    function displayChanged() { if (isStandalone()) appInstalled(); }
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    display.addEventListener("change", displayChanged);

    let registration: ServiceWorkerRegistration | undefined;
    let disposed = false;
    function checkForUpdate() {
      if (document.visibilityState === "visible") void registration?.update().catch(() => {});
    }
    // Development stays worker-free; update checks never force a page reload.
    if ("serviceWorker" in navigator && window.isSecureContext && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((result) => { if (!disposed) { registration = result; checkForUpdate(); } })
        .catch(() => { /* A blocked service worker must not break the application. */ });
    }
    document.addEventListener("visibilitychange", checkForUpdate);
    const updateTimer = window.setInterval(checkForUpdate, 60 * 60 * 1000);
    return () => {
      disposed = true;
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
      display.removeEventListener("change", displayChanged);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.clearInterval(updateTimer);
    };
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* Hide for this visit even if storage is blocked. */ }
    setHidden(true);
    setInstallEvent(null);
  }

  // Browser eligibility is required: this handler cannot force installation.
  async function install() {
    if (!installEvent || busy || isStandalone()) return;
    setBusy(true);
    setError("");
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setHidden(true);
      else dismiss();
      setInstallEvent(null);
    } catch {
      setError("Installation is unavailable right now. Please try again later.");
      setInstallEvent(null);
    } finally {
      setBusy(false);
    }
  }

  if (status === "hidden" || hidden || (!installEvent && !ios && !error)) return null;
  return (
    <aside aria-label="Install UrbanHelpHub" className="fixed bottom-4 right-4 z-[100] max-w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--navy)]">Install UrbanHelpHub</p>
          {ios ? <p className="mt-1 text-sm text-slate-600">In Safari, tap Share, then Add to Home Screen.</p> :
            <p className="mt-1 text-xs text-slate-500">Keep local help one tap away.</p>}
          {installEvent && <button type="button" onClick={install} disabled={busy} aria-busy={busy}
            className="mt-3 rounded-xl bg-[var(--green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Opening…" : "Install app"}
          </button>}
          {error && <p role="status" className="mt-2 text-sm text-slate-600">{error}</p>}
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss installation suggestion"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">×</button>
      </div>
    </aside>
  );
}
