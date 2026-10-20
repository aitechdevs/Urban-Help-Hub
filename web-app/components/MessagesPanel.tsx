"use client";

import { FormEvent, useState } from "react";
import { API_URL } from "@/lib/api";

// Response shape of the existing GET /api/messages endpoint.
type Conversation = {
  task_id: number;
  title: string;
  customer_name: string;
  helper_name: string;
  messages: { id: number; sender_name: string; message: string; created_at: string }[];
};

// GET /messages marks messages read, so fetch only after an explicit user action.
export default function MessagesPanel() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const conversation = conversations?.find((item) => String(item.task_id) === selected);

  // Reuse the application’s existing auth storage; never persist messages offline.
  function headers() {
    const token = sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
    if (!token) throw new Error("Please sign in to view messages.");
    return { Accept: "application/json", Authorization: `Bearer ${token}` };
  }

  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/messages`, { headers: headers(), cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load conversations.");
      setConversations(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load conversations.");
    } finally {
      setBusy(false);
    }
  }

  // The API checks task membership. Reload only after a successful write.
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!conversation || !draft.trim() || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/tasks/${conversation.task_id}/messages`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ message: draft.trim() }),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to send your message.");
      setDraft("");
      setNotice("Message sent.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send your message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <button type="button" onClick={load} disabled={busy} aria-busy={busy}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-[var(--navy)] disabled:opacity-50">
        {busy ? "Loading…" : conversations ? "Refresh conversations" : "Open conversations"}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-green-700">{notice}</p>}
      {conversations?.length === 0 && <p className="mt-4 text-sm text-slate-500">No conversations yet. Messages become available once a Helper is confirmed for a task.</p>}
      {!!conversations?.length && (
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-bold text-[var(--navy)]">
            Conversation
            <select className="input mt-2" aria-label="Conversation" value={selected} disabled={busy}
              onChange={(event) => { setSelected(event.target.value); setDraft(""); setNotice(""); }}>
              <option value="">Choose a task</option>
              {conversations.map((item) => <option key={item.task_id} value={item.task_id}>{item.title} — {item.customer_name} / {item.helper_name}</option>)}
            </select>
          </label>
          {conversation && (
            <>
              <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3" aria-label="Conversation messages">
                {conversation.messages.length === 0 && <p className="text-sm text-slate-500">No messages in this conversation yet.</p>}
                {conversation.messages.map((message) => (
                  <article key={message.id} className="rounded-xl bg-white p-3 text-sm">
                    <p className="font-bold text-[var(--navy)]">{message.sender_name}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{message.message}</p>
                  </article>
                ))}
              </div>
              <form onSubmit={send} className="space-y-3">
                <label className="block text-sm font-bold text-[var(--navy)]">
                  Message
                  <textarea className="input mt-2" value={draft} maxLength={2000} required disabled={busy}
                    onChange={(event) => setDraft(event.target.value)} rows={3} />
                </label>
                <button type="submit" disabled={busy || !draft.trim()} aria-busy={busy}
                  className="rounded-xl bg-[var(--green)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  {busy ? "Sending…" : "Send message"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
