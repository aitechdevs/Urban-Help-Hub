"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type AdminAccount = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "suspended";
  permissions?: string[];
};

type ApiResult = {
  success?: boolean;
  message?: string;
  data?: AdminAccount[] | { administrators?: AdminAccount[]; users?: AdminAccount[] };
  allowed_permissions?: string[];
  errors?: Record<string, string[]>;
};

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "View administrator dashboard",
  "customers.view": "View customers",
  "helpers.view": "View helpers",
  "tasks.view": "View tasks",
  "payments.view": "View payments",
  "tasks.approve": "Approve/reject customer tasks",
  "helpers.verify": "Verify helpers",
  "helpers.services.review": "Review helper services",
  "helpers.documents.review": "Review helper documents",
  "helpers.manage": "Manage helper accounts",
  "profiles.review": "Review customer profiles",
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

function PermissionPicker({
  allowed,
  selected,
  onChange,
  idPrefix,
}: {
  allowed: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
}) {
  return (
    <fieldset className="space-y-2 rounded-xl border border-slate-200 p-4">
      <legend className="px-2 text-sm font-bold">Restricted permissions</legend>
      {allowed.map((code) => (
        <label key={code} htmlFor={`${idPrefix}-${code}`} className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            id={`${idPrefix}-${code}`}
            type="checkbox"
            className="mt-1"
            checked={selected.includes(code)}
            onChange={(event) =>
              onChange(event.target.checked ? [...selected, code] : selected.filter((v) => v !== code))
            }
          />
          <span>{PERMISSION_LABELS[code] || code} <span className="text-xs text-slate-500">({code})</span></span>
        </label>
      ))}
      {allowed.length === 0 && (
        <p className="text-sm text-amber-700">No permissible actions were returned by Laravel.</p>
      )}
    </fieldset>
  );
}

function EditableAccount({
  account,
  allowed,
  onSaved,
  onAuthRequired,
}: {
  account: AdminAccount;
  allowed: string[];
  onSaved: () => Promise<void>;
  onAuthRequired: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(account.permissions || []);
  const [status, setStatus] = useState<"active" | "suspended">(account.status);
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !currentPassword) return;
    const statusChanged = status !== account.status;
    const action = status === "active" ? "activate" : "suspend";
    if (!window.confirm(`Save permissions${statusChanged ? ` and ${action} this account` : ""} for ${account.email}?`)) return;
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
          permissions: selected,
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
      <PermissionPicker allowed={allowed} selected={selected} onChange={setSelected} idPrefix={`existing-${account.id}`} />
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
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#082f5b] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        {busy ? "Saving…" : "Save account permissions / status"}
      </button>
    </form>
  );
}

export default function AdministratorManagement() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [allowed, setAllowed] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["dashboard.view"]);
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
      if (!Array.isArray(rows)) throw new Error("Unexpected administrators response from Laravel.");
      if (!Array.isArray(result.allowed_permissions)) throw new Error("Laravel did not provide its allowed_permissions list.");
      setAccounts(rows.filter((row: AdminAccount) => row.role === "admin" || row.role === "super_admin"));
      setAllowed(result.allowed_permissions);
      setBackendReady(true);
    } catch (cause) {
      setBackendReady(false);
      setError(cause instanceof Error ? cause.message : "Unable to load administrator management.");
    } finally { setChecking(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!backendReady || busy) return;
    if (password !== passwordConfirmation) {
      setError("The temporary password and confirmation must match.");
      return;
    }
    if (password.length < 14) {
      setError("Laravel requires a temporary password of at least 14 characters.");
      return;
    }
    if (!currentPassword) {
      setError("Your current Super Admin password is required.");
      return;
    }
    if (!window.confirm(`Create a SUSPENDED restricted Admin account for ${email.trim()}? Activate it separately after reviewing the permissions.`)) return;
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
          permissions,
        }),
      });
      if (response.status === 401) { router.replace("/login"); return; }
      await readResult(response);
      setPassword(""); setPasswordConfirmation(""); setCurrentPassword("");
      setName(""); setEmail(""); setPermissions(["dashboard.view"]);
      setNotice("Administrator created in suspended status. Review the permissions and activate the account below when ready.");
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
          <a className="text-sm font-semibold underline" href="/admin">Back to Admin Dashboard</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-9">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Administrator management</h1>
            <p className="mt-2 text-sm text-slate-600">Create restricted accounts, select allowed actions and activate administrators only after reviewing access.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold">Refresh</button>
        </div>
        {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        {checking ? <p>Verifying Super Admin access and Laravel endpoints…</p> : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Create Admin User</h2>
              <p className="mt-2 text-sm text-slate-500">New accounts are always suspended by Laravel. Only authorised Super Admins can create or activate them.</p>
              {!backendReady && <p className="mt-4 text-sm text-amber-800">Creation is disabled until Laravel authorises this account and supplies allowed permissions.</p>}
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
                <PermissionPicker allowed={allowed} selected={permissions} onChange={setPermissions} idPrefix="new" />
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
              <p className="mt-1 text-sm text-slate-500">Restricted administrators can be activated or suspended. Super Admin accounts are listed for information only.</p>
              <div className="mt-5 space-y-4">
                {accounts.map((account) => account.role === "admin" ? (
                  <EditableAccount key={account.id} account={account} allowed={allowed} onSaved={load} onAuthRequired={() => router.replace("/login")} />
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
      </div>
    </main>
  );
}
