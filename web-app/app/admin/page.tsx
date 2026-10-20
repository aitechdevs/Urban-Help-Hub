"use client";

import { useDashboardNavigation } from "@/lib/dashboard-navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import RegionSelector from "@/components/RegionSelector";
import { formatMoney } from "@/lib/regions";
import { useLanguage } from "@/components/LanguageProvider";
import { API_URL } from "@/lib/api";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  country_code?: string;
  currency_code?: string;
};

type Stats = {
  pending_helpers: number;
  pending_services: number;
  verified_helpers: number;
  active_helpers: number;
  total_customers: number;
  total_helpers: number;
  completed_tasks: number;
  pending_payments: number;
  pending_payouts: number;
  gross_volume: number;
  platform_revenue: number;
  settlement_currency?: string;
  pending_tasks: number;
};

type AdminTask = {
  id: number;
  title: string;
  description: string;
  status: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  address_line_1?: string | null;
  postal_code?: string | null;
  pricing_type: string;
  budget_min?: string | number | null;
  budget_max?: string | number | null;
};

type PaymentRecord = {
  id: number;
  task_id: number;
  task_title: string;
  customer_name: string;
  helper_name?: string | null;
  currency: string;
  subtotal_amount: string | number;
  platform_fee: string | number;
  total_amount: string | number;
  settlement_currency: string;
  settlement_exchange_rate: string | number;
  settlement_subtotal_amount: string | number;
  settlement_platform_fee: string | number;
  settlement_total_amount: string | number;
  settlement_helper_net: string | number;
  status: string;
  provider: string;
  payout_id?: number | null;
  helper_net?: string | number | null;
  payout_status?: string | null;
};

type Helper = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  created_at?: string | null;
  headline?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  verification_status?: string | null;
  pending_services: number;
  approved_services: number;
};

type DashboardData = {
  admin: AdminUser;
  stats: Stats;
};

type IconName =
  | "dashboard"
  | "helpers"
  | "customers"
  | "tasks"
  | "payments"
  | "shield"
  | "search"
  | "arrow"
  | "check"
  | "clock"
  | "users"
  | "menu"
  | "logout"
  | "refresh"
  | "alert"
  | "chevron";

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    sessionStorage.getItem("urbanhelphub_token") ||
    localStorage.getItem("urbanhelphub_token")
  );
}

function clearAuth() {
  sessionStorage.removeItem("urbanhelphub_token");
  sessionStorage.removeItem("urbanhelphub_user");
  localStorage.removeItem("urbanhelphub_token");
  localStorage.removeItem("urbanhelphub_user");
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "helpers" || name === "users") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "customers") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === "tasks") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="m8 9 2 2 4-4" />
        <path d="M8 15h8" />
      </svg>
    );
  }

  if (name === "payments") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h2" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />
        <path d="M18.5 9A7 7 0 0 0 6 6.5L4 9" />
        <path d="M5.5 15A7 7 0 0 0 18 17.5l2-2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function statusText(value?: string | null) {
  if (!value) return "Pending";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "verified" | "active"
  >("pending");
  const { section, navigate } = useDashboardNavigation();
  function go(id: string) { navigate(id); setMobileMenu(false); }
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape" && mobileMenu) {
        setMobileMenu(false);
        const trigger = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-controls="admin-mobile-menu"]')).find((button) => button.getClientRects().length > 0);
        trigger?.focus();
      }
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileMenu]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [busyFinance, setBusyFinance] = useState<string | null>(null);
  const [busyTaskReview, setBusyTaskReview] = useState<number | null>(null);

  const loadAdminData = useCallback(
    async (showRefresh = false) => {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [dashboardResponse, helpersResponse, paymentsResponse, tasksResponse] =
          await Promise.all([
            fetch(`${API_URL}/admin/dashboard`, {
              headers,
              cache: "no-store",
            }),
            fetch(
              `${API_URL}/admin/helpers?status=${filter}`,
              {
                headers,
                cache: "no-store",
              }
            ),
            fetch(`${API_URL}/admin/payments`, {
              headers,
              cache: "no-store",
            }),
            fetch(`${API_URL}/admin/tasks?status=pending_approval`, {
              headers,
              cache: "no-store",
            }),
          ]);

        if (
          dashboardResponse.status === 401 ||
          helpersResponse.status === 401 ||
          paymentsResponse.status === 401
          || tasksResponse.status === 401
        ) {
          clearAuth();
          router.replace("/login");
          return;
        }

        if (
          dashboardResponse.status === 403 ||
          helpersResponse.status === 403 ||
          paymentsResponse.status === 403
          || tasksResponse.status === 403
        ) {
          router.replace("/dashboard");
          return;
        }

        const dashboardResult = await dashboardResponse.json();
        const helpersResult = await helpersResponse.json();
        const paymentsResult = await paymentsResponse.json();
        const tasksResult = await tasksResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardResult.message ||
              "Unable to load the Admin dashboard."
          );
        }

        if (!helpersResponse.ok) {
          throw new Error(
            helpersResult.message ||
              "Unable to load Helper applications."
          );
        }

        if (!paymentsResponse.ok) {
          throw new Error(paymentsResult.message || "Unable to load payment activity.");
        }

        if (!tasksResponse.ok) {
          throw new Error(tasksResult.message || "Unable to load task approvals.");
        }

        setDashboard(dashboardResult.data);
        setHelpers(helpersResult.data || []);
        setPayments(paymentsResult.data || []);
        setTasks(tasksResult.data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the Admin dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, router]
  );

  useEffect(() => {
    // Initial API synchronization for the protected Admin workspace.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdminData();
  }, [loadAdminData]);

  const visibleHelpers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return helpers;

    return helpers.filter((helper) => {
      const location = `${helper.city || ""} ${
        helper.province || ""
      } ${helper.postal_code || ""}`.toLowerCase();

      return (
        helper.name.toLowerCase().includes(term) ||
        helper.email.toLowerCase().includes(term) ||
        location.includes(term)
      );
    });
  }, [helpers, search]);

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
      // Clear local session even if the development API is unavailable.
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }

  async function updateFinance(kind: "payments" | "payouts", id: number, status: "paid" | "failed") {
    const prompt = status === "paid"
      ? `Mark this ${kind === "payments" ? "Customer payment" : "Helper payout"} as paid?`
      : `Mark this ${kind === "payments" ? "payment" : "payout"} as failed?`;
    if (!window.confirm(prompt)) return;
    const token = getToken();
    if (!token) return;
    const busyKey = `${kind}-${id}`;
    setBusyFinance(busyKey);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/${kind}/${id}/status`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update financial status.");
      await loadAdminData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update financial status.");
    } finally {
      setBusyFinance(null);
    }
  }

  async function reviewTask(taskId: number, decision: "approved" | "rejected") {
    let reason = "";
    if (decision === "rejected") {
      reason = window.prompt("Explain why this task is being rejected. The Customer will see this reason:", "")?.trim() || "";
      if (!reason) return;
    } else if (!window.confirm("Approve and publish this task to matching Helpers?")) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setBusyTaskReview(taskId);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/tasks/${taskId}/approval`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, reason }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to review this task.");
      await loadAdminData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review this task.");
    } finally {
      setBusyTaskReview(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8fb]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1500px] items-center px-6 py-4">
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-10 w-auto"
            />
          </div>
        </header>

        <div className="flex min-h-[75vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#2fad45]" />
            <p className="mt-4 font-semibold text-slate-600">
              Loading Admin workspace...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="min-h-screen bg-[#f6f8fb]">
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <img
            src="/UrbanHelpHub-logo.png"
            alt="UrbanHelpHub"
            className="mx-auto h-10 w-auto"
          />

          <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Icon name="alert" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#082f5b]">
              Admin workspace unavailable
            </h1>

            <p className="mt-3 leading-6 text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadAdminData()}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#082f5b] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#06264a] focus:outline-none focus:ring-4 focus:ring-blue-100 active:translate-y-0"
            >
              <Icon name="refresh" className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const stats = dashboard.stats;
  const navigation = (
<div className="space-y-1">
            <SidebarButton
              icon="dashboard"
              label={t("dashboard")}
              active={section === "overview"}
              onClick={() => go("overview")}
            />

            <SidebarButton
              icon="helpers"
              label={t("helpers")}
              active={section === "helpers"}
              onClick={() => { setFilter("all"); go("helpers"); }}
              badge={stats.pending_helpers}
            />

            <SidebarButton
              icon="customers"
              label={t("customers")}
            />

            <SidebarButton
              icon="tasks"
              label="Tasks"
              active={section === "task-approvals"}
              badge={stats.pending_tasks}
              onClick={() => go("task-approvals")}
            />

            <SidebarButton
              icon="payments"
              label={t("payments")}
              active={section === "payments"}
              badge={stats.pending_payments + stats.pending_payouts}
              onClick={() => go("payments")}
            />

            <SidebarButton
              icon="shield"
              label="Verification"
              active={section === "verification"}
              onClick={() => go("verification")}
              badge={stats.pending_services}
            />
          </div>
  );

  return (
    <main id="overview" tabIndex={-1} className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-7">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="cursor-pointer"
              aria-label="Admin dashboard"
            >
              <img
                src="/UrbanHelpHub-logo.png"
                alt="UrbanHelpHub"
                className="h-9 w-auto sm:h-10"
              />
            </button>

            <span className="hidden rounded-full bg-[#082f5b] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white md:inline-flex">
              Admin
            </span>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <RegionSelector />
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-bold text-[#082f5b]">
                {dashboard.admin.name}
              </p>
              <p className="text-xs text-slate-500">
                {t("administrator")}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#238f39]">
              {initials(dashboard.admin.name)}
            </div>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              title="Sign out of Admin"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="logout" className="h-4 w-4" />
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenu((value) => !value)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-[#082f5b] transition hover:bg-slate-50 sm:hidden"
            aria-label="Open Admin menu"
            aria-expanded={mobileMenu}
            aria-controls="admin-mobile-menu"
          >
            <Icon name="menu" />
          </button>
        </div>

        {mobileMenu && (
          <div id="admin-mobile-menu" className="border-t border-slate-100 bg-white px-5 py-4 sm:hidden">
            {navigation}
            <div className="flex items-center gap-3 py-2"><RegionSelector /><NotificationBell /></div>
            <p className="font-bold text-[#082f5b]">
              {dashboard.admin.name}
            </p>

            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600"
            >
              <Icon name="logout" className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </header>

      <nav aria-label="Admin tablet navigation" className="hidden border-b border-slate-200 bg-white px-5 py-3 sm:block lg:hidden">{navigation}</nav>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>

          {navigation}

          <div className="mt-8 rounded-2xl bg-[#eef4f8] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#082f5b]">
              <Icon name="shield" className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-[#082f5b]">
              Protected Admin area
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Admin actions are checked again by the Laravel API.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <section className="bg-[#082f5b]">
            <div className="px-5 py-9 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
                    Operations overview
                  </p>

                  <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                    {t("administrator")} {t("dashboard")}
                  </h1>

                  <p className="mt-3 max-w-2xl leading-7 text-slate-200">
                    Review Helper applications, verification and
                    marketplace activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadAdminData(true)}
                  disabled={refreshing}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 md:self-auto"
                >
                  <Icon
                    name="refresh"
                    className={`h-4 w-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  {refreshing ? "Refreshing..." : t("refreshData")}
                </button>
              </div>
            </div>
          </section>

          <section className="px-5 py-7 sm:px-8 lg:px-10">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Pending Helpers"
                onClick={() => { setFilter("pending"); go("helpers"); }}
                value={stats.pending_helpers}
                note="Need application review"
                icon="clock"
                action="Review queue"
                attention={stats.pending_helpers > 0}
              />

              <StatCard
                title="Active Helpers"
                onClick={() => { setFilter("active"); go("helpers"); }}
                value={stats.active_helpers}
                note={`${stats.verified_helpers} verified`}
                icon="check"
                action="View Helpers"
              />

              <StatCard
                title="Customers"
                value={stats.total_customers}
                note="Registered customers"
                icon="customers"
                action="View customers"
              />

              <StatCard
                title="Total Helpers"
                onClick={() => { setFilter("all"); go("helpers"); }}
                value={stats.total_helpers}
                note={`${stats.pending_services} services pending`}
                icon="helpers"
                action="Manage Helpers"
              />
            </div>

            <div id="helpers" tabIndex={-1} className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-[#082f5b]">
                        Helper review queue
                      </h2>

                      {stats.pending_helpers > 0 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          {stats.pending_helpers} need attention
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Select an application to review its services,
                      verification and approval status.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                      <Icon
                        name="search"
                        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search Helpers..."
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2fad45] focus:ring-4 focus:ring-green-50 sm:w-64"
                      />
                    </div>

                    <select
                      value={filter}
                      onChange={(event) =>
                        setFilter(
                          event.target.value as
                            | "all"
                            | "pending"
                            | "verified"
                            | "active"
                        )
                      }
                      className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#082f5b] outline-none transition focus:border-[#2fad45] focus:ring-4 focus:ring-green-50"
                      aria-label="Filter Helpers"
                    >
                      <option value="pending">
                        Pending review
                      </option>
                      <option value="all">All Helpers</option>
                      <option value="verified">
                        Verified
                      </option>
                      <option value="active">
                        Active
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {visibleHelpers.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {visibleHelpers.map((helper) => (
                    <button
                      type="button"
                      key={helper.id}
                      onClick={() =>
                        router.push(
                          `/admin/helpers/${helper.id}`
                        )
                      }
                      className="group flex w-full cursor-pointer flex-col gap-5 p-5 text-left transition hover:bg-[#f8fbf9] focus:bg-[#f8fbf9] focus:outline-none sm:p-7 xl:flex-row xl:items-center xl:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4f8] font-bold text-[#082f5b] transition group-hover:bg-green-50 group-hover:text-[#238f39]">
                          {initials(helper.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-[#082f5b] group-hover:text-[#238f39]">
                              {helper.name}
                            </h3>

                            <StatusBadge
                              value={
                                helper.verification_status ||
                                "pending"
                              }
                            />
                          </div>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {helper.email}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                            <span>
                              {helper.city || "Location not set"}
                              {helper.province
                                ? `, ${helper.province}`
                                : ""}
                            </span>

                            <span>
                              {helper.pending_services} pending{" "}
                              {helper.pending_services === 1
                                ? "service"
                                : "services"}
                            </span>

                            <span>
                              {helper.approved_services} approved
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-start xl:justify-end">
                        {helper.pending_services > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                            <Icon
                              name="clock"
                              className="h-3.5 w-3.5"
                            />
                            Action needed
                          </span>
                        )}

                        <span className="inline-flex items-center gap-2 rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#2fad45]">
                          Review
                          <Icon
                            name="arrow"
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#238f39]">
                    <Icon name="check" />
                  </div>

                  <h3 className="mt-4 font-bold text-[#082f5b]">
                    {search
                      ? "No Helpers match your search"
                      : "No Helpers in this queue"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {search
                      ? "Try another name, email or location."
                      : "Applications that need attention will appear here."}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <div id="verification" tabIndex={-1} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#082f5b]">
                      Verification workload
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Current Helper approval state
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4f8] text-[#082f5b]">
                    <Icon name="shield" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <MiniStat
                    value={stats.pending_services}
                    label="Services pending"
                  />

                  <MiniStat
                    value={stats.verified_helpers}
                    label="Verified Helpers"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-[#082f5b] p-6 text-white shadow-sm">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-300">
                      Next priority
                    </p>

                    <h2 className="mt-2 text-xl font-bold">
                      Review pending Helper applications
                    </h2>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-200">
                      Check identity status, service experience and
                      requirements before activating a Helper.
                    </p>
                  </div>

                  <Icon
                    name="arrow"
                    className="h-6 w-6 shrink-0 text-green-300"
                  />
                </div>

                {visibleHelpers[0] && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/admin/helpers/${visibleHelpers[0].id}`
                      )
                    }
                    className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#082f5b] transition hover:-translate-y-0.5 hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-white/20 active:translate-y-0"
                  >
                    Review next application
                    <Icon name="arrow" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <section id="task-approvals" tabIndex={-1} className="mt-8 scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div><div className="flex items-center gap-3"><h2 className="text-xl font-bold text-[#082f5b]">Customer task approvals</h2>{stats.pending_tasks > 0 && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{stats.pending_tasks} awaiting review</span>}</div><p className="mt-1 text-sm text-slate-500">Review safety, clarity, schedule and location before notifying Helpers.</p></div>
                <Icon name="tasks" className="h-7 w-7 text-[#082f5b]" />
              </div>
              {tasks.length === 0 ? <div className="px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700"><Icon name="check" /></div><p className="mt-4 font-bold text-[#082f5b]">No tasks awaiting approval</p></div> : <div className="divide-y divide-slate-100">
                {tasks.map((task) => <article key={task.id} className="p-5 sm:p-7">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{task.service_name}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Pending approval</span></div><h3 className="mt-3 text-lg font-bold text-[#082f5b]">#{task.id} · {task.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{task.description}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"><span>Customer: {task.customer_name} ({task.customer_email})</span><span>📍 {[task.address_line_1, task.city, task.province, task.postal_code].filter(Boolean).join(", ")}</span><span>📅 {task.scheduled_date || "Flexible"} {task.scheduled_start_time?.slice(0, 5) || ""}</span></div></div>
                    <div className="flex shrink-0 gap-2"><button type="button" disabled={busyTaskReview === task.id} onClick={() => reviewTask(task.id, "approved")} className="rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyTaskReview === task.id ? "Reviewing..." : "✓ Approve & publish"}</button><button type="button" disabled={busyTaskReview === task.id} onClick={() => reviewTask(task.id, "rejected")} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50">Reject</button></div>
                  </div>
                </article>)}
              </div>}
            </section>

            <section id="payments" tabIndex={-1} className="mt-8 scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#238f39]">Marketplace finance</p>
                    <h2 className="mt-2 text-xl font-bold text-[#082f5b]">Payments and commissions</h2>
                    <p className="mt-1 text-sm text-slate-500">Monitor Customer payments, UrbanHelpHub fees and Helper payouts.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <FinanceMini label="Gross volume" value={formatMoney(stats.gross_volume, "CAD")} />
                    <FinanceMini label="Platform fees" value={formatMoney(stats.platform_revenue, "CAD")} />
                    <FinanceMini label="Payments pending" value={String(stats.pending_payments)} />
                    <FinanceMini label="Payouts pending" value={String(stats.pending_payouts)} />
                  </div>
                </div>
              </div>

              {payments.length === 0 ? <div className="px-6 py-14 text-center text-sm font-semibold text-slate-500">Completed-task payments will appear here.</div> : <div className="divide-y divide-slate-100">
                {payments.map((payment) => <article key={payment.id} className="p-5 sm:p-7">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#082f5b]">#{payment.task_id} · {payment.task_title}</h3><StatusBadge value={payment.status} /></div>
                      <p className="mt-1 text-sm text-slate-500">{payment.customer_name} → {payment.helper_name || "Helper"} · {payment.provider}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-slate-600"><span>Customer total: {formatMoney(payment.total_amount, payment.currency)}</span><span>CAD total: {formatMoney(payment.settlement_total_amount, "CAD")}</span><span>CAD fee: {formatMoney(payment.settlement_platform_fee, "CAD")}</span><span>CAD Helper net: {formatMoney(payment.settlement_helper_net, "CAD")}</span><span>Payout: {statusText(payment.payout_status)}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {payment.status === "pending" && <><button type="button" disabled={busyFinance === `payments-${payment.id}`} onClick={() => updateFinance("payments", payment.id, "paid")} className="rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Mark payment paid</button><button type="button" disabled={busyFinance === `payments-${payment.id}`} onClick={() => updateFinance("payments", payment.id, "failed")} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50">Mark failed</button></>}
                      {payment.status === "paid" && payment.payout_id && payment.payout_status === "pending" && <button type="button" disabled={busyFinance === `payouts-${payment.payout_id}`} onClick={() => updateFinance("payouts", payment.payout_id!, "paid")} className="rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Release Helper payout</button>}
                      {payment.payout_status === "paid" && <span className="rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">✓ Settled</span>}
                    </div>
                  </div>
                </article>)}
              </div>}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function SidebarButton({
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={onClick ? `${label} section` : "Customer management is not implemented in this project."}
      disabled={!onClick}
      aria-current={active ? "location" : undefined}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-green-50 ${
        active
          ? "bg-[#082f5b] text-white"
          : "text-slate-600 hover:bg-green-50 hover:text-[#238f39]"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon name={icon} className="h-4 w-4" />
        {label}
      </span>

      {typeof badge === "number" && badge > 0 ? (
        <span
          className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs ${
            active
              ? "bg-green-400 text-[#082f5b]"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {badge}
        </span>
      ) : (
        !active && (
          <Icon
            name="chevron"
            className="h-4 w-4 opacity-40"
          />
        )
      )}
    </button>
  );
}

function StatCard({
  title,
  value,
  note,
  icon,
  action,
  attention = false,
  onClick,
}: {
  title: string;
  value: number;
  note: string;
  icon: IconName;
  action: string;
  attention?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={onClick ? action : "Customer management is not implemented in this project."}
      className="group w-full cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-green-50 active:translate-y-0 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#082f5b]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
            attention
              ? "bg-amber-50 text-amber-700"
              : "bg-[#eef4f8] text-[#082f5b] group-hover:bg-green-50 group-hover:text-[#238f39]"
          }`}
        >
          <Icon name={icon} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {note}
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[#238f39]">
        {action}
        <Icon
          name="arrow"
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}

function StatusBadge({
  value,
}: {
  value: string;
}) {
  const normalized = value.toLowerCase();

  const style =
    normalized === "verified" ||
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "paid" ||
    normalized === "completed"
      ? "bg-green-50 text-[#238f39]"
      : normalized === "rejected" ||
        normalized === "suspended"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}
    >
      {statusText(value)}
    </span>
  );
}

function MiniStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f9fc] p-4">
      <p className="text-2xl font-bold text-[#082f5b]">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}

function FinanceMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-28 rounded-2xl bg-[#f6f8fb] px-4 py-3">
      <p className="text-lg font-bold text-[#082f5b]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}
