import { GroupView } from "@/components/views/GroupView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.group.title);

export default function Page() {
  return <GroupView />;
}
