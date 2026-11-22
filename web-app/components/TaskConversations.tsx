"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type Message = {
  id: number;
  sender_id: number;
  sender_name?: string;
  message: string;
  created_at?: string | null;
};
type Thread = {
  task_id: number;
  title?: string;
  customer_name?: string;
  helper_name?: string;
  status?: string | null;
  chat_locked_at?: string | null;
  locked?: boolean;
  is_locked?: boolean;
  messages: Message[];
};
type CurrentUser = { id: number; role: string; name: string };

function token() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}
function authHeaders() {
  const current = token();
  return { Accept: "application/json", Authorization: `Bearer ${current || ""}` };
}
function messageTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}
function isLocked(thread: Thread, status: string | undefined) {
  return Boolean(thread.chat_locked_at || thread.locked || thread.is_locked || ["completed", "cancelled", "rejected"].includes(status || thread.status || ""));
}

export default function TaskConversations({ role }: { role: "customer" | "helper" }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [taskStates, setTaskStates] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dashboard = role === "customer" ? "/dashboard" : "/helper/dashboard";

  const refresh = useCallback(async () => {
    if (!token()) { router.replace("/login"); return; }
    setError("");
    try {
      const [meResponse, threadsResponse] = await Promise.all([
        fetch(`${API_URL}/user`, { headers: authHeaders(), cache: "no-store" }),
        fetch(`${API_URL}/messages`, { headers: authHeaders(), cache: "no-store" }),
      ]);
      if (meResponse.status === 401 || threadsResponse.status === 401) { router.replace("/login"); return; }
      const meResult = await meResponse.json();
      if (!meResponse.ok || !meResult?.data?.user) throw new Error(meResult.message || "Unable to verify your account.");
      const current: CurrentUser = meResult.data.user;
      if (current.role !== role) { router.replace(current.role === "helper" ? "/helper/dashboard" : current.role === "customer" ? "/dashboard" : "/admin"); return; }
      setUser(current);
      const result = await threadsResponse.json();
      if (!threadsResponse.ok || result.success === false) throw new Error(result.message || "Unable to load conversations.");
      const raw = Array.isArray(result.data) ? result.data : (result.data?.conversations || []);
      if (!Array.isArray(raw)) throw new Error("Unexpected conversations response from the API.");
      const normalized: Thread[] = raw.filter((t: Thread) => Number.isFinite(Number(t.task_id))).map((t: Thread) => ({ ...t, task_id: Number(t.task_id), messages: Array.isArray(t.messages) ? t.messages : [] }));
      setThreads(normalized);
      setSelected((prior) => normalized.some((t) => t.task_id === prior) ? prior : normalized[0]?.task_id ?? null);
      // Independently check task state so a completed conversation remains read-only
      // even if the messages API has not yet added a `chat_locked_at` field.
      try {
        const url = role === "customer" ? "customer/tasks" : "helper/jobs";
        const stateResponse = await fetch(`${API_URL}/${url}`, { headers: authHeaders(), cache: "no-store" });
        if (stateResponse.ok) {
          const stateResult = await stateResponse.json();
          const items = Array.isArray(stateResult.data) ? stateResult.data : [];
          const states: Record<number, string> = {};
          for (const task of items) {
            const id = Number(role === "customer" ? task.id : task.task_id);
            if (id) states[id] = task.chat_locked_at ? "completed" : (role === "customer" ? task.status : (task.assignment_status || task.status || ""));
          }
          setTaskStates(states);
        }
      } catch { /* The API remains authoritative for all message permissions. */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load messages.");
    } finally { setLoading(false); }
  }, [role, router]);

  useEffect(() => { void refresh(); }, [refresh]);
  const thread = useMemo(() => threads.find((t) => t.task_id === selected) || null, [threads, selected]);
  const locked = thread ? isLocked(thread, taskStates[thread.task_id]) : true;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread || locked || !draft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/tasks/${thread.task_id}/messages`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ message: draft.trim() }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || "Unable to send your message.");
      setDraft("");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to send your message."); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#082f5b]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href={dashboard} className="text-lg font-bold">UrbanHelpHub</a>
          <a href={dashboard} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50">← Back to {role === "customer" ? "Customer" : "Helper"} Dashboard</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{role} workspace</p><h1 className="mt-1 text-3xl font-bold">Messages</h1><p className="mt-1 text-sm text-slate-500">Only participants in a confirmed task can access its conversation.</p></div>
          <button type="button" onClick={() => void refresh()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50">Refresh</button>
        </div>
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        {loading ? <p className="rounded-xl bg-white p-6">Loading conversations…</p> : !threads.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-xl font-bold">No conversations yet</h2><p className="mt-2 text-sm text-slate-500">A conversation becomes available after a customer confirms a Helper for a task.</p></div>
        ) : (
          <div className="grid min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[280px_1fr]">
            <nav className="border-b border-slate-200 md:border-b-0 md:border-r" aria-label="Task conversations">
              {threads.map((item) => <button key={item.task_id} type="button" onClick={() => { setSelected(item.task_id); setDraft(""); }} className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${item.task_id === selected ? "bg-emerald-50" : ""}`} aria-current={item.task_id === selected ? "true" : undefined}>
                <span className="block font-bold">{item.title || `Task #${item.task_id}`}</span>
                <span className="mt-1 block text-xs text-slate-500">{role === "customer" ? item.helper_name || "Helper" : item.customer_name || "Customer"}</span>
                {isLocked(item, taskStates[item.task_id]) && <span className="mt-1 block text-xs font-semibold text-slate-600">Read-only</span>}
              </button>)}
            </nav>
            <section className="flex min-h-[500px] flex-col" aria-label="Selected task messages">
              <div className="border-b border-slate-100 p-4"><h2 className="font-bold">{thread?.title || "Conversation"}</h2><p className="mt-1 text-xs text-slate-500">{locked ? "Conversation is read-only following task completion or closure." : "Messages are visible only to the assigned participants."}</p></div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
                {thread?.messages.length ? thread.messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-xl p-3 text-sm shadow-sm ${message.sender_id === user?.id ? "ml-auto bg-emerald-100" : "bg-white"}`}><p className="mb-1 text-xs font-bold">{message.sender_name || (message.sender_id === user?.id ? "You" : "Participant")}</p><p className="whitespace-pre-wrap break-words">{message.message}</p><p className="mt-2 text-[11px] text-slate-500">{messageTime(message.created_at)}</p></div>) : <p className="text-sm text-slate-500">No messages yet for this task.</p>}
              </div>
              {locked ? <p className="border-t border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">This conversation is locked. You can read the history but cannot send new messages.</p> : <form onSubmit={send} className="flex items-end gap-3 border-t border-slate-200 p-4"><label className="flex-1 text-sm font-bold">Message<textarea required maxLength={2000} value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2 font-normal" placeholder="Write a message to the confirmed participant…" /></label><button type="submit" disabled={busy || !draft.trim()} className="rounded-xl bg-[#082f5b] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send"}</button></form>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
