import SiteLogo from "@/components/SiteLogo";

export function HelperReviewLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-center">
      <div>
        <SiteLogo href="/admin/" />
        <p className="mt-4 font-semibold text-slate-500" role="status">Loading Helper application…</p>
      </div>
    </main>
  );
}
