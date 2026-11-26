import { Suspense } from "react";
import HelperReviewClient from "./HelperReviewClient";
import { HelperReviewLoading } from "./HelperReviewLoading";

// A single statically exported page handles every Helper ID from the query string.
// The client component is behind Suspense as required for useSearchParams().
export default function HelperReviewPage() {
  return (
    <Suspense fallback={<HelperReviewLoading />}>
      <HelperReviewClient />
    </Suspense>
  );
}
