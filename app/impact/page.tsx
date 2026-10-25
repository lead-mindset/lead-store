import { ImpactView } from "@/components/views/ImpactView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.impact.over);

export default function Page() {
  return <ImpactView />;
}
