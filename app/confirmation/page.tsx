import { ConfirmationView } from "@/components/views/ConfirmationView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.confirm.status);

export default function Page() {
  return <ConfirmationView />;
}
