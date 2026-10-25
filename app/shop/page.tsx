import { Suspense } from "react";
import { ShopView } from "@/components/views/ShopView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.shop.title);

export default function Page() {
  return (
    <Suspense>
      <ShopView />
    </Suspense>
  );
}
