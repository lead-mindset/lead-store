import { AccountView } from "@/components/views/AccountView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.header.account);

export default function Page() {
  return <AccountView />;
}
