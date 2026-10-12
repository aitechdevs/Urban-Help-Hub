"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
};

function token() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const container = useRef<HTMLDivElement>(null);

  async function load() {
    const authToken = token();
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error("Unable to load notifications.");
      if (response.ok && payload.success) {
        setError("");
        setItems(payload.data.notifications || []);
        setUnread(Number(payload.data.unread_count || 0));
      }
    } catch {
      setError("Unable to load notifications. Try refreshing them.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 30000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  // Keep read state consistent with the API before following a notification.
  async function markRead(item: NotificationItem) {
    if (busy) return;
    setBusy(String(item.id));
    setError("");
    try {
      if (!item.read_at) {
        const authToken = token();
        const response = await fetch(`${API_URL}/notifications/${item.id}/read`, {
          method: "PUT", cache: "no-store",
          headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error("Unable to mark the notification read.");
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
        setUnread((current) => Math.max(0, current - 1));
      }
      if (item.action_url) {
        const url = new URL(item.action_url, window.location.origin);
        if (url.origin !== window.location.origin) throw new Error("This notification link is unavailable.");
        // The backend emits legacy message paths; use the implemented dashboard panels.
        const path = url.pathname === "/messages" ? "/dashboard" : url.pathname === "/helper/messages" ? "/helper/dashboard" : url.pathname;
        const hash = path !== url.pathname ? "#messages" : url.hash;
        router.push(path + url.search + hash);
        setOpen(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open notification.");
    } finally { setBusy(null); }
  }

  async function markAllRead() {
    if (busy) return;
    setBusy("all");
    setError("");
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT", cache: "no-store",
        headers: { Accept: "application/json", Authorization: `Bearer ${token()}` },
      });
      if (!response.ok) throw new Error("Unable to mark notifications read.");
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      setUnread(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update notifications.");
    } finally { setBusy(null); }
  }

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        aria-expanded={open}
        aria-controls={panelId}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-xl text-[#082f5b] transition hover:bg-slate-50"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <span aria-hidden="true" className="text-base">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div id={panelId} className="absolute right-0 top-12 z-[80] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-black text-[#082f5b]">Notifications</p>
              <p className="text-xs text-slate-500">{unread} unread</p>
            </div>
            {unread > 0 && <button type="button" onClick={markAllRead} disabled={!!busy} aria-busy={busy === "all"} className="text-xs font-bold text-green-700 hover:underline">Mark all read</button>}
          </div>
          {error && <div className="p-4 text-sm text-red-700"><p role="alert">{error}</p><button type="button" onClick={load} disabled={!!busy} className="mt-2 font-bold underline">Refresh notifications</button></div>}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-slate-500">Loading notifications…</p>
            ) : items.length === 0 ? (
              <div className="p-8 text-center"><p className="text-2xl">🔔</p><p className="mt-2 font-bold text-[#082f5b]">No notifications yet</p></div>
            ) : items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item)}
                disabled={!!busy}
                aria-busy={busy === String(item.id)}
                className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${item.read_at ? "bg-white" : "bg-green-50/60"}`}
              >
                <div className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read_at ? "bg-slate-200" : "bg-green-500"}`} />
                  <span>
                    <span className="block text-sm font-black text-[#082f5b]">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">{item.message}</span>
                    <span className="mt-2 block text-xs font-semibold text-slate-400">{timeAgo(item.created_at)}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
