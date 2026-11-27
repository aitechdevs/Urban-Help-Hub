"use client";

import { useEffect, useState } from "react";
import SocialIcon from "@/components/SocialIcon";
import { API_URL } from "@/lib/api";
import type { PlatformSettings } from "@/lib/platform-settings";

export default function PlatformFooterDetails({ defaultTagline }: { defaultTagline?: string }) {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  useEffect(() => {
    const request = new AbortController();
    fetch(`${API_URL}/platform-settings`, { signal: request.signal })
      .then(async (response) => {
        if (response.ok) setSettings((await response.json()).data);
      })
      .catch(() => {});
    return () => request.abort();
  }, []);

  const tagline = settings?.tagline || defaultTagline;
  const links = settings?.social_links.filter(({ url }) => /^https:\/\//i.test(url)) ?? [];
  if (!settings?.display_name && !tagline && !settings?.support_email && !settings?.support_phone && !links.length) {
    return null;
  }

  return (
    <div className="min-w-0 max-w-sm space-y-3 text-sm text-slate-600 [overflow-wrap:anywhere]">
      {settings?.display_name && <p className="font-bold text-[#082f5b]">{settings.display_name}</p>}
      {tagline && <p className="leading-6">{tagline}</p>}
      {(settings?.support_email || settings?.support_phone) && (
        <div className="grid justify-items-start gap-1">
          {settings.support_email && <a className="hover:underline" href={`mailto:${settings.support_email}`}>{settings.support_email}</a>}
          {settings.support_phone && <a className="hover:underline" href={`tel:${settings.support_phone.replace(/[^0-9+]/g, "")}`}>{settings.support_phone}</a>}
        </div>
      )}
      {links.length > 0 && (
        <nav aria-label="Social media">
          <ul className="flex flex-wrap gap-2">
            {links.map((link, index) => (
              <li key={`${link.url}-${index}`}>
                <a
                  href={link.url}
                  aria-label={link.label}
                  title={link.label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[#082f5b] transition-colors hover:border-[#082f5b] hover:bg-[#082f5b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <SocialIcon link={link} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
