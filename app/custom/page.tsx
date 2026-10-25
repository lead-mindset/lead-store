import { Suspense } from "react";
import { CustomView } from "@/components/views/CustomView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.custom.title);

export default function Page() {
  return (
    <Suspense>
      <CustomView />
    </Suspense>
  );
}
