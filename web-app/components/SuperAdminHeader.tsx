import type { ReactNode } from "react";
import SiteLogo from "@/components/SiteLogo";

export default function SuperAdminHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-slate-200 bg-white text-[#082f5b]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SiteLogo href="/admin/" />
          <span className="rounded-full bg-[#082f5b] px-3 py-1 text-xs font-bold text-white">Super Admin</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold underline" aria-label="Super Admin navigation">
          {children}
          <a href="/admin/">Back to Admin dashboard</a>
        </nav>
      </div>
    </header>
  );
}
