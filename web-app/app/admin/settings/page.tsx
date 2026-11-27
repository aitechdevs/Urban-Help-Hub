"use client";

import { useEffect, useState, type FormEvent } from "react";
import SocialIcon from "@/components/SocialIcon";
import SuperAdminHeader from "@/components/SuperAdminHeader";
import { API_URL } from "@/lib/api";
import { socialIcons, type PlatformSettings, type SocialLink } from "@/lib/platform-settings";

const details = [
  { name: "display_name", label: "Display name", type: "text", max: 100 },
  { name: "tagline", label: "Tagline", type: "text", max: 250 },
  { name: "support_email", label: "Support email", type: "email", max: 254 },
  { name: "support_phone", label: "Support phone", type: "tel", max: 30 },
] as const;

function settingsRequest(token: string, options?: RequestInit) {
  return fetch(`${API_URL}/admin/platform-settings`, {
    ...options,
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...options?.headers },
  });
}

function redirectIfUnauthorized(response: Response) {
  if (response.status === 401 || response.status === 403) {
    window.location.replace(response.status === 401 ? "/login/" : "/admin/");
    return true;
  }
  return false;
}

export default function PlatformSettingsPage() {
  const [token, setToken] = useState("");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [readingIcon, setReadingIcon] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    const timeout = window.setTimeout(() => request.abort("timeout"), 15000);

    async function load() {
      try {
        const credential = sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
        if (!credential) {
          window.location.replace("/login/");
          return;
        }
        const response = await settingsRequest(credential, { signal: request.signal });
        if (redirectIfUnauthorized(response)) return;
        if (!response.ok) throw new Error("Could not load platform settings. Reload the page to try again.");
        const body = await response.json();
        if (!request.signal.aborted) {
          setToken(credential);
          setSettings(body.data);
        }
      } catch {
        if (!request.signal.aborted || request.signal.reason === "timeout") {
          setError("Could not load platform settings. Reload the page to try again.");
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    void load();
    return () => {
      request.abort();
      clearTimeout(timeout);
    };
  }, []);

  function updateLink(index: number, changes: Partial<SocialLink>) {
    setSettings((current) => current && {
      ...current,
      social_links: current.social_links.map((link, position) => position === index ? { ...link, ...changes } : link),
    });
  }

  async function uploadIcon(index: number, file: File) {
    setError("");
    setNotice("");
    if (!["image/png", "image/webp"].includes(file.type) || file.size > 32768) {
      setError("Choose a PNG or WebP icon up to 32 KB.");
      return;
    }
    setReadingIcon(true);
    try {
      const image = await createImageBitmap(file);
      const tooLarge = Math.max(image.width, image.height) > 512;
      image.close();
      if (tooLarge) throw new Error("Choose an icon up to 512 pixels on each side.");
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the icon."));
        reader.readAsDataURL(file);
      });
      updateLink(index, { custom_icon: data });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read the icon.");
    } finally {
      setReadingIcon(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || saving || readingIcon) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await settingsRequest(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify(settings),
      });
      if (redirectIfUnauthorized(response)) return;
      if (response.status === 422) {
        const body = await response.json();
        const errors = body.errors as Record<string, string[]> | undefined;
        const invalidLink = Object.keys(errors ?? {}).find((field) => /^social_links\.\d+\./.test(field));
        if (invalidLink) {
          const [, position, field] = invalidLink.split(".");
          const detail = field === "url" ? "Enter a valid URL beginning with https://."
            : field === "custom_icon" ? "Choose a PNG or WebP icon up to 32 KB and 512 pixels on each side."
            : errors?.[invalidLink]?.[0];
          throw new Error(`Social link ${Number(position) + 1}. ${detail}`);
        }
        throw new Error(Object.values(errors ?? {})[0]?.[0] || "Check your details and try again.");
      }
      if (!response.ok) throw new Error("Could not save the settings. Try again.");
      const body = await response.json();
      setSettings(body.data);
      setNotice("Platform settings saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#082f5b]">
      <SuperAdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
        <h1 className="text-3xl font-bold">Platform settings</h1>
        <p className="mt-2 text-sm text-slate-600">Manage the contact details and social links shown in site footers.</p>
        {!settings && <p role={error ? "alert" : "status"} className={`mt-6 text-sm ${error ? "text-red-700" : "text-slate-600"}`}>{error || "Loading settings…"}</p>}
        {settings && (
          <form onSubmit={save} className="mt-6 space-y-5">
            <fieldset disabled={saving || readingIcon} className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="platform-details">
                <h2 id="platform-details" className="text-xl font-bold">Public details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {details.map(({ name, label, type, max }) => (
                    <label key={name} className="grid min-w-0 gap-1.5 text-sm font-semibold">
                      {label}
                      <input type={type} maxLength={max} value={settings[name] ?? ""} className="input min-w-0"
                        onChange={(event) => setSettings({ ...settings, [name]: event.target.value })} />
                    </label>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="social-links">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="social-links" className="text-xl font-bold">Social links</h2>
                  <button type="button" disabled={settings.social_links.length >= 12}
                    className="min-h-11 shrink-0 whitespace-nowrap rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-50"
                    onClick={() => setSettings({ ...settings, social_links: [...settings.social_links, { label: "", url: "", icon: "link" }] })}>
                    Add social link
                  </button>
                </div>
                {settings.social_links.length === 0 && <p className="mt-3 text-sm text-slate-600">No social links added yet.</p>}
                <div className="mt-4 space-y-4">
                  {settings.social_links.map((link, index) => (
                    <fieldset key={index} className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
                      <legend className="px-1 text-sm font-bold">Social link {index + 1}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                          Link label
                          <input required maxLength={50} value={link.label} className="input min-w-0"
                            onChange={(event) => updateLink(index, { label: event.target.value })} />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                          Social profile URL
                          <input required type="url" placeholder="https://" maxLength={500} value={link.url} className="input min-w-0"
                            onChange={(event) => updateLink(index, { url: event.target.value })} />
                        </label>
                        <div className="grid min-w-0 gap-1.5 text-sm font-semibold">
                          <label htmlFor={`social-icon-${index}`}>Icon</label>
                          <select id={`social-icon-${index}`} value={link.icon} className="input min-w-0"
                            onChange={(event) => updateLink(index, { icon: event.target.value as SocialLink["icon"] })}>
                            {Object.entries(socialIcons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </div>
                        {link.icon === "custom" && (
                          <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                            Custom icon
                            <input type="file" accept="image/png,image/webp" className="min-w-0 max-w-full text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2 file:py-2"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) void uploadIcon(index, file);
                              }} />
                            <span className="font-normal text-slate-600">PNG or WebP, up to 32 KB and 512 × 512 pixels.</span>
                          </label>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="grid size-11 place-items-center rounded-full bg-slate-100" aria-label="Icon preview" role="img"><SocialIcon link={link} /></span>
                        <button type="button" className="min-h-11 whitespace-nowrap px-2 text-sm font-semibold text-red-700 underline"
                          onClick={() => setSettings({ ...settings, social_links: settings.social_links.filter((_, position) => position !== index) })}>
                          Remove link
                        </button>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving || readingIcon}
                className="min-h-11 shrink-0 whitespace-nowrap rounded-xl bg-[#082f5b] px-5 text-sm font-bold text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save settings"}
              </button>
              {error && <p className="min-w-0 text-sm text-red-700" role="alert">{error}</p>}
              {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
