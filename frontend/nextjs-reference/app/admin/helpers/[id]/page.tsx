"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

type HelperUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: "active" | "suspended" | string;
  created_at?: string | null;
};

type Profile = {
  headline?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postal_code?: string | null;
  verification_status?: string | null;
};

type Service = {
  id: number;
  name: string;
  hourly_rate?: string | number | null;
  years_experience: number;
  experience_summary?: string | null;
  approval_status: string;
  is_active: boolean | number;
  requires_verification: boolean | number;
  requires_background_check: boolean | number;
  requires_driving_documents: boolean | number;
  requires_specialist_documents: boolean | number;
};

type Availability = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean | number;
  timezone: string;
};

type Document = {
  id: number;
  document_type: string;
  document_name?: string | null;
  document_number?: string | null;
  verification_status: string;
  issued_at?: string | null;
  expires_at?: string | null;
};

type HelperApplication = {
  user: HelperUser;
  profile: Profile | null;
  services: Service[];
  availability: Availability[];
  documents: Document[];
  verification_readiness: {
    ready: boolean;
    missing_requirements: string[];
    approved_documents: number;
  };
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getToken() {
  return (
    window.sessionStorage.getItem("urbanhelphub_token") ||
    window.localStorage.getItem("urbanhelphub_token")
  );
}

function clearAuth() {
  window.sessionStorage.removeItem("urbanhelphub_token");
  window.sessionStorage.removeItem("urbanhelphub_user");
  window.localStorage.removeItem("urbanhelphub_token");
  window.localStorage.removeItem("urbanhelphub_user");
}

function label(value?: string | null) {
  if (!value) return "Not provided";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function badgeStyle(value?: string | null) {
  const normalized = value?.toLowerCase();
  if (["active", "approved", "verified"].includes(normalized || "")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (["rejected", "suspended", "expired"].includes(normalized || "")) {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${badgeStyle(value)}`}>
      {label(value)}
    </span>
  );
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function requirementList(service: Service) {
  const requirements: string[] = [];
  if (service.requires_verification) requirements.push("Identity verification");
  if (service.requires_background_check) requirements.push("Background check");
  if (service.requires_driving_documents) requirements.push("Driving documents");
  if (service.requires_specialist_documents) requirements.push("Specialist documents");
  return requirements;
}

export default function HelperReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<HelperApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadApplication = useCallback(async (quiet = false) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin/helpers/${params.id}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result: ApiResponse<HelperApplication> = await response.json();

      if (response.status === 401 || response.status === 403) {
        clearAuth();
        router.replace("/login");
        return;
      }
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to load this Helper application.");
      }
      setApplication(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load this Helper application.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    // The request is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadApplication();
  }, [loadApplication]);

  async function update(path: string, body: object, action: string, success: string) {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setBusyAction(action);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const result: ApiResponse = await response.json();
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        router.replace("/login");
        return;
      }
      if (!response.ok || !result.success) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : undefined;
        throw new Error(validationMessage || result.message || "The update could not be completed.");
      }
      setNotice(success);
      await loadApplication(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The update could not be completed.");
    } finally {
      setBusyAction("");
    }
  }

  function confirmUpdate(message: string, callback: () => void) {
    if (window.confirm(message)) callback();
  }

  async function openDocument(documentId: number) {
    const token = getToken();
    if (!token) return;

    setBusyAction(`document-view-${documentId}`);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/helpers/${application?.user.id}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Unable to open this document.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open this document.");
    } finally {
      setBusyAction("");
    }
  }

  function rejectDocument(document: Document) {
    const notes = window.prompt(
      "Explain why this document is being rejected. The Helper will see this note."
    );

    if (notes === null) return;
    if (!notes.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    void update(
      `/admin/helpers/${application?.user.id}/documents/${document.id}`,
      {
        verification_status: "rejected",
        verification_notes: notes.trim(),
      },
      `document-reject-${document.id}`,
      "Document rejected. The Helper can now review the reason and upload a replacement."
    );
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 font-semibold text-slate-500">Loading Helper application…</main>;
  }

  if (!application) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-[#082f5b]">Application unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-red-700">{error || "This Helper application could not be found."}</p>
          <Link href="/admin" className="mt-6 inline-flex rounded-xl bg-[#082f5b] px-5 py-3 text-sm font-bold text-white">Return to Admin dashboard</Link>
        </div>
      </main>
    );
  }

  const { user, profile, services, availability, documents, verification_readiness: readiness } = application;
  const location = [profile?.city, profile?.province, profile?.country].filter(Boolean).join(", ") || "Not provided";

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-700">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#082f5b] hover:text-[#238f39]">← Admin dashboard</Link>
          <button type="button" onClick={() => loadApplication(true)} disabled={refreshing || !!busyAction} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#082f5b] hover:bg-slate-50 disabled:opacity-50">
            {refreshing ? "Refreshing…" : "Refresh application"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="overflow-hidden rounded-3xl bg-[#082f5b] text-white shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl font-black">
                {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Helper application</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight">{user.name}</h1>
                <p className="mt-2 text-sm text-slate-200">{profile?.headline || "No professional headline provided"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge value={profile?.verification_status || "pending"} />
                  <StatusBadge value={user.status} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button type="button" title={!readiness.ready ? readiness.missing_requirements.join(", ") : "Verify this Helper"} disabled={!!busyAction || profile?.verification_status === "verified" || !readiness.ready} onClick={() => confirmUpdate(`Verify ${user.name}? Approved services will become active.`, () => update(`/admin/helpers/${user.id}/verification`, { verification_status: "verified" }, "verify", "Helper verified successfully."))} className="rounded-xl bg-[#2fad45] px-5 py-3 text-sm font-black text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
                {busyAction === "verify" ? "Verifying…" : "✓ Verify Helper"}
              </button>
              <button type="button" disabled={!!busyAction} onClick={() => confirmUpdate(`${user.status === "suspended" ? "Reactivate" : "Suspend"} ${user.name}'s account?`, () => update(`/admin/helpers/${user.id}/status`, { status: user.status === "suspended" ? "active" : "suspended" }, "status", user.status === "suspended" ? "Helper account reactivated." : "Helper account suspended."))} className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20 disabled:opacity-50">
                {busyAction === "status" ? "Updating…" : user.status === "suspended" ? "Reactivate Helper" : "Suspend Helper"}
              </button>
            </div>
          </div>
        </section>

        {(notice || error) && (
          <div role="status" className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {error || notice}
          </div>
        )}

        {!readiness.ready && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <p className="font-black">Verification requirements are incomplete</p>
            <p className="mt-1">The Helper cannot be verified until these items are uploaded and approved:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-semibold">
              {readiness.missing_requirements.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}

        {profile?.verification_status === "verified" && !readiness.ready && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            Compliance warning: this Helper was verified before the required document checks were introduced. Review the account and documents before leaving services active.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div><h2 className="text-xl font-black text-[#082f5b]">Service applications</h2><p className="mt-1 text-sm text-slate-500">Review experience and approve each service independently.</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{services.length} total</span>
              </div>

              <div className="mt-6 space-y-4">
                {services.length ? services.map((service) => {
                  const requirements = requirementList(service);
                  return (
                    <article key={service.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#082f5b]">{service.name}</h3><StatusBadge value={service.approval_status} />{Boolean(service.is_active) && <StatusBadge value="active" />}</div>
                          <p className="mt-2 text-sm font-bold text-[#238f39]">${Number(service.hourly_rate || 0).toFixed(2)} CAD/hour · {service.years_experience} {service.years_experience === 1 ? "year" : "years"} experience</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={!!busyAction || service.approval_status === "approved"} onClick={() => confirmUpdate(`Approve ${service.name} for ${user.name}?`, () => update(`/admin/helpers/${user.id}/services/${service.id}`, { approval_status: "approved" }, `approve-${service.id}`, `${service.name} approved.`))} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-40">{busyAction === `approve-${service.id}` ? "Approving…" : "✓ Approve"}</button>
                          <button type="button" disabled={!!busyAction || service.approval_status === "rejected"} onClick={() => confirmUpdate(`Reject ${service.name} for ${user.name}?`, () => update(`/admin/helpers/${user.id}/services/${service.id}`, { approval_status: "rejected" }, `reject-${service.id}`, `${service.name} rejected.`))} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-40">{busyAction === `reject-${service.id}` ? "Rejecting…" : "× Reject"}</button>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{service.experience_summary || "No experience summary provided."}</p>
                      <div className="mt-4 flex flex-wrap gap-2">{requirements.length ? requirements.map((item) => <span key={item} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item}</span>) : <span className="text-xs text-slate-400">No special verification requirements</span>}</div>
                    </article>
                  );
                }) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No services submitted.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-[#082f5b]">Profile and experience</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{profile?.bio || "No biography provided."}</p>
              <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                <Info label="Email" value={user.email} />
                <Info label="Phone" value={user.phone || "Not provided"} />
                <Info label="Location" value={location} />
                <Info label="Postal code" value={profile?.postal_code || "Not provided"} />
              </dl>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-[#082f5b]">Weekly availability</h2>
              <div className="mt-4 space-y-3">{availability.length ? availability.map((slot) => <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="font-bold text-[#082f5b]">{days[slot.day_of_week] || `Day ${slot.day_of_week}`}</span><span className="text-slate-500">{slot.is_available ? `${formatTime(slot.start_time)}–${formatTime(slot.end_time)}` : "Unavailable"}</span></div>) : <p className="text-sm text-slate-500">No availability submitted.</p>}</div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-lg font-black text-[#082f5b]">Documents</h2><span className="text-xs font-bold text-slate-400">{documents.length}</span></div>
              <div className="mt-4 space-y-3">
                {documents.length ? documents.map((document) => (
                  <div key={document.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#082f5b]">{document.document_name || label(document.document_type)}</p>
                        <p className="mt-1 text-xs text-slate-500">{label(document.document_type)}</p>
                      </div>
                      <StatusBadge value={document.verification_status} />
                    </div>
                    {document.expires_at && <p className="mt-3 text-xs text-slate-500">Expires {new Date(document.expires_at).toLocaleDateString("en-CA")}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={!!busyAction} onClick={() => openDocument(document.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-[#082f5b] disabled:opacity-40">{busyAction === `document-view-${document.id}` ? "Opening…" : "View document"}</button>
                      <button type="button" disabled={!!busyAction || document.verification_status === "verified"} onClick={() => confirmUpdate(`Approve ${document.document_name || label(document.document_type)}?`, () => update(`/admin/helpers/${user.id}/documents/${document.id}`, { verification_status: "verified" }, `document-approve-${document.id}`, "Document approved."))} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">{busyAction === `document-approve-${document.id}` ? "Approving…" : "Approve"}</button>
                      <button type="button" disabled={!!busyAction || document.verification_status === "rejected"} onClick={() => rejectDocument(document)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40">{busyAction === `document-reject-${document.id}` ? "Rejecting…" : "Reject"}</button>
                    </div>
                  </div>
                )) : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">No documents uploaded.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-[#082f5b]">Verification decision</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Use rejection when the application cannot be verified. This also deactivates approved services.</p>
              <button type="button" disabled={!!busyAction || profile?.verification_status === "rejected"} onClick={() => confirmUpdate(`Reject ${user.name}'s verification?`, () => update(`/admin/helpers/${user.id}/verification`, { verification_status: "rejected" }, "reject-verification", "Helper verification rejected."))} className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-40">{busyAction === "reject-verification" ? "Rejecting…" : "Reject verification"}</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({ label: heading, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-black uppercase tracking-wider text-slate-400">{heading}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</dd></div>;
}
