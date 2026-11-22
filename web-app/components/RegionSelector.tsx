"use client";

import { useEffect, useRef, useState } from "react";
import { getStoredUser, REGIONS } from "@/lib/regions";
import { LANGUAGE_NAMES } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { API_URL } from "@/lib/api";

function CircularFlag({ countryCode, country, size = "h-8 w-8" }: { countryCode: string; country: string; size?: string }) {
  return (
    <span className={`${size} block shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm`}>
      <img
        src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
        alt={`${country} flag`}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function getToken() {
  return sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
}

function saveStoredUser(user: Record<string, unknown>) {
  const serialized = JSON.stringify(user);
  if (localStorage.getItem("urbanhelphub_user")) localStorage.setItem("urbanhelphub_user", serialized);
  if (sessionStorage.getItem("urbanhelphub_user")) sessionStorage.setItem("urbanhelphub_user", serialized);
}

export default function RegionSelector() {
  const { t } = useLanguage();
  const wrapper = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countryCode, setCountryCode] = useState(() => {
    const stored = getStoredUser();
    return typeof stored?.country_code === "string" ? stored.country_code : "CA";
  });
  const [languageCode, setLanguageCode] = useState(() => {
    const stored = getStoredUser();
    return typeof stored?.language_code === "string" ? stored.language_code : "en";
  });
  const region = REGIONS.find((item) => item.countryCode === countryCode) || REGIONS[1];

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function choose(nextCountryCode: string) {
    const token = getToken();
    if (!token || saving || nextCountryCode === countryCode) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/user/preferences`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ country_code: nextCountryCode }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update country.");
      saveStoredUser(result.data.user);
      setCountryCode(nextCountryCode);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update country.");
    } finally {
      setSaving(false);
    }
  }

  async function chooseLanguage(nextLanguageCode: string) {
    const token = getToken();
    if (!token || saving || nextLanguageCode === languageCode) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/user/preferences`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ country_code: countryCode, language_code: nextLanguageCode }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update language.");
      saveStoredUser(result.data.user);
      setLanguageCode(nextLanguageCode);
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update language.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        aria-label={`Country: ${region.country}. Currency: ${region.currency}`}
        aria-expanded={open}
        title={`${region.country} · ${region.currency}`}
      >
        <CircularFlag countryCode={region.countryCode} country={region.country} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[90] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-black text-[#082f5b]">{t("countryCurrency")}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t("preferenceHelp")}</p>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {REGIONS.map((item) => (
              <button
                type="button"
                key={item.countryCode}
                disabled={saving}
                onClick={() => choose(item.countryCode)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50 ${item.countryCode === countryCode ? "bg-emerald-50" : ""}`}
              >
                <CircularFlag countryCode={item.countryCode} country={item.country} size="h-9 w-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#082f5b]">{item.country}</span>
                  <span className="block text-xs font-semibold text-slate-500">{item.currency}</span>
                </span>
                {item.countryCode === countryCode && <span className="font-black text-emerald-600">✓</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{t("language")}</p>
            <div className="flex flex-wrap gap-2">
              {region.languages.map((code) => (
                <button
                  type="button"
                  key={code}
                  disabled={saving}
                  onClick={() => chooseLanguage(code)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${code === languageCode ? "bg-[#082f5b] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                >
                  {LANGUAGE_NAMES[code] || code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
