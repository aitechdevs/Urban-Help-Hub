"use client";

import MessagesPanel from "@/components/MessagesPanel";
import { useDashboardNavigation } from "@/lib/dashboard-navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import RegionSelector from "@/components/RegionSelector";
import { formatMoney, storedCurrency } from "@/lib/regions";
import { useLanguage } from "@/components/LanguageProvider";
import { API_URL } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  country_code?: string;
  currency_code?: string;
};

type Profile = {
  phone?: string | null;
  profile_photo?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postal_code?: string | null;
  verification_status?: string | null;
};

type HelperService = {
  id: number;
  service_category_id: number;
  name: string;
  slug: string;
  hourly_rate?: string | number | null;
  years_experience?: number | null;
  experience_summary?: string | null;
  approval_status?: string | null;
  is_active?: boolean | number;
};

type Availability = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean | number;
  timezone: string;
};

type HelperDocument = {
  id: number;
  document_type: string;
  document_name?: string | null;
  document_number?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  verification_status: string;
  verification_notes?: string | null;
  created_at?: string | null;
};

type OnboardingData = {
  user: User;
  profile: Profile | null;
  services: HelperService[];
  availability: Availability[];
  documents: HelperDocument[];
};

type MarketplaceTask = {
  assignment_id: number;
  assignment_status: string;
  agreed_hourly_rate?: string | number | null;
  task_id: number;
  title: string;
  description: string;
  task_status: string;
  currency?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  city?: string | null;
  province?: string | null;
  service_name: string;
  customer_name: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  address_postal_code?: string | null;
  payment?: {
    currency: string;
    gross_amount: string | number;
    platform_deduction: string | number;
    net_amount: string | number;
    status: string;
  } | null;
  my_review?: { id: number; rating: number } | null;
};

const dayNames: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    sessionStorage.getItem("urbanhelphub_token") ||
    localStorage.getItem("urbanhelphub_token")
  );
}

function clearStoredAuth() {
  sessionStorage.removeItem("urbanhelphub_token");
  sessionStorage.removeItem("urbanhelphub_user");
  localStorage.removeItem("urbanhelphub_token");
  localStorage.removeItem("urbanhelphub_user");
}

function formatTime(time?: string | null) {
  if (!time) return "";

  const parts = time.slice(0, 5).split(":");
  const hours = Number(parts[0]);
  const minutes = parts[1];

  if (!Number.isFinite(hours)) return time;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function formatRate(rate?: string | number | null, currency = "CAD") {
  const value = Number(rate);

  if (!Number.isFinite(value)) return "Rate not set";

  return `${formatMoney(value, currency)}/hr`;
}

function statusLabel(status?: string | null) {
  if (!status) return "Pending";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function HelperDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const { section, navigate } = useDashboardNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
        const trigger = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-controls="helper-mobile-menu"]')).find((button) => button.getClientRects().length > 0);
        trigger?.focus();
      }
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileMenuOpen]);

  const [documentType, setDocumentType] = useState("identity_document");
  const [documentName, setDocumentName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [busyDocument, setBusyDocument] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<MarketplaceTask[]>([]);
  const [jobs, setJobs] = useState<MarketplaceTask[]>([]);
  const [marketplaceError, setMarketplaceError] = useState("");
  const [busyOpportunity, setBusyOpportunity] = useState<number | null>(null);
  const [busyJob, setBusyJob] = useState<number | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/helper/onboarding`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            clearStoredAuth();
            router.replace("/login");
            return;
          }

          if (response.status === 403) {
            router.replace("/dashboard");
            return;
          }

          throw new Error(
            result.message || "Unable to load your Helper dashboard."
          );
        }

        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your Helper dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    if (!data) return;
    const token = getToken();
    if (!token) return;

    async function loadMarketplace() {
      try {
        const [opportunityResponse, jobsResponse] = await Promise.all([
          fetch(`${API_URL}/helper/opportunities`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" }),
          fetch(`${API_URL}/helper/jobs`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" }),
        ]);
        const [opportunityResult, jobsResult] = await Promise.all([opportunityResponse.json(), jobsResponse.json()]);
        if (!opportunityResponse.ok || !opportunityResult.success) throw new Error(opportunityResult.message || "Unable to load opportunities.");
        if (!jobsResponse.ok || !jobsResult.success) throw new Error(jobsResult.message || "Unable to load jobs.");
        setOpportunities(opportunityResult.data || []);
        setJobs(jobsResult.data || []);
      } catch (err) {
        setMarketplaceError(err instanceof Error ? err.message : "Unable to load marketplace work.");
      }
    }

    loadMarketplace();
  }, [data]);

  const firstName = useMemo(() => {
    return data?.user?.name?.split(" ")[0] || "Helper";
  }, [data]);

  const pendingServices = useMemo(() => {
    return (
      data?.services?.filter(
        (service) => service.approval_status === "pending"
      ).length || 0
    );
  }, [data]);

  const approvedServices = useMemo(() => {
    return (
      data?.services?.filter(
        (service) =>
          service.approval_status === "approved" &&
          Boolean(service.is_active)
      ).length || 0
    );
  }, [data]);

  const availableDays = useMemo(() => {
    return (
      data?.availability?.filter((item) =>
        Boolean(item.is_available)
      ).length || 0
    );
  }, [data]);

  const verificationStatus =
    data?.profile?.verification_status || "pending";

  const canReceiveJobs =
    verificationStatus === "verified" &&
    approvedServices > 0;

  const currentCurrency = data?.user.currency_code || storedCurrency();

  const totalEarnings = jobs.reduce(
    (total, job) => job.payment?.currency === currentCurrency
      ? total + Number(job.payment.net_amount || 0)
      : total,
    0
  );
  const pendingEarnings = jobs.reduce(
    (total, job) =>
      job.payment && job.payment.currency === currentCurrency && job.payment.status !== "paid"
        ? total + Number(job.payment.net_amount || 0)
        : total,
    0
  );
  const activeJobs = jobs.filter((job) => job.assignment_status !== "completed");
  const completedJobs = jobs.filter((job) => job.assignment_status === "completed");

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const token = getToken();

    try {
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Local browser session will still be cleared.
    } finally {
      clearStoredAuth();
      router.replace("/login");
    }
  }

  async function respondToOpportunity(assignmentId: number, decision: "accept" | "decline") {
    if (decision === "decline" && !window.confirm("Decline this opportunity?")) return;
    const token = getToken();
    if (!token) return;

    setBusyOpportunity(assignmentId);
    setMarketplaceError("");
    try {
      const response = await fetch(`${API_URL}/helper/opportunities/${assignmentId}/${decision}`, {
        method: "PUT",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || `Unable to ${decision} this opportunity.`);
      window.location.reload();
    } catch (err) {
      setMarketplaceError(err instanceof Error ? err.message : `Unable to ${decision} this opportunity.`);
      setBusyOpportunity(null);
    }
  }

  async function jobAction(assignmentId: number, action: "start" | "complete") {
    const question = action === "start"
      ? "Start this job now? The Customer will see that work is in progress."
      : "Mark this job complete? The Customer will be asked to confirm.";
    if (!window.confirm(question)) return;
    const token = getToken();
    if (!token) return;
    setBusyJob(assignmentId);
    setMarketplaceError("");
    try {
      const response = await fetch(`${API_URL}/helper/jobs/${assignmentId}/${action}`, {
        method: "PUT",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update this job.");
      window.location.reload();
    } catch (err) {
      setMarketplaceError(err instanceof Error ? err.message : "Unable to update this job.");
      setBusyJob(null);
    }
  }

  async function reviewCustomer(taskId: number) {
    const ratingText = window.prompt("Rate this Customer from 1 to 5:", "5");
    if (ratingText === null) return;
    const rating = Number(ratingText);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMarketplaceError("Please enter a whole-number rating from 1 to 5.");
      return;
    }
    const comment = window.prompt("Add a short review (optional):", "") ?? "";
    const token = getToken();
    if (!token) return;
    setBusyJob(taskId);
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/review`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to save your review.");
      window.location.reload();
    } catch (err) {
      setMarketplaceError(err instanceof Error ? err.message : "Unable to save your review.");
      setBusyJob(null);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!documentFile || uploadingDocument) return;

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setUploadingDocument(true);
    setDocumentError("");
    setDocumentMessage("");

    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", documentFile);
    if (documentName.trim()) formData.append("document_name", documentName.trim());
    if (documentNumber.trim()) formData.append("document_number", documentNumber.trim());

    try {
      const response = await fetch(`${API_URL}/helper/documents`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        const validationMessage = result.errors
          ? Object.values(result.errors as Record<string, string[]>).flat()[0]
          : undefined;
        throw new Error(validationMessage || result.message || "Document upload failed.");
      }

      setDocumentMessage(result.message || "Document uploaded successfully.");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setUploadingDocument(false);
    }
  }

  async function openDocument(documentId: number) {
    const token = getToken();
    if (!token) return;

    setBusyDocument(documentId);
    setDocumentError("");

    try {
      const response = await fetch(`${API_URL}/helper/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unable to open this document.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : "Unable to open this document.");
    } finally {
      setBusyDocument(null);
    }
  }

  async function deleteDocument(documentId: number) {
    if (!window.confirm("Remove this document?")) return;
    const token = getToken();
    if (!token) return;

    setBusyDocument(documentId);
    setDocumentError("");

    try {
      const response = await fetch(`${API_URL}/helper/documents/${documentId}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to remove this document.");
      }
      window.location.reload();
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : "Unable to remove this document.");
    } finally {
      setBusyDocument(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8">
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-9 w-auto"
            />
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#2fad45]" />
            <p className="mt-4 font-medium text-slate-600">
              Loading your Helper dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#f7f9fc]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8">
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-9 w-auto"
            />
          </div>
        </header>

        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#082f5b]">
              We couldn&apos;t load your dashboard
            </h1>

            <p className="mt-3 text-slate-600">
              {error || "Please try again."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#082f5b] px-6 py-3 font-bold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="overview" tabIndex={-1} className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-9">
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="UrbanHelpHub home"
              className="cursor-pointer"
            >
              <img
                src="/UrbanHelpHub-logo.png"
                alt="UrbanHelpHub"
                className="h-9 w-auto sm:h-10"
              />
            </button>

            <nav className="hidden items-center gap-6 lg:flex">
              <button
                type="button"
                onClick={() => navigate("overview")}
                aria-current={section === "overview" ? "location" : undefined}
                className="font-bold text-[#082f5b]"
              >
                {t("dashboard")}
              </button>

              <button
                type="button"
                onClick={() => navigate("opportunities")}
                aria-current={section === "opportunities" ? "location" : undefined}
                className="font-semibold text-slate-600 transition hover:text-[#082f5b]"
              >
                {t("opportunities")}
              </button>

              <button
                type="button"
                onClick={() => navigate("jobs")}
                aria-current={section === "jobs" ? "location" : undefined}
                className="font-semibold text-slate-600 transition hover:text-[#082f5b]"
              >
                {t("jobs")}
              </button>

              <button
                type="button"
                onClick={() => navigate("messages")}
                aria-current={section === "messages" ? "location" : undefined}
                className="font-semibold text-slate-600 transition hover:text-[#082f5b]"
              >
                {t("messages")}
              </button>

              <button
                type="button"
                onClick={() => navigate("earnings")}
                aria-current={section === "earnings" ? "location" : undefined}
                className="font-semibold text-slate-600 transition hover:text-[#082f5b]"
              >
                {t("earnings")}
              </button>
            </nav>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <RegionSelector />
            <NotificationBell />
            <button
              type="button"
              onClick={() => router.push("/become-a-helper")}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-[#082f5b] transition hover:bg-slate-50"
            >
              {t("editProfile")}
            </button>

            <div className="text-right">
              <p className="text-sm font-bold text-[#082f5b]">
                {data.user.name}
              </p>
              <p className="text-xs text-slate-500">
                Helper
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 font-bold text-[#238f39]">
              {data.user.name.charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="text-sm font-bold text-slate-500 hover:text-red-600 disabled:opacity-50"
            >
              {loggingOut ? "Signing out..." : t("logout")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-[#082f5b] sm:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="helper-mobile-menu"
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="helper-mobile-menu" className="border-t border-slate-100 bg-white px-5 py-4 sm:hidden">
            <div className="space-y-1">
              <p className="mb-3 font-bold text-[#082f5b]">
                {data.user.name}
              </p>

<nav aria-label="Helper mobile navigation" className="grid gap-1">
                <button type="button" onClick={() => { navigate("overview"); setMobileMenuOpen(false); }} aria-current={section === "overview" ? "location" : undefined} className="rounded-lg px-3 py-2 text-left font-semibold text-slate-600">{t("dashboard")}</button>
                <button type="button" onClick={() => { navigate("opportunities"); setMobileMenuOpen(false); }} aria-current={section === "opportunities" ? "location" : undefined} className="rounded-lg px-3 py-2 text-left font-semibold text-slate-600">{t("opportunities")}</button>
                <button type="button" onClick={() => { navigate("jobs"); setMobileMenuOpen(false); }} aria-current={section === "jobs" ? "location" : undefined} className="rounded-lg px-3 py-2 text-left font-semibold text-slate-600">{t("jobs")}</button>
                <button type="button" onClick={() => { navigate("messages"); setMobileMenuOpen(false); }} aria-current={section === "messages" ? "location" : undefined} className="rounded-lg px-3 py-2 text-left font-semibold text-slate-600">{t("messages")}</button>
                <button type="button" onClick={() => { navigate("earnings"); setMobileMenuOpen(false); }} aria-current={section === "earnings" ? "location" : undefined} className="rounded-lg px-3 py-2 text-left font-semibold text-slate-600">{t("earnings")}</button>
              </nav>
              <div className="flex items-center gap-3 py-2"><RegionSelector /><NotificationBell /></div>

              <button
                type="button"
                onClick={() => router.push("/become-a-helper")}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-600"
              >
                {t("editProfile")}
              </button>

              <button
                type="button"
                onClick={logout}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold text-red-600"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        )}
      </header>

      <nav aria-label="Helper tablet navigation" className="hidden flex-wrap gap-5 border-b border-slate-200 bg-white px-5 py-3 sm:flex lg:hidden">
        {[["dashboard", "overview"], ["opportunities", "opportunities"], ["jobs", "jobs"], ["messages", "messages"], ["earnings", "earnings"]].map(([label, id]) => (
          <button key={id} type="button" onClick={() => navigate(id)} aria-current={section === id ? "location" : undefined} className="text-sm font-semibold text-slate-600">{t(label)}</button>
        ))}
      </nav>

      <section className="bg-[#082f5b]">
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-11">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-green-300">
                Helper dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t("welcome")}, {firstName}.
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-200">
                Manage your services, availability, verification and
                work from one place.
              </p>
            </div>

            <div
              className={`inline-flex self-start rounded-full px-4 py-2 text-sm font-bold lg:self-auto ${
                canReceiveJobs
                  ? "bg-green-400/20 text-green-200"
                  : "bg-amber-300/15 text-amber-200"
              }`}
            >
              {canReceiveJobs
                ? "✓ Ready to receive jobs"
                : "● Application under review"}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        {!canReceiveJobs && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl">
                  🛡️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#082f5b]">
                    Your Helper application is being prepared for approval
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    Your services are saved, but they will not be
                    available to customers until the required
                    verification and approval steps are completed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/become-a-helper")}
                className="shrink-0 rounded-xl bg-[#082f5b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#06274b]"
              >
                Review application
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("approvedServices")}
            value={String(approvedServices)}
            note={
              pendingServices > 0
                ? `${pendingServices} awaiting approval`
                : "No services pending"
            }
            icon="✓"
          />

          <StatCard
            label={t("availableDays")}
            value={String(availableDays)}
            note="Your normal working week"
            icon="◷"
          />

          <StatCard
            label={t("activeJobs")}
            value={String(activeJobs.length)}
            note={
              activeJobs.length > 0
                ? "Accepted and scheduled work"
                : canReceiveJobs
                ? "No active jobs"
                : "Available after approval"
            }
            icon="▣"
          />

          <StatCard
            label={t("earnings")}
            value={formatMoney(totalEarnings, currentCurrency)}
            note={
              pendingEarnings > 0
                ? `${formatMoney(pendingEarnings, currentCurrency)} pending payout`
                : totalEarnings > 0
                ? `${currentCurrency} • Paid out`
                : `${currentCurrency} • No completed jobs yet`
            }
            icon="$"
          />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.55fr_0.85fr]">
          <div className="space-y-8">
            {marketplaceError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {marketplaceError}
              </div>
            )}
            <section id="services" tabIndex={-1} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
                <div>
                  <h2 className="text-xl font-bold text-[#082f5b]">
                    {t("yourServices")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Services you&apos;ve applied to offer
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/become-a-helper")}
                  className="text-sm font-bold text-[#238f39] hover:underline"
                >
                  Manage
                </button>
              </div>

              {data.services.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.services.map((service) => {
                    const approved =
                      service.approval_status === "approved" &&
                      Boolean(service.is_active);

                    return (
                      <div
                        key={service.id}
                        className="p-6 sm:p-7"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f8] text-xl">
                              {service.slug?.includes("clean")
                                ? "✨"
                                : service.slug?.includes("furniture")
                                ? "🪑"
                                : service.slug?.includes("moving")
                                ? "📦"
                                : service.slug?.includes("delivery")
                                ? "🛍️"
                                : service.slug?.includes("repair")
                                ? "🛠️"
                                : service.slug?.includes("mount")
                                ? "🖼️"
                                : service.slug?.includes("yard")
                                ? "🌿"
                                : service.slug?.includes("snow")
                                ? "❄️"
                                : service.slug?.includes("driv")
                                ? "🚗"
                                : service.slug?.includes("baby")
                                ? "🧸"
                                : "🤝"}
                            </div>

                            <div>
                              <h3 className="font-bold text-[#082f5b]">
                                {service.name}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {service.years_experience ?? 0}{" "}
                                {service.years_experience === 1
                                  ? "year"
                                  : "years"}{" "}
                                experience
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 sm:text-right">
                            <div>
                              <p className="font-bold text-[#082f5b]">
                                {formatRate(service.hourly_rate, data.user.currency_code || storedCurrency())}
                              </p>

                              <span
                                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                                  approved
                                    ? "bg-green-50 text-[#238f39]"
                                    : service.approval_status ===
                                      "rejected"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {statusLabel(
                                  service.approval_status
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No services selected"
                  description="Choose the services you want to provide to customers."
                  buttonLabel="Choose services"
                  onClick={() => router.push("/become-a-helper")}
                />
              )}
            </section>

            <section id="opportunities" tabIndex={-1} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
                <div>
                  <h2 className="text-xl font-bold text-[#082f5b]">
                    Job opportunities
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Tasks that match your approved services and area
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {opportunities.length} available
                </span>
              </div>

              {!canReceiveJobs ? (
                <EmptyState
                  icon="🔒"
                  title="Opportunities unlock after approval"
                  description="Once your required verification is complete and at least one service is approved, matching tasks can appear here."
                  buttonLabel="View application"
                  onClick={() => router.push("/become-a-helper")}
                />
              ) : opportunities.length === 0 ? (
                <EmptyState
                  icon="📍"
                  title="No matching opportunities right now"
                  description="New tasks matching your services and service area will appear here."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {opportunities.map((task) => (
                    <div key={task.assignment_id} className="p-6 sm:p-7">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{task.service_name}</span>
                          <h3 className="mt-3 text-lg font-bold text-[#082f5b]">{task.title}</h3>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{task.description}</p>
                          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                            <span>📍 {[task.city, task.province].filter(Boolean).join(", ")}</span>
                            <span>📅 {task.scheduled_date || "Flexible"}</span>
                            <span>◷ {task.scheduled_start_time?.slice(0, 5) || "Flexible"}</span>
                            {task.agreed_hourly_rate && <span>💵 {formatMoney(task.agreed_hourly_rate, task.currency || currentCurrency)}/hr</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" disabled={busyOpportunity === task.assignment_id} onClick={() => respondToOpportunity(task.assignment_id, "accept")} className="rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyOpportunity === task.assignment_id ? "Working..." : "✓ Accept"}</button>
                          <button type="button" disabled={busyOpportunity === task.assignment_id} onClick={() => respondToOpportunity(task.assignment_id, "decline")} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50">Decline</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="jobs" tabIndex={-1} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                <h2 className="text-xl font-bold text-[#082f5b]">
                  {t("upcomingJobs")}
                </h2>

                <p className="mt-1 text-sm text-slate-500">Track confirmed work from arrival through payment</p>
              </div>

              {activeJobs.length === 0 ? <EmptyState
                icon="📅"
                title="Nothing scheduled yet"
                description={
                  canReceiveJobs
                    ? "When you accept a task, its schedule and customer details will appear here."
                    : "Scheduled work will appear here after your account is approved and you begin accepting tasks."
                }
              /> : (
                <div className="divide-y divide-slate-100">
                  {activeJobs.map((task) => (
                    <div key={task.assignment_id} className="p-6 sm:p-7">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{task.service_name}</span>
                          <h3 className="mt-3 font-bold text-[#082f5b]">{task.title}</h3>
                          <p className="mt-2 text-sm text-slate-500">{task.customer_name} · {[task.city, task.province].filter(Boolean).join(", ")}</p>
                          <p className="mt-1 text-sm text-slate-500">{task.scheduled_date} at {task.scheduled_start_time?.slice(0, 5)}</p>
                          {task.assignment_status !== "accepted" && task.address_line_1 && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900"><p className="font-bold">Service address</p><p className="mt-1">{[task.address_line_1, task.address_line_2, task.city, task.province, task.address_postal_code].filter(Boolean).join(", ")}</p></div>}
                          {task.payment && <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900"><p className="font-bold">Earnings: {formatMoney(task.payment.net_amount, task.payment.currency)}</p><p className="mt-1 text-xs">Gross {formatMoney(task.payment.gross_amount, task.payment.currency)} − platform deduction {formatMoney(task.payment.platform_deduction, task.payment.currency)} · {statusLabel(task.payment.status)}</p></div>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${["confirmed", "completed"].includes(task.assignment_status) ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{statusLabel(task.assignment_status)}</span>
                          {task.assignment_status === "confirmed" && <button type="button" disabled={busyJob === task.assignment_id || !canStartScheduledJob(task.scheduled_date)} onClick={() => jobAction(task.assignment_id, "start")} title={canStartScheduledJob(task.scheduled_date) ? "Start this job" : `Available on ${task.scheduled_date}`} className="rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busyJob === task.assignment_id ? "Starting..." : canStartScheduledJob(task.scheduled_date) ? "Start job" : `Starts ${task.scheduled_date}`}</button>}
                          {task.assignment_status === "in_progress" && <button type="button" disabled={busyJob === task.assignment_id} onClick={() => jobAction(task.assignment_id, "complete")} className="rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyJob === task.assignment_id ? "Updating..." : "Mark complete"}</button>}
                          {task.assignment_status === "awaiting_completion" && <span className="text-xs font-bold text-amber-700">Waiting for Customer approval</span>}
                          {task.assignment_status === "completed" && !task.my_review && <button type="button" disabled={busyJob === task.task_id} onClick={() => reviewCustomer(task.task_id)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#082f5b] disabled:opacity-50">Review Customer</button>}
                          {task.my_review && <span className="text-sm font-bold text-amber-600">{"★".repeat(task.my_review.rating)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="earnings" tabIndex={-1} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
                <div><h2 className="text-xl font-bold text-[#082f5b]">{t("completedJobs")}</h2><p className="mt-1 text-sm text-slate-500">Work history, earnings and reviews</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{completedJobs.length} completed</span>
              </div>
              {completedJobs.length === 0 ? <EmptyState icon="✓" title="No completed jobs yet" description="Finished jobs and payout details will appear here." /> : <div className="divide-y divide-slate-100">
                {completedJobs.map((task) => <article key={task.assignment_id} className="p-6 sm:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Completed</span><h3 className="mt-3 font-bold text-[#082f5b]">{task.title}</h3><p className="mt-1 text-sm text-slate-500">{task.customer_name} · {task.scheduled_date}</p>{task.payment && <p className="mt-3 text-sm font-bold text-emerald-700">Net earnings: {formatMoney(task.payment.net_amount, task.payment.currency)} · {statusLabel(task.payment.status)}</p>}</div>
                    <div>{!task.my_review ? <button type="button" disabled={busyJob === task.task_id} onClick={() => reviewCustomer(task.task_id)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#082f5b] disabled:opacity-50">Review Customer</button> : <span className="text-sm font-bold text-amber-600">{"★".repeat(task.my_review.rating)}</span>}</div>
                  </div>
                </article>)}
              </div>}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#082f5b]">
                  {t("verification")}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    verificationStatus === "verified"
                      ? "bg-green-50 text-[#238f39]"
                      : verificationStatus === "rejected"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {statusLabel(verificationStatus)}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                <ProgressItem
                  label="Account created"
                  complete
                />

                <ProgressItem
                  label="Services selected"
                  complete={data.services.length > 0}
                />

                <ProgressItem
                  label="Service area added"
                  complete={Boolean(
                    data.profile?.city &&
                      data.profile?.province &&
                      data.profile?.postal_code
                  )}
                />

                <ProgressItem
                  label="Availability added"
                  complete={data.availability.length > 0}
                />

                <ProgressItem
                  label="Identity & document checks"
                  complete={verificationStatus === "verified"}
                />

                <ProgressItem
                  label="Final approval"
                  complete={canReceiveJobs}
                />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="font-bold text-[#082f5b]">Verification documents</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  PDF, JPG or PNG. Maximum file size 5 MB. Files are stored privately.
                </p>

                {(documentMessage || documentError) && (
                  <div className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${documentError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {documentError || documentMessage}
                  </div>
                )}

                <form onSubmit={uploadDocument} className="mt-4 space-y-3">
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#2fad45]">
                    <option value="identity_document">Identity document</option>
                    <option value="background_check">Background check</option>
                    <option value="drivers_licence">Driver&apos;s licence</option>
                    <option value="driver_abstract">Driver abstract</option>
                    <option value="vehicle_insurance">Vehicle insurance</option>
                  </select>
                  <input type="text" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Document name (optional)" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#2fad45]" />
                  <input type="text" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} placeholder="Document number (optional)" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#2fad45]" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600" />
                  <button type="submit" disabled={!documentFile || uploadingDocument} className="w-full rounded-xl bg-[#2fad45] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
                    {uploadingDocument ? "Uploading securely…" : "Upload document"}
                  </button>
                </form>

                <div className="mt-5 space-y-3">
                  {data.documents.length > 0 ? data.documents.map((document) => (
                    <div key={document.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#082f5b]">{document.document_name || statusLabel(document.document_type)}</p>
                          <p className="mt-1 text-xs text-slate-500">{statusLabel(document.document_type)}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${document.verification_status === "verified" ? "bg-green-50 text-green-700" : document.verification_status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{statusLabel(document.verification_status)}</span>
                      </div>
                      {document.verification_notes && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{document.verification_notes}</p>}
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => openDocument(document.id)} disabled={busyDocument === document.id} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-[#082f5b] disabled:opacity-50">View</button>
                        {document.verification_status !== "verified" && <button type="button" onClick={() => deleteDocument(document.id)} disabled={busyDocument === document.id} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50">Remove</button>}
                      </div>
                    </div>
                  )) : <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">No documents uploaded yet. Upload an identity document to begin verification.</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/become-a-helper")}
                className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-[#082f5b] transition hover:bg-slate-50"
              >
                Review application
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#082f5b]">
                    Availability
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {data.availability[0]?.timezone ||
                      "Time zone not set"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/become-a-helper")}
                  className="text-sm font-bold text-[#238f39] hover:underline"
                >
                  Edit
                </button>
              </div>

              {data.availability.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {data.availability.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f9fc] px-4 py-3"
                    >
                      <span className="text-sm font-bold text-slate-700">
                        {dayNames[item.day_of_week] ||
                          `Day ${item.day_of_week}`}
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        {formatTime(item.start_time)} –{" "}
                        {formatTime(item.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  No availability added yet.
                </p>
              )}
            </section>

            <section className="rounded-3xl bg-[#082f5b] p-6 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-300">
                Your service area
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {data.profile?.city || "Not added"}
                {data.profile?.province
                  ? `, ${data.profile.province}`
                  : ""}
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                {data.profile?.postal_code || "Postal code not added"}
              </p>

              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="text-sm leading-6 text-slate-200">
                  Matching will use your approved services and service
                  area when customer tasks become available.
                </p>
              </div>
            </section>

            <section id="messages" tabIndex={-1} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#082f5b]">
                {t("messages")}
              </h2>

              <MessagesPanel />
            </section>
          </aside>
        </div>
      </section>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <img
            src="/UrbanHelpHub-logo.png"
            alt="UrbanHelpHub"
            className="h-8 w-auto self-start"
          />

          <p className="text-sm text-slate-500">
            Local help. Clear expectations. Stronger communities.
          </p>
        </div>
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {note}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f8] font-bold text-[#082f5b]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          complete
            ? "bg-green-50 text-[#238f39]"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {complete ? "✓" : "•"}
      </span>

      <span
        className={`text-sm font-semibold ${
          complete ? "text-slate-700" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function EmptyState({
  icon = "○",
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon?: string;
  title: string;
  description: string;
  buttonLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f8] text-xl">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-[#082f5b]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {buttonLabel && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-[#082f5b] transition hover:bg-slate-50"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

function canStartScheduledJob(date?: string | null) {
  if (!date) return false;

  const scheduledDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return scheduledDate <= today;
}
