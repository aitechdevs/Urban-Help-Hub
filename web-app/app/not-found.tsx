import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-[#082f5b]">
      <div>
        <SiteLogo />
        <h1 className="mt-6 text-3xl font-bold">Page not found</h1>
        <Link href="/" prefetch={false} className="mt-5 inline-block rounded-xl bg-[#082f5b] px-5 py-3 font-semibold text-white">
          Back to UrbanHelpHub
        </Link>
      </div>
    </main>
  );
}
