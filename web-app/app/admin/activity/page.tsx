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
  const activityColumns = "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.65fr)]";
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
          className="my-6 grid items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,14rem)_minmax(0,14rem)_auto] lg:justify-start"
          onSubmit={(event) => { event.preventDefault(); load("", { actor: actor.trim(), source }); }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Administrator user ID
            <input className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={actor} onChange={(event) => setActor(event.target.value)} inputMode="numeric" pattern="[1-9][0-9]*" placeholder="All administrators" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Activity type
            <select className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="">All activity</option>
              {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="min-h-11 rounded-lg bg-[#082f5b] px-4 py-2 text-sm font-bold text-white sm:col-span-2 lg:col-span-1" type="submit">Apply filters</button>
        </form>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-4 text-red-800">
            <p>{error}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => load(query.cursor)}>Try again</button>
          </div>
        ) : !result ? <p role="status">Loading activity…</p> : (
          <section className="rounded-2xl border border-slate-200 bg-white" aria-label="Activity results">
            {result.data.length ? (
              <>
                <div aria-hidden="true" className={`hidden gap-4 rounded-t-2xl bg-slate-100 px-4 py-3 text-sm font-bold lg:grid ${activityColumns}`}>
                  <span>Time</span><span>Administrator</span><span>Action</span><span>Record</span><span>Result</span>
                </div>
                <ul role="list" className="divide-y divide-slate-200">
                  {result.data.map((event) => (
                    <li key={`${event.source}-${event.event_id}`}>
                      <dl className={`grid gap-x-4 gap-y-3 p-4 text-sm sm:grid-cols-2 ${activityColumns}`}>
                        <div>
                          <dt className="text-xs font-semibold text-slate-600 lg:sr-only">Time</dt>
                          <dd><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-slate-600 lg:sr-only">Administrator</dt>
                          <dd>
                            <p className="font-semibold">{event.actor_name ?? "Administrator"} (#{event.actor_user_id})</p>
                            <p className="text-slate-600">{event.actor_role === "super_admin" ? "Super Admin" : "Admin"}</p>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-slate-600 lg:sr-only">Action</dt>
                          <dd>{describeAction(event)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-slate-600 lg:sr-only">Record</dt>
                          <dd>
                            {event.source !== "request" && <p>{event.resource}</p>}
                            {event.target != null ? (event.source === "request" ? event.target : `#${event.target}`) : event.source === "request" ? "—" : null}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-slate-600 lg:sr-only">Result</dt>
                          <dd>{event.response_status ? `HTTP ${event.response_status}` : "Recorded"}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="p-5 text-slate-600">No activity matches these filters.</p>}
            {(result.previous_cursor || result.next_cursor) && (
              <nav aria-label="Activity pages" className="flex flex-wrap justify-between gap-2 border-t border-slate-200 p-4 text-sm font-semibold">
                <button type="button" className="min-h-11 px-2 underline disabled:no-underline disabled:opacity-40" disabled={!result.previous_cursor} onClick={() => load(result.previous_cursor ?? "")}>Newer activity</button>
                <button type="button" className="min-h-11 px-2 underline disabled:no-underline disabled:opacity-40" disabled={!result.next_cursor} onClick={() => load(result.next_cursor ?? "")}>Older activity</button>
              </nav>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
