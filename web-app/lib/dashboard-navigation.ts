"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

/** Shares section selection without changing routes or fetching account data.
 * Destinations must expose an id and tabIndex=-1 so keyboard focus follows navigation.
 */
export function useDashboardNavigation(defaultSection = "overview") {
  const section = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1) || defaultSection,
    () => defaultSection,
  );

  useEffect(() => {
    if (!window.location.hash) return;
    function focusTarget() {
      const target = document.getElementById(section);
      if (!target) return false;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
      return true;
    }
    if (focusTarget()) return;
    // Authenticated dashboards render after their data arrives.
    const observer = new MutationObserver(() => { if (focusTarget()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [section]);

  function navigate(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    // replaceState does not emit hashchange; notify subscribers explicitly.
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }

  return { section, navigate };
}
