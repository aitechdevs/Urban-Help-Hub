"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
  const [openLink, setOpenLink] = useState<number | null>(null);
  const [invalidLinkIndex, setInvalidLinkIndex] = useState<number | null>(null);
  const scrollToLink = useRef(false);

  useEffect(() => {
    if (!scrollToLink.current || openLink === null) return;
    scrollToLink.current = false;
    document.getElementById(`social-link-toggle-${openLink}`)?.focus({ preventScroll: true });
    document.getElementById(`social-link-${openLink}`)?.scrollIntoView({ block: "nearest" });
  }, [openLink, error]);

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
    setInvalidLinkIndex(null);
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
    setInvalidLinkIndex(null);
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
          const index = Number(position);
          const detail = field === "url" ? "Enter a valid URL beginning with https://."
            : field === "custom_icon" ? "Choose a PNG or WebP icon up to 32 KB and 512 pixels on each side."
            : field === "label" ? "Enter a link label of up to 50 characters."
            : "Check the icon selected for this social link.";
          scrollToLink.current = true;
          setOpenLink(index);
          setInvalidLinkIndex(index);
          throw new Error(detail);
        }
        throw new Error(Object.values(errors ?? {})[0]?.[0] || "Check your details and try again.");
      }
      if (response.status === 413) throw new Error("The server could not accept this upload size. Try using smaller custom icon files.");
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

  function addLink() {
    if (!settings) return;
    scrollToLink.current = true;
    setOpenLink(settings.social_links.length);
    setNotice("");
    setSettings({
      ...settings,
      social_links: [...settings.social_links, { label: "", url: "", icon: "link" }],
    });
  }

  function removeLink(index: number) {
    if (!settings) return;
    setOpenLink(null);
    setError("");
    setInvalidLinkIndex(null);
    setNotice("");
    setSettings({ ...settings, social_links: settings.social_links.filter((_, position) => position !== index) });
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
                  <button type="button"
                    className="min-h-11 shrink-0 whitespace-nowrap rounded-xl border border-slate-300 px-4 text-sm font-bold"
                    onClick={addLink}>
                    Add social link
                  </button>
                </div>
                {settings.social_links.length === 0 && <p className="mt-3 text-sm text-slate-600">No social links added yet.</p>}
                <ul className="mt-4 space-y-2">
                  {settings.social_links.map((link, index) => {
                    const expanded = openLink === index;
                    const label = link.label.trim() || "New social link";

                    return (
                      <li key={index} id={`social-link-${index}`} className="min-w-0 scroll-m-4 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          id={`social-link-toggle-${index}`}
                          aria-expanded={expanded}
                          aria-controls={`social-link-panel-${index}`}
                          aria-label={`${expanded ? "Close editor for" : "Edit"} ${label}`}
                          className="flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4"
                          onClick={() => setOpenLink(expanded ? null : index)}
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100" aria-hidden="true">
                            <SocialIcon link={link} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold [overflow-wrap:anywhere]">{label}</span>
                            {link.url && <span className="block truncate text-xs text-slate-600">{link.url}</span>}
                          </span>
                          {!expanded && <span aria-hidden="true" className="shrink-0 text-xs font-semibold">Edit</span>}
                          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}>
                            <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <div id={`social-link-panel-${index}`} hidden={!expanded}>
                          {expanded && (
                            <fieldset aria-labelledby={`social-link-toggle-${index}`} className="min-w-0 border-t border-slate-200 p-3 sm:p-4">
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
                              {error && invalidLinkIndex === index && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
                              <div className="mt-3 flex justify-end">
                                <button type="button" className="min-h-11 whitespace-nowrap px-2 text-sm font-semibold text-red-700 underline"
                                  onClick={() => removeLink(index)}>
                                  Remove link
                                </button>
                              </div>
                            </fieldset>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </fieldset>
            <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-[#f6f8fb] py-3">
              <button type="submit" disabled={saving || readingIcon}
                className="min-h-11 shrink-0 whitespace-nowrap rounded-xl bg-[#082f5b] px-5 text-sm font-bold text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save settings"}
              </button>
              {error && (invalidLinkIndex === null || invalidLinkIndex !== openLink) && (
                <p className="min-w-0 text-sm text-red-700" role="alert">
                  {invalidLinkIndex !== null && `Social link ${invalidLinkIndex + 1}. `}{error}
                </p>
              )}
              {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
