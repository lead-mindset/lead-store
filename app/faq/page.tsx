import { Suspense } from "react";
import { FaqView } from "@/components/views/FaqView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.footer.faqs);

export default function Page() {
  return (
    <Suspense>
      <FaqView />
    </Suspense>
  );
}
