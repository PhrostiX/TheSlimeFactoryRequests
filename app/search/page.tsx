import { Suspense } from "react";
import SearchClient from "./SearchClient";

// useSearchParams() requires a Suspense boundary.
// Marking this page dynamic also avoids static prerender issues on Vercel.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <SearchClient />
    </Suspense>
  );
}
