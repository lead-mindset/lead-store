import { Suspense } from "react";
import { SearchView } from "@/components/views/SearchView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.header.search);

export default function Page() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
