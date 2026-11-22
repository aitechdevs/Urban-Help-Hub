import { Suspense } from "react";
import HelperReviewClient from "./HelperReviewClient";

// A single statically exported page handles every Helper ID from the query string.
// The client component is behind Suspense as required for useSearchParams().
export default function HelperReviewPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-50 font-semibold text-slate-500">Loading Helper application…</main>}>
      <HelperReviewClient />
    </Suspense>
  );
}
