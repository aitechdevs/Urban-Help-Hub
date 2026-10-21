"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import RegionSelector from "@/components/RegionSelector";
import { formatMoney } from "@/lib/regions";
import { useLanguage } from "@/components/LanguageProvider";
import { API_URL } from "@/lib/api";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

type Candidate = {
  assignment_id: number;
  status: string;
  agreed_hourly_rate?: string | number | null;
  helper_name: string;
  headline?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

type PaymentSummary = {
  currency: string;
  subtotal_amount: string | number;
  platform_fee: string | number;
  total_amount: string | number;
  status: string;
  country_code?: string;
  currency_code?: string;
};

type CustomerTask = {
  id: number;
  title: string;
  description: string;
  status: string;
  service_name: string;
  currency?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  candidates: Candidate[];
  status_note?: string | null;
  payment?: PaymentSummary | null;
  my_review?: { id: number; rating: number } | null;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}

function prettyStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [taskFilter, setTaskFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tasks, setTasks] = useState<CustomerTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [busyAssignment, setBusyAssignment] = useState<number | null>(null);
  const [busyTask, setBusyTask] = useState<number | null>(null);

  useEffect(() => {
    const storedUser =
      window.localStorage.getItem("urbanhelphub_user") ||
      window.sessionStorage.getItem("urbanhelphub_user");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser: User = JSON.parse(storedUser);

      if (parsedUser.role === "helper") {
        router.replace("/helper/dashboard");
        return;
      }

      if (parsedUser.role === "admin") {
        router.replace("/admin");
        return;
      }

      // Authentication state is intentionally hydrated from browser storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(parsedUser);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user || user.role !== "customer") return;

    async function loadTasks() {
      const token = getToken();
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/customer/tasks`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load your tasks.");
        setTasks(result.data || []);
      } catch (err) {
        setTaskError(err instanceof Error ? err.message : "Unable to load your tasks.");
      } finally {
        setTasksLoading(false);
      }
    }
    loadTasks();
  }, [user]);

  async function confirmHelper(taskId: number, assignmentId: number) {
    if (!window.confirm("Confirm this Helper for your task? Other Helper responses will be closed.")) return;
    const token = getToken();
    if (!token) return;
    setBusyAssignment(assignmentId);
    setTaskError("");
    try {
      const response = await fetch(`${API_URL}/customer/tasks/${taskId}/confirm`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignment_id: assignmentId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to confirm this Helper.");
      window.location.reload();
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Unable to confirm this Helper.");
      setBusyAssignment(null);
    }
  }

  async function taskAction(taskId: number, action: "confirm-completion" | "review", body?: object) {
    const token = getToken();
    if (!token) return;
    setBusyTask(taskId);
    setTaskError("");
    try {
      const response = await fetch(`${API_URL}/${action === "review" ? `tasks/${taskId}/review` : `customer/tasks/${taskId}/confirm-completion`}`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body || {}),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update this task.");
      window.location.reload();
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Unable to update this task.");
      setBusyTask(null);
    }
  }

  function reviewTask(taskId: number) {
    const ratingText = window.prompt("Rate your Helper from 1 to 5:", "5");
    if (ratingText === null) return;
    const rating = Number(ratingText);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setTaskError("Please enter a whole-number rating from 1 to 5.");
      return;
    }
    const comment = window.prompt("Add a short review (optional):", "") ?? "";
    taskAction(taskId, "review", { rating, comment });
  }

  function logout() {
    window.localStorage.removeItem("urbanhelphub_token");
    window.localStorage.removeItem("urbanhelphub_user");

    window.sessionStorage.removeItem("urbanhelphub_token");
    window.sessionStorage.removeItem("urbanhelphub_user");

    router.push("/login");
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <img
            src="/UrbanHelpHub-logo.png"
            alt="UrbanHelpHub"
            className="mx-auto h-12 w-auto"
          />

          <p className="mt-5 font-semibold text-slate-500">
            Loading your account...
          </p>
        </div>
      </main>
    );
  }

  const firstName = user.name.split(" ")[0];
  const activeTasks = tasks.filter((task) => ["pending_approval", "open", "awaiting_confirmation", "in_progress", "awaiting_completion"].includes(task.status)).length;
  const upcomingTasks = tasks.filter((task) => task.status === "scheduled").length;
  const visibleTasks = tasks.filter((task) => taskFilter === "all" || (taskFilter === "active" ? ["draft", "pending_approval", "open", "awaiting_confirmation", "in_progress", "awaiting_completion"].includes(task.status) : task.status === taskFilter));
  function showTasks(filter: string) {
    setTaskFilter(filter);
    document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-slate-900">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">

          <Link href="/">
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-11 w-auto max-w-[215px] object-contain sm:h-12"
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
            <a
              href="/dashboard"
              className="text-[var(--navy)]"
            >
              {t("dashboard")}
            </a>

            <a
              href="#tasks"
              className="hover:text-[var(--navy)]"
            >
              {t("tasks")}
            </a>

            <a
              href="#messages"
              className="hover:text-[var(--navy)]"
            >
              {t("messages")}
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <RegionSelector />
            <NotificationBell />
            <a
              href="/post-a-task"
              className="rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-black text-white"
            >
              {t("postTask")}
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded-full bg-[var(--navy)] font-black text-white"
              aria-label="Account menu"
            >
              {firstName.charAt(0).toUpperCase()}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-2xl text-[var(--navy)] md:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-4 top-[68px] w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="border-b border-slate-100 p-5">
              <p className="font-black text-[var(--navy)]">
                {user.name}
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user.email}
              </p>
            </div>

            <div className="grid p-2">
              <a
                href="/dashboard"
                className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-slate-50"
              >
                {t("dashboard")}
              </a>

              <a
                href="#tasks"
                className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-slate-50"
              >
                {t("tasks")}
              </a>

              <a
                href="#messages"
                className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-slate-50"
              >
                {t("messages")}
              </a>

              <a
                href="#profile"
                className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-slate-50"
              >
                Account settings
              </a>

              <button
                type="button"
                onClick={logout}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* DASHBOARD */}

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">

        {/* WELCOME */}

        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.17em] text-[var(--green)]">
              Your dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
              {t("welcome")}, {firstName}.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              {t("manageTasks")}
            </p>
          </div>

          <a
            href="/post-a-task"
            className="flex h-14 items-center justify-center rounded-2xl bg-[var(--green)] px-7 font-black text-white shadow-sm"
          >
            + Post a new task
          </a>
        </section>

        {/* SUMMARY CARDS */}

        <section className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [String(activeTasks), t("activeTasks"), "Open tasks and Helper responses", "active"],
            [String(upcomingTasks), t("upcoming"), "Scheduled bookings", "scheduled"],
            ["0", t("messages"), "Unread conversations", "messages"],
            [String(completedTasks), t("completed"), "Tasks completed", "completed"],
          ].map(([number, title, description, filter]) => (
            <button type="button" aria-pressed={filter !== "messages" && taskFilter === filter} onClick={() => filter === "messages" ? document.getElementById("messages")?.scrollIntoView({ behavior: "smooth" }) : showTasks(filter)}
              key={title}
              className="rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm"
            >
              <div className="text-3xl font-black text-[var(--navy)]">
                {number}
              </div>

              <h2 className="mt-4 font-black text-slate-800">
                {title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </button>
          ))}
        </section>

        {/* MAIN CONTENT */}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_.75fr]">

          {/* TASK AREA */}

          <article id="tasks" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--navy)]">
                  {t("yourTasks")}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Track your current and upcoming bookings.
                </p>
              </div>

              <a
                href="#tasks" onClick={() => showTasks("all")}
                className="hidden text-sm font-black text-[var(--green)] sm:block"
              >
                View all →
              </a>
            </div>

            <div aria-label="Task filters" className="mt-5 flex flex-wrap gap-2">
              {[["all", "All"], ["active", "Active"], ["scheduled", "Scheduled"], ["completed", "Completed"]].map(([value, label]) => <button key={value} type="button" aria-pressed={taskFilter === value} onClick={() => setTaskFilter(value)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${taskFilter === value ? "bg-[var(--navy)] text-white" : "bg-white text-slate-600"}`}>{label}</button>)}
            </div>
            {taskError && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{taskError}</div>}

            {tasksLoading ? <p className="mt-8 text-center font-semibold text-slate-500">Loading your tasks...</p> : visibleTasks.length > 0 ? (
              <div className="mt-6 space-y-4">
                {visibleTasks.map((task) => <article key={task.id} className="rounded-[24px] border border-slate-200 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{task.service_name}</span><h3 className="mt-3 text-lg font-black text-[var(--navy)]">{task.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{prettyStatus(task.status)}</span></div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500"><span>📍 {[task.city, task.province].filter(Boolean).join(", ")}</span><span>📅 {task.scheduled_date || "Flexible"}</span><span>◷ {task.scheduled_start_time?.slice(0, 5) || "Flexible"}</span></div>
                  {["draft", "pending_approval", "open", "awaiting_confirmation", "scheduled"].includes(task.status) && !task.payment && <Link href={`/post-a-task?edit=${task.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-[var(--navy)]"><span aria-hidden="true">✎</span> Edit task / schedule</Link>}
                  {task.status === "pending_approval" && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-black">Awaiting Admin approval</p><p className="mt-1">UrbanHelpHub will review this task before notifying matching Helpers.</p></div>}
                  {task.status === "rejected" && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-black">Task not approved</p><p className="mt-1">{task.status_note || "Please review the task details and contact support."}</p></div>}
                  {task.candidates?.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Helper</p><div className="mt-3 space-y-3">{task.candidates.map((candidate) => <div key={candidate.assignment_id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-[var(--navy)]">{candidate.helper_name}</p><p className="mt-1 text-xs text-slate-500">{candidate.headline || "Verified UrbanHelpHub Helper"}{candidate.agreed_hourly_rate ? ` · ${formatMoney(candidate.agreed_hourly_rate, task.currency || "CAD")}/hr` : ""}</p></div><div className="flex flex-wrap items-center gap-2">{candidate.status === "accepted" ? <button type="button" disabled={busyAssignment === candidate.assignment_id} onClick={() => confirmHelper(task.id, candidate.assignment_id)} className="rounded-xl bg-[var(--green)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busyAssignment === candidate.assignment_id ? "Confirming..." : "Confirm Helper"}</button> : <span className="text-sm font-black text-emerald-700">✓ {prettyStatus(candidate.status)}</span>}{task.status === "awaiting_completion" && <button type="button" disabled={busyTask === task.id} onClick={() => window.confirm("Confirm that this job has been completed satisfactorily?") && taskAction(task.id, "confirm-completion")} className="rounded-xl bg-[var(--green)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busyTask === task.id ? "Confirming..." : "Confirm completion"}</button>}{task.status === "completed" && !task.my_review && <button type="button" disabled={busyTask === task.id} onClick={() => reviewTask(task.id)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-[var(--navy)] disabled:opacity-50">Leave review</button>}{task.my_review && <span className="text-sm font-black text-amber-600">{"★".repeat(task.my_review.rating)}</span>}</div></div>)}</div>{task.payment && <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-black">Payment: {prettyStatus(task.payment.status)}</p><p className="mt-1">Service total: {formatMoney(task.payment.total_amount, task.payment.currency)} · Platform fee: {formatMoney(task.payment.platform_fee, task.payment.currency)}</p></div>}</div>}
                </article>)}
              </div>
            ) : <div className="mt-8 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/60 px-5 py-12 text-center">

              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">
                ✓
              </div>

              <h3 className="mt-5 text-xl font-black text-[var(--navy)]">
                No tasks in this view
              </h3>

              <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
                When you book help through UrbanHelpHub, your tasks and
                their progress will appear here.
              </p>

              <a
                href="/post-a-task"
                className="mt-6 inline-flex rounded-full bg-[var(--navy)] px-6 py-3 text-sm font-black text-white"
              >
                Find a Helper
              </a>
            </div>}
          </article>

          {/* QUICK ACTIONS */}

          <aside className="rounded-[28px] bg-[var(--navy)] p-6 text-white shadow-sm sm:p-8">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Quick actions
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em]">
              {t("quickActions")}
            </h2>

            <div className="mt-6 grid gap-3">
              {[
                ["✂️", "Book Mobile Salon", "mobile-salon"],
                ["✨", "Book cleaning", "cleaning"],
                ["📦", "Get moving help", "moving-help"],
                ["🪑", "Assemble furniture", "furniture-assembly"],
                ["🚚", "Delivery & errands", "delivery-errands"],
              ].map(([icon, title, slug]) => (
                <a
                  key={slug}
                  href={`/post-a-task?service=${slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg">
                    {icon}
                  </span>

                  <span className="font-bold">
                    {title}
                  </span>

                  <span className="ml-auto">
                    →
                  </span>
                </a>
              ))}
            </div>
          </aside>
        </section>

        {/* TRUST / PROFILE */}

        <section className="mt-6 grid gap-6 md:grid-cols-2">

          <article
            id="profile"
            className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.17em] text-[var(--green)]">
                  Account
                </p>

                <h2 className="mt-2 text-2xl font-black text-[var(--navy)]">
                  Your profile
                </h2>
              </div>

              <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--navy)] text-lg font-black text-white">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="mt-6 grid gap-4 text-sm">
              <div className="border-b border-slate-100 pb-4">
                <div className="text-slate-400">
                  Name
                </div>

                <div className="mt-1 font-bold text-slate-700">
                  {user.name}
                </div>
              </div>

              <div className="border-b border-slate-100 pb-4">
                <div className="text-slate-400">
                  Email
                </div>

                <div className="mt-1 break-all font-bold text-slate-700">
                  {user.email}
                </div>
              </div>

              <div>
                <div className="text-slate-400">
                  Phone
                </div>

                <div className="mt-1 font-bold text-slate-700">
                  {user.phone || "Not added"}
                </div>
              </div>
            </div>
          </article>

          <article
            id="messages"
            className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8"
          >
            <p className="text-xs font-black uppercase tracking-[0.17em] text-[var(--green)]">
              {t("messages")}
            </p>

            <h2 className="mt-2 text-2xl font-black text-[var(--navy)]">
              Conversations
            </h2>

            <div className="mt-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">
                💬
              </div>

              <h3 className="mt-4 font-black text-[var(--navy)]">
                No messages yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Conversations with Helpers will appear here once you
                start booking tasks.
              </p>
            </div>
          </article>
        </section>
      </div>

      {/* FOOTER */}

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <img
            src="/UrbanHelpHub-logo.png"
            alt="UrbanHelpHub"
            className="h-10 w-auto max-w-[190px] object-contain"
          />

          <p className="text-xs font-semibold text-slate-400">
            © 2026 UrbanHelpHub. Canada.
          </p>
        </div>
      </footer>
    </main>
  );
}
