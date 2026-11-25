"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type AdminAccount = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "suspended";
};

type AdministratorAuditEvent = {
  id: number;
  actor_user_id: number;
  actor_name: string;
  administrator_user_id: number;
  administrator_name: string;
  action: "created" | "activated" | "suspended";
  created_at: string;
};

type ApiResult = {
  success?: boolean;
  message?: string;
  data?: AdminAccount[] | { administrators?: AdminAccount[]; users?: AdminAccount[] };
  audit_events?: AdministratorAuditEvent[];
  errors?: Record<string, string[]>;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}

function authenticatedHeaders(): HeadersInit {
  return { Accept: "application/json", Authorization: `Bearer ${getToken() || ""}` };
}

async function readResult(response: Response): Promise<ApiResult> {
  const body = await response.json().catch(() => null) as ApiResult | null;
  if (!body || typeof body !== "object") {
    throw new Error(`Unexpected API response (HTTP ${response.status}).`);
  }
  if (!response.ok || body.success === false) {
    const firstValidation = body.errors && Object.values(body.errors).flat()[0];
    throw new Error(firstValidation || body.message || `Request failed (HTTP ${response.status}).`);
  }
  return body;
}

function EditableAccount({
  account,
  onSaved,
  onAuthRequired,
}: {
  account: AdminAccount;
  onSaved: () => Promise<void>;
  onAuthRequired: () => void;
}) {
  const [status, setStatus] = useState<"active" | "suspended">(account.status);
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !currentPassword || status === account.status) return;
    const action = status === "active" ? "activate" : "suspend";
    if (!window.confirm(`Confirm you want to ${action} the Admin account for ${account.email}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/admin/administrators/${account.id}`, {
        method: "PUT",
        headers: { ...authenticatedHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          role: "admin",
          status,
        }),
      });
      if (response.status === 401) { onAuthRequired(); return; }
      await readResult(response);
      setCurrentPassword("");
      setNotice("The administrator account was updated successfully.");
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update administrator.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div>
        <p className="font-bold">{account.name}</p>
        <p className="break-all text-sm text-slate-600">{account.email}</p>
        <p className="mt-1 text-xs text-slate-500">{account.role} · {account.status}</p>
      </div>
      <label className="block text-sm font-bold" htmlFor={`status-${account.id}`}>
        Account status
        <select id={`status-${account.id}`} value={status} onChange={(event) => setStatus(event.target.value as "active" | "suspended")} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal">
          <option value="suspended">Suspended (cannot log in)</option>
          <option value="active">Active</option>
        </select>
      </label>
      <label className="block text-sm font-bold" htmlFor={`password-${account.id}`}>
        Your current Super Admin password to approve this change
        <input id={`password-${account.id}`} type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
      </label>
      {error && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      <button type="submit" disabled={busy || status === account.status} className="w-full rounded-xl bg-[#082f5b] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        {busy ? "Saving…" : "Save account status"}
      </button>
    </form>
  );
}

export default function AdministratorManagement() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdministratorAuditEvent[]>([]);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) { router.replace("/login"); return; }
    setChecking(true);
    setError("");
    try {
      const me = await fetch(`${API_URL}/user`, { headers: authenticatedHeaders(), cache: "no-store" });
      if (me.status === 401) { router.replace("/login"); return; }
      const meBody = await me.json();
      if (!me.ok || meBody?.data?.user?.role !== "super_admin" || meBody?.data?.user?.status !== "active") {
        router.replace("/admin");
        return;
      }
      const response = await fetch(`${API_URL}/admin/administrators`, { headers: authenticatedHeaders(), cache: "no-store" });
      if (response.status === 401) { router.replace("/login"); return; }
      const result = await readResult(response);
      const rows = Array.isArray(result.data) ? result.data : (result.data?.administrators || result.data?.users || null);
      if (!Array.isArray(rows)) throw new Error("UrbanHelpHub returned an unexpected response for administrator accounts.");
      setAccounts(rows.filter((row: AdminAccount) => row.role === "admin" || row.role === "super_admin"));
      setAuditEvents(result.audit_events ?? []);
      setBackendReady(true);
    } catch (cause) {
      setBackendReady(false);
      setError(cause instanceof Error ? cause.message : "Unable to load administrator management.");
    } finally { setChecking(false); }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!backendReady || busy) return;
    if (password !== passwordConfirmation) {
      setError("The temporary password and confirmation must match.");
      return;
    }
    if (password.length < 14) {
      setError("Use a temporary password of at least 14 characters.");
      return;
    }
    if (!currentPassword) {
      setError("Your current Super Admin password is required.");
      return;
    }
    if (!window.confirm(`Create a suspended Admin account for ${email.trim()}? You can activate it after reviewing the account.`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/admin/administrators`, {
        method: "POST", headers: { ...authenticatedHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          name: name.trim(), email: email.trim(),
          password, password_confirmation: passwordConfirmation,
        }),
      });
      if (response.status === 401) { router.replace("/login"); return; }
      await readResult(response);
      setPassword(""); setPasswordConfirmation(""); setCurrentPassword("");
      setNotice("Administrator created in suspended status. Review the account and activate it when ready.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create administrator.");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#082f5b]">
      <header className="bg-[#082f5b] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="font-bold">UrbanHelpHub · Super Admin</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold underline">
            <a href="/admin/activity/">Activity log</a>
            <a href="/admin/">Admin dashboard</a>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-9">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Administrator management</h1>
            <p className="mt-2 text-sm text-slate-600">Create, activate or suspend Admin accounts and review recent account activity.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold">Refresh</button>
        </div>
        {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p>}
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        {checking ? <p>Verifying Super Admin access…</p> : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Create Admin User</h2>
              <p className="mt-2 text-sm text-slate-500">New Admin accounts start suspended. Once activated, Admins can run marketplace operations, including PayPal payouts. Only Super Admins can manage administrator accounts.</p>
              {!backendReady && <p className="mt-4 text-sm text-amber-800">Account creation is available after the server verifies your Super Admin access.</p>}
              <form onSubmit={createAccount} className="mt-5 space-y-4">
                <label className="block text-sm font-bold" htmlFor="new-name">Full name
                  <input id="new-name" required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
                <label className="block text-sm font-bold" htmlFor="new-email">Email
                  <input id="new-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
                <label className="block text-sm font-bold" htmlFor="new-password">Temporary password (minimum 14 characters)
                  <input id="new-password" type="password" required minLength={14} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
                <label className="block text-sm font-bold" htmlFor="new-password-confirmation">Confirm temporary password
                  <input id="new-password-confirmation" type="password" required minLength={14} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
                <label className="block text-sm font-bold" htmlFor="owner-password">Your current Super Admin password
                  <input id="owner-password" type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
                <button type="submit" disabled={!backendReady || busy} className="w-full rounded-xl bg-[#082f5b] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? "Creating…" : "Create suspended Admin"}
                </button>
              </form>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Administrator accounts</h2>
              <p className="mt-1 text-sm text-slate-500">Activate or suspend an Admin account below. Super Admin accounts are listed for reference.</p>
              <div className="mt-5 space-y-4">
                {accounts.map((account) => account.role === "admin" ? (
                  <EditableAccount key={account.id} account={account} onSaved={load} onAuthRequired={() => router.replace("/login")} />
                ) : (
                  <article key={account.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold">{account.name} <span className="text-xs text-slate-500">(Super Admin)</span></p>
                    <p className="mt-1 break-all text-sm text-slate-600">{account.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{account.role} · {account.status}</p>
                  </article>
                ))}
                {backendReady && accounts.length === 0 && <p className="text-sm text-slate-500">No administrator records returned.</p>}
              </div>
            </section>
          </div>
        )}
        {backendReady && !checking && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Recent administrator account activity</h2>
            {auditEvents.length ? (
              <ul className="mt-4 divide-y divide-slate-200 text-sm">
                {auditEvents.map((event) => (
                  <li key={event.id} className="py-3">
                    <p>
                      <strong>{event.actor_name}</strong> (#{event.actor_user_id}) {event.action}{" "}
                      <strong>{event.administrator_name}</strong> (#{event.administrator_user_id}).
                    </p>
                    <time dateTime={event.created_at} className="text-slate-500">
                      {new Date(event.created_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-slate-500">No account activity recorded yet.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
