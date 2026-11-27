"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";
import { API_URL } from "@/lib/api";

const provinces = [
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"], ["NS", "Nova Scotia"], ["NT", "Northwest Territories"],
  ["NU", "Nunavut"], ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"],
  ["SK", "Saskatchewan"], ["YT", "Yukon"],
];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timezones = [
  ["America/St_Johns", "Newfoundland"], ["America/Halifax", "Atlantic"], ["America/Toronto", "Eastern"],
  ["America/Winnipeg", "Central"], ["America/Edmonton", "Mountain"], ["America/Vancouver", "Pacific"],
];
const profileFields = ["phone", "headline", "bio", "city", "province", "postal_code"] as const;
type ProfileField = typeof profileFields[number];
type EditableService = {
  id: number;
  name: string;
  hourly_rate: string | number | null;
  years_experience: number | null;
  experience_summary: string | null;
  approval_status?: string;
};
type HelperData = {
  user: { role: string; phone?: string | null; currency_code?: string | null };
  profile: Partial<Record<ProfileField, string | null>> | null;
  services: EditableService[];
  availability: Array<{ day_of_week: number; start_time: string; end_time: string; is_available: number | boolean; timezone: string }>;
};
type Feedback = { text: string; error?: boolean };

function accessToken() {
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = accessToken();
  if (!token) {
    window.location.replace("/login/");
    throw new Error("Please sign in again.");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  if (response.status === 401) window.location.replace("/login/");
  const result = await response.json();
  if (!response.ok || !result.success) {
    const detail = Object.values(result.errors ?? {}).flat()[0];
    throw new Error(typeof detail === "string" ? detail : result.message || "Unable to save your changes.");
  }
  return result;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-[#082f5b]">{label}{children}</label>;
}

function Save({ busy, label }: { busy: boolean; label: string }) {
  return <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-[#082f5b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{label}</button>;
}

function Message({ item }: { item?: Feedback }) {
  if (!item) return null;

  return <p role={item.error ? "alert" : "status"} className={`rounded-xl p-3 text-sm ${item.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>{item.text}</p>;
}

function Editor({ account }: { account: HelperData }) {
  const [profile, setProfile] = useState(() => Object.fromEntries(
    profileFields.map((key) => [key, account.profile?.[key] ?? (key === "phone" ? account.user.phone ?? "" : "")])
  ));
  const [services, setServices] = useState(account.services);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [week, setWeek] = useState(() => days.map((_, index) => {
    const row = account.availability.find((entry) => entry.day_of_week === index);
    return { day_of_week: index, is_available: Boolean(row?.is_available), start_time: row?.start_time.slice(0, 5) || "09:00", end_time: row?.end_time.slice(0, 5) || "17:00" };
  }));
  const currentTimezone = account.availability[0]?.timezone || "America/Toronto";
  const [timezone, setTimezone] = useState(currentTimezone);

  async function save(key: string, path: string, payload: object, method = "PATCH") {
    if (pending) return false;
    setPending(key);
    setFeedback((prior) => ({ ...prior, [key]: { text: "Saving…" } }));
    try {
      const result = await request(path, { method, body: JSON.stringify(payload) });
      setFeedback((prior) => ({ ...prior, [key]: { text: result.message || "Changes saved." } }));
      return true;
    } catch (cause) {
      setFeedback((prior) => ({ ...prior, [key]: { text: cause instanceof Error ? cause.message : "Unable to save your changes.", error: true } }));
      return false;
    } finally {
      setPending(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>, section: "profile" | "service-area") {
    event.preventDefault();
    const submitted = Object.fromEntries(new FormData(event.currentTarget));
    const edits = Object.fromEntries(Object.entries(submitted)
      .map(([key, value]) => [key, String(value).trim()] as const)
      .filter(([key, value]) => value !== profile[key])
      .map(([key, value]) => [key, value || null]));
    if (!Object.keys(edits).length) {
      setFeedback((prior) => ({ ...prior, [section]: { text: "No changes to save." } }));
      return;
    }
    if (await save(section, "/helper/profile", edits)) {
      setProfile((prior) => ({ ...prior, ...Object.fromEntries(Object.entries(edits).map(([key, value]) => [key, value ?? ""])) }));
    }
  }

  async function saveService(event: FormEvent<HTMLFormElement>, service: EditableService) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rate = String(form.get("hourly_rate") ?? "").trim();
    const years = String(form.get("years_experience") ?? "").trim();
    const summary = String(form.get("experience_summary") ?? "").trim();
    const changes: Partial<EditableService> = {};
    const newRate = rate === "" ? null : Number(rate);
    const newYears = years === "" ? null : Number(years);
    const newSummary = summary || null;
    if (newRate !== (service.hourly_rate === null ? null : Number(service.hourly_rate))) changes.hourly_rate = newRate;
    if (newYears !== service.years_experience) changes.years_experience = newYears;
    if (newSummary !== (service.experience_summary || null)) changes.experience_summary = newSummary;
    if (!Object.keys(changes).length) {
      setFeedback((prior) => ({ ...prior, [String(service.id)]: { text: "No changes to save." } }));
      return;
    }
    if (await save(String(service.id), `/helper/profile/services/${service.id}`, changes)) {
      setServices((prior) => prior.map((entry) => entry.id === service.id
        ? { ...entry, ...changes, approval_status: "pending" } : entry));
    }
  }

  return (
    <>
      <nav aria-label="Profile sections" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold underline">
        <a href="#profile">Profile</a><a href="#service-area">Service area</a><a href="#services">Services</a><a href="#availability">Availability</a>
        <a href="/helper/dashboard/#helper-documents">Verification documents</a>
      </nav>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <form id="profile" onSubmit={(event) => void saveProfile(event, "profile")} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold">Profile details</h2>
          <Field label="Phone number"><input className="input" name="phone" type="tel" autoComplete="tel" maxLength={30} defaultValue={profile.phone} /></Field>
          <Field label="Headline"><input className="input" name="headline" maxLength={120} defaultValue={profile.headline} /></Field>
          <Field label="About you"><textarea className="input" name="bio" rows={4} maxLength={2000} defaultValue={profile.bio} /></Field>
          <Message item={feedback.profile} />
          <Save busy={pending !== null} label="Save profile details" />
        </form>
        <form id="service-area" onSubmit={(event) => void saveProfile(event, "service-area")} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold">Canadian service area</h2>
          <p className="text-sm text-slate-600">Changing your service area sends it for review before new jobs can be matched.</p>
          <Field label="City"><input className="input" name="city" maxLength={120} required defaultValue={profile.city} /></Field>
          <Field label="Province or territory">
            <select className="input" name="province" required defaultValue={profile.province}>
              <option value="">Select a province or territory</option>
              {provinces.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </Field>
          <Field label="Postal code"><input className="input" name="postal_code" autoComplete="postal-code" maxLength={7} required defaultValue={profile.postal_code} /></Field>
          <Message item={feedback["service-area"]} />
          <Save busy={pending !== null} label="Save service area" />
        </form>
      </div>
      <section id="services" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold">Service rates and experience</h2>
        {services.length > 0 && <p className="text-sm text-slate-600">Save each service separately. Updated services are reviewed before they become available again.</p>}
        <Link href="/become-a-helper/" className="inline-block text-sm font-semibold underline">
          {services.length ? "Add or remove services" : "Choose your first services"}
        </Link>
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <form key={service.id} onSubmit={(event) => void saveService(event, service)} className="min-w-0 space-y-4 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{service.name}</h3>
                <span className="text-sm capitalize text-slate-600">{service.approval_status}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Hourly rate (${account.user.currency_code || "CAD"})`}><input className="input" name="hourly_rate" type="number" min="0" max="9999.99" step="0.01" defaultValue={service.hourly_rate ?? ""} /></Field>
                <Field label="Years of experience"><input className="input" name="years_experience" type="number" min="0" max="80" defaultValue={service.years_experience ?? ""} /></Field>
              </div>
              <Field label="Relevant experience"><textarea className="input" name="experience_summary" rows={3} maxLength={1000} defaultValue={service.experience_summary ?? ""} /></Field>
              <Message item={feedback[String(service.id)]} />
              <Save busy={pending !== null} label={`Save ${service.name}`} />
            </form>
          ))}
        </div>
      </section>
      <form id="availability" onSubmit={(event) => {
        event.preventDefault();
        void save("availability", "/helper/onboarding/availability", { availability: week, timezone }, "PUT");
      }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold">Weekly availability</h2>
        <div className="max-w-sm">
          <Field label="Time zone">
            <select className="input" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {!timezones.some(([value]) => value === currentTimezone) && <option value={currentTimezone}>{currentTimezone}</option>}
              {timezones.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {week.map((day, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-3">
              <label className="flex min-h-9 items-center gap-2 font-semibold">
                <input type="checkbox" checked={day.is_available}
                  onChange={(event) => setWeek((prior) => prior.map((entry, offset) => offset === index ? { ...entry, is_available: event.target.checked } : entry))} />
                {days[index]}
              </label>
              {day.is_available && (
                <div className="grid gap-2 min-[380px]:grid-cols-2">
                  <Field label="Start"><input className="input" type="time" required value={day.start_time}
                    onChange={(event) => setWeek((prior) => prior.map((entry, offset) => offset === index ? { ...entry, start_time: event.target.value } : entry))} /></Field>
                  <Field label="End"><input className="input" type="time" required value={day.end_time}
                    onChange={(event) => setWeek((prior) => prior.map((entry, offset) => offset === index ? { ...entry, end_time: event.target.value } : entry))} /></Field>
                </div>
              )}
            </div>
          ))}
        </div>
        <Message item={feedback.availability} />
        <Save busy={pending !== null} label="Save availability" />
      </form>
    </>
  );
}

export default function HelperProfilePage() {
  const [data, setData] = useState<HelperData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request("/helper/onboarding", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then((result) => setData(result.data))
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load your Helper profile.");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (data && /^#(profile|service-area|services|availability)$/.test(window.location.hash)) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, [data]);

  return (
    <main className="min-h-dvh bg-[#f6f8fb] text-[#082f5b]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <SiteLogo href="/helper/dashboard/" />
          <Link href="/helper/dashboard/" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Back to Helper dashboard</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-7 sm:px-6">
        <h1 className="text-3xl font-bold">Edit Helper profile</h1>
        {error ? <Message item={{ text: error, error: true }} />
          : !data ? <p role="status">Loading your profile…</p>
          : !data.profile ? <Link href="/become-a-helper/" className="text-sm font-semibold underline">Complete your Helper application</Link>
          : <Editor account={data} />}
      </div>
    </main>
  );
}
