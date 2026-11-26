"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import SuperAdminHeader from "@/components/SuperAdminHeader";

type Source = "request" | "account" | "payout";

type Activity = {
  event_id: number;
  source: Source;
  actor_user_id: number;
  actor_name: string | null;
  actor_role: "admin" | "super_admin";
  created_at: string;
  action: string;
  resource: string;
  target: string | number | null;
  response_status: number | null;
};

type ActivityPage = {
  data: Activity[];
  next_cursor: string | null;
  previous_cursor: string | null;
};

const sourceLabels: Record<Source, string> = {
  request: "Admin requests",
  account: "Administrator accounts",
  payout: "PayPal payouts",
};

const actionLabels: Record<string, string> = {
  created: "Created account",
  activated: "Activated account",
  suspended: "Suspended account",
  released: "Released payout",
  submission_started: "Started payout submission",
  submitted: "Submitted payout",
  refreshed: "Refreshed payout",
};

function describeAction(event: Activity) {
  if (event.source !== "request") {
    return actionLabels[event.action] ?? event.action;
  }

  if (event.resource === "api/login") return "Signed in";
  if (event.resource === "api/logout" && event.response_status === 200) return "Signed out";

  return `${event.action} /${event.resource}`;
}

export default function AdminActivity() {
  const [actor, setActor] = useState("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState({ actor: "", source: "", cursor: "", revision: 0 });
  const [result, setResult] = useState<ActivityPage | null>(null);
  const [error, setError] = useState("");

  function load(cursor = "", filters = { actor: query.actor, source: query.source }) {
    setError("");
    setResult(null);
    setQuery({ ...filters, cursor, revision: query.revision + 1 });
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);

    async function fetchActivity() {
      try {
        const token = sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
        if (!token) {
          window.location.replace("/login/");
          return;
        }

        const params = new URLSearchParams();
        if (query.actor) params.set("actor", query.actor);
        if (query.source) params.set("source", query.source);
        if (query.cursor) params.set("cursor", query.cursor);
        const response = await fetch(`${API_URL}/admin/activity?${params}`, {
          cache: "no-store",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403) {
          window.location.replace(response.status === 401 ? "/login/" : "/admin/");
          return;
        }
        if (!response.ok) throw new Error(`Could not load the activity log (HTTP ${response.status}).`);
        const body: ActivityPage = await response.json();
        if (!Array.isArray(body.data)) throw new Error("UrbanHelpHub returned an unexpected response.");
        if (!controller.signal.aborted) setResult(body);
      } catch (cause) {
        if (controller.signal.reason === "timeout") {
          setError("The activity log took too long to load.");
        } else if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load the activity log.");
        }
      }
    }

    void fetchActivity();
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#082f5b]">
      <SuperAdminHeader />

      <div className="mx-auto max-w-6xl px-5 py-9">
        <h1 className="text-3xl font-bold">Administrator activity</h1>
        <form
          className="my-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4"
          onSubmit={(event) => { event.preventDefault(); load("", { actor: actor.trim(), source }); }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Administrator user ID
            <input className="rounded-lg border border-slate-300 px-3 py-2 font-normal" value={actor} onChange={(event) => setActor(event.target.value)} inputMode="numeric" pattern="[1-9][0-9]*" placeholder="All administrators" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Activity type
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="">All activity</option>
              {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="rounded-lg bg-[#082f5b] px-4 py-2 text-sm font-bold text-white" type="submit">Apply filters</button>
        </form>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-4 text-red-800">
            <p>{error}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => load(query.cursor)}>Try again</button>
          </div>
        ) : !result ? <p role="status">Loading activity…</p> : (
          <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white" aria-label="Activity results">
            {result.data.length ? (
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th scope="col" className="p-4">Time</th>
                    <th scope="col" className="p-4">Administrator</th>
                    <th scope="col" className="p-4">Action</th>
                    <th scope="col" className="p-4">Record</th>
                    <th scope="col" className="p-4">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((event) => (
                    <tr key={`${event.source}-${event.event_id}`} className="border-t border-slate-100 align-top">
                      <td className="min-w-36 p-4"><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></td>
                      <td className="min-w-36 p-4">
                        <p className="font-semibold">{event.actor_name ?? "Administrator"} (#{event.actor_user_id})</p>
                        <p className="text-slate-600">{event.actor_role === "super_admin" ? "Super Admin" : "Admin"}</p>
                      </td>
                      <td className="p-4 break-words">{describeAction(event)}</td>
                      <td className="p-4">
                        {event.source !== "request" && <p>{event.resource}</p>}
                        {event.target != null && (event.source === "request" ? event.target : `#${event.target}`)}
                      </td>
                      <td className="p-4">{event.response_status ? `HTTP ${event.response_status}` : "Recorded"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="p-5 text-slate-600">No activity matches these filters.</p>}
            {(result.previous_cursor || result.next_cursor) && (
              <nav aria-label="Activity pages" className="flex justify-between border-t border-slate-200 p-4 text-sm font-semibold">
                <button type="button" className="underline disabled:no-underline disabled:opacity-40" disabled={!result.previous_cursor} onClick={() => load(result.previous_cursor ?? "")}>Newer activity</button>
                <button type="button" className="underline disabled:no-underline disabled:opacity-40" disabled={!result.next_cursor} onClick={() => load(result.next_cursor ?? "")}>Older activity</button>
              </nav>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
