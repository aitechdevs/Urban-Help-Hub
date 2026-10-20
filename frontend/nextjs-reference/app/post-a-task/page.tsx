"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RegionSelector from "@/components/RegionSelector";
import { formatMoney, getStoredUser, REGIONS } from "@/lib/regions";
import { API_URL } from "@/lib/api";

type Category = { id: number; name: string; slug: string; description?: string | null };
type FormState = {
  service_category_id: number | null; title: string; description: string;
  address_line_1: string; city: string; province: string; postal_code: string; country: string;
  scheduled_date: string; scheduled_start_time: string; scheduled_end_time: string;
  is_time_flexible: boolean; pricing_type: "hourly" | "fixed" | "flexible";
  budget_min: string; budget_max: string;
};

const initialForm: FormState = {
  service_category_id: null, title: "", description: "", address_line_1: "",
  city: "Toronto", province: "Ontario", postal_code: "", country: "Canada",
  scheduled_date: "", scheduled_start_time: "09:00", scheduled_end_time: "12:00",
  is_time_flexible: false, pricing_type: "flexible", budget_min: "", budget_max: "",
};

function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}

function firstError(errors?: Record<string, string[]>) {
  return errors ? Object.values(errors).flat()[0] : undefined;
}

export default function PostATaskPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; matches: number } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [currency, setCurrency] = useState("CAD");

  useEffect(() => {
    async function load() {
      if (!getToken()) { router.replace("/login"); return; }
      try {
        const storedUser = getStoredUser();
        const storedCountryCode = typeof storedUser?.country_code === "string" ? storedUser.country_code : "CA";
        const region = REGIONS.find((item) => item.countryCode === storedCountryCode);
        if (region) {
          setCurrency(region.currency);
          setForm((current) => ({ ...current, country: region.country }));
        }
        const response = await fetch(`${API_URL}/service-categories`, { headers: { Accept: "application/json" }, cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load services.");
        setCategories(result.data || []);
        const params = new URLSearchParams(window.location.search);
        const edit = params.get("edit");
        if (edit) {
          const id = Number(edit);
          if (!Number.isInteger(id) || id < 1) throw new Error("Invalid task.");
          const taskResponse = await fetch(`${API_URL}/customer/tasks`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` }, cache: "no-store",
          });
          const taskResult = await taskResponse.json();
          if (!taskResponse.ok || !taskResult.success) throw new Error(taskResult.message || "Unable to load task.");
          const task = taskResult.data.find((item: { id: number }) => item.id === id);
          if (!task || !["draft", "pending_approval", "open", "awaiting_confirmation", "scheduled"].includes(task.status) || task.payment) throw new Error("This task cannot be edited.");
          setEditId(id);
          setCurrency(task.currency || "CAD");
          setForm({
            service_category_id: task.service_category_id, title: task.title || "", description: task.description || "",
            address_line_1: task.address_line_1 || "", city: task.city || "", province: task.province || "",
            postal_code: task.postal_code || "", country: task.country || "Canada",
            scheduled_date: task.scheduled_date?.slice(0, 10) || "",
            scheduled_start_time: task.scheduled_start_time?.slice(0, 5) || "",
            scheduled_end_time: task.scheduled_end_time?.slice(0, 5) || "",
            is_time_flexible: Boolean(Number(task.is_time_flexible)), pricing_type: task.pricing_type,
            budget_min: task.budget_min == null ? "" : String(task.budget_min),
            budget_max: task.budget_max == null ? "" : String(task.budget_max),
          });
        } else {
          const category = (result.data as Category[]).find((item) => item.slug === params.get("service"));
          if (category) setForm((current) => ({ ...current, service_category_id: category.id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load services.");
      } finally { setLoading(false); }
    }
    load();
  }, [router]);

  const selectedCategory = useMemo(() => categories.find((item) => item.id === form.service_category_id), [categories, form.service_category_id]);
  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function selectCategory(categoryId: number) {
    setForm((current) => {
      if (current.service_category_id === categoryId) return current;

      return {
        ...current,
        service_category_id: categoryId,
        title: "",
        description: "",
      };
    });
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || (new URLSearchParams(window.location.search).has("edit") && !editId)) return;
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    setSubmitting(true); setError("");
    try {
      const response = await fetch(`${API_URL}/customer/tasks${editId ? `/${editId}` : ""}`, {
        method: editId ? "PUT" : "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, budget_min: form.budget_min || null, budget_max: form.budget_max || null, scheduled_end_time: form.scheduled_end_time || null }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(firstError(result.errors) || result.message || "Unable to publish this task.");
      setSuccess({ message: result.message, matches: Number(result.data?.matched_helpers || 0) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish this task.");
    } finally { setSubmitting(false); }
  }

  if (success) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 px-5"><section className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div><p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-[var(--green)]">{editId ? "Task updated" : "Task submitted"}</p><h1 className="mt-2 text-3xl font-black text-[var(--navy)]">Your request is awaiting approval.</h1><p className="mt-4 leading-7 text-slate-600">{success.message}</p><div className="mt-6 rounded-2xl bg-slate-50 p-4 font-bold text-[var(--navy)]">Verified matching Helpers will be notified after Admin approval.</div><button type="button" onClick={() => router.replace("/dashboard")} className="mt-7 w-full rounded-2xl bg-[var(--navy)] px-6 py-4 font-black text-white">View my tasks →</button></section></main>;
  }

  return <main className="min-h-screen bg-slate-50 text-slate-950">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><button type="button" onClick={() => router.push("/dashboard")}><img src="/UrbanHelpHub-logo.png" alt="UrbanHelpHub" className="h-11 w-auto" /></button><div className="flex items-center gap-3"><RegionSelector /><button type="button" onClick={() => router.push("/dashboard")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-[var(--navy)]">← Dashboard</button></div></div></header>
    <section className="bg-[var(--navy)] text-white"><div className="mx-auto max-w-6xl px-5 py-10 lg:px-8"><p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">Customer request</p><h1 className="mt-2 text-4xl font-black tracking-tight">{editId ? "Edit task" : "Post a task"}</h1><p className="mt-3 max-w-2xl text-slate-200">Tell us what you need. UrbanHelpHub will securely match your task with verified Helpers in the same service area.</p></div></section>
    {editId && <div role="status" className="mx-auto mt-6 max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">Saving sends this task for approval again. Existing Helper offers and bookings will be withdrawn and Helpers notified. You will need to confirm a Helper again. <Link href="/dashboard" className="ml-2 font-bold underline">Cancel →</Link></div>}
    <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_330px] lg:px-8 lg:py-10">
      <div className="space-y-6">
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">{error}</div>}
        <Card number="1" title="Choose a service" subtitle="Only active UrbanHelpHub services are shown.">{loading ? <p className="text-slate-500">Loading services...</p> : <div className="grid gap-3 sm:grid-cols-2">{categories.map((category) => { const active = form.service_category_id === category.id; return <button type="button" key={category.id} onClick={() => selectCategory(category.id)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-[var(--green)] bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:bg-slate-50"}`}><span className="font-black text-[var(--navy)]">{category.name}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{category.description}</span></button>; })}</div>}</Card>
        <Card number="2" title="Task details" subtitle="Give Helpers enough information to make a confident decision."><Field label="Short task title"><input required maxLength={180} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Example: Deep clean a two-bedroom apartment" className="input" /></Field><Field label="Description"><textarea required minLength={10} maxLength={5000} rows={6} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the work, size, access, equipment and anything the Helper should know." className="input resize-none" /></Field></Card>
        <Card number="3" title="Location" subtitle="Your exact street address is visible only after you confirm a Helper."><Field label="Task address"><input required value={form.address_line_1} onChange={(e) => update("address_line_1", e.target.value)} placeholder="Street address and unit" className="input" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="City"><input required value={form.city} onChange={(e) => update("city", e.target.value)} className="input" /></Field><Field label="Province / state"><input required value={form.province} onChange={(e) => update("province", e.target.value)} className="input" /></Field><Field label="Postal code"><input required value={form.postal_code} onChange={(e) => update("postal_code", e.target.value.toUpperCase())} className="input" /></Field><Field label="Country"><input required value={form.country} onChange={(e) => update("country", e.target.value)} className="input" /></Field></div></Card>
        <Card number="4" title="Schedule and budget" subtitle="Choose the preferred time and pricing range."><div className="grid gap-4 sm:grid-cols-3"><Field label="Date"><input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.scheduled_date} onChange={(e) => update("scheduled_date", e.target.value)} className="input" /></Field><Field label="Start time"><input required type="time" value={form.scheduled_start_time} onChange={(e) => update("scheduled_start_time", e.target.value)} className="input" /></Field><Field label="End time"><input type="time" value={form.scheduled_end_time} onChange={(e) => update("scheduled_end_time", e.target.value)} className="input" /></Field></div><label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4 font-semibold text-slate-700"><input type="checkbox" checked={form.is_time_flexible} onChange={(e) => update("is_time_flexible", e.target.checked)} className="h-4 w-4 accent-[var(--green)]" />My time is flexible</label><div className="grid gap-4 sm:grid-cols-3"><Field label="Pricing"><select value={form.pricing_type} onChange={(e) => update("pricing_type", e.target.value as FormState["pricing_type"])} className="input"><option value="flexible">Flexible</option><option value="hourly">Hourly</option><option value="fixed">Fixed price</option></select></Field><Field label={`Minimum budget (${currency})`}><input type="number" min="0" step="0.01" value={form.budget_min} onChange={(e) => update("budget_min", e.target.value)} className="input" /></Field><Field label={`Maximum budget (${currency})`}><input type="number" min="0" step="0.01" value={form.budget_max} onChange={(e) => update("budget_max", e.target.value)} className="input" /></Field></div></Card>
      </div>
      <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--green)]">Task summary</p><Summary label="Service" value={selectedCategory?.name || "Choose a service"} /><Summary label="Location" value={[form.city, form.province, form.country].filter(Boolean).join(", ")} /><Summary label="Date" value={form.scheduled_date || "Choose a date"} /><Summary label="Time" value={`${form.scheduled_start_time}${form.scheduled_end_time ? `–${form.scheduled_end_time}` : ""}`} /><Summary label="Budget" value={form.budget_min || form.budget_max ? `${form.budget_min ? formatMoney(form.budget_min, currency) : "0"}–${form.budget_max ? formatMoney(form.budget_max, currency) : "open"}` : "Flexible"} /><div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Your task will be offered only to verified Helpers with an approved matching service in this city.</div><button type="submit" disabled={submitting || loading || !form.service_category_id || (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("edit") && !editId)} className="mt-6 w-full rounded-2xl bg-[var(--green)] px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Saving task..." : editId ? "Save changes →" : "Publish and match Helpers →"}</button></aside>
    </form>
  </main>;
}

function Card({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="mb-6 flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--navy)] font-black text-white">{number}</span><div><h2 className="text-xl font-black text-[var(--navy)]">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div></div><div className="space-y-4">{children}</div></section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">{label}</span>{children}</label>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="mt-5 border-b border-slate-100 pb-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-black text-[var(--navy)]">{value}</p></div>; }
